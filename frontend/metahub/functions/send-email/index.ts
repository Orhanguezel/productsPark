import { serve } from "@/integrations/metahub/client";
import { createClient } from "@/integrations/metahub/client";
import { SMTPClient } from "@/integrations/metahub/client";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to?: string;
  userId?: string;
  template_key: string;
  variables: Record<string, string>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const metahubUrl = Deno.env.get("METAHUB_URL")!;
    const metahubKey = Deno.env.get("METAHUB_SERVICE_ROLE_KEY")!;
    const metahub = createClient(metahubUrl, metahubKey);

    const { to, userId, template_key, variables }: EmailRequest = await req.json();

    let recipientEmail = to;

    // If userId is provided instead of email, fetch the email
    if (!recipientEmail && userId) {
      const { data: { user }, error: userError } = await metahub.auth.admin.getUserById(userId);
      if (userError || !user?.email) {
        console.error("User fetch error:", userError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "User not found or has no email"
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      recipientEmail = user.email;

      // Also get user's full_name for variables if not provided
      if (!variables.user_name) {
        const { data: profile } = await metahub
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .single();

        if (profile?.full_name) {
          variables.user_name = profile.full_name;
        }
      }
    }

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No recipient email provided"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Processing email request:", { to: recipientEmail, template_key });

    // Fetch the email template
    const { data: template, error: templateError } = await metahub
      .from("email_templates")
      .select("*")
      .eq("template_key", template_key)
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      console.error("Template error:", templateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email template not found or inactive"
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Template found:", template.template_name);

    // Fetch SMTP settings
    const { data: smtpSettings, error: settingsError } = await metahub
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "smtp_host",
        "smtp_port",
        "smtp_ssl",
        "smtp_username",
        "smtp_password",
        "smtp_from_email",
        "smtp_from_name",
        "smtp_starttls"
      ]);

    if (settingsError || !smtpSettings || smtpSettings.length === 0) {
      console.error("SMTP settings error:", settingsError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "SMTP settings not configured"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const settings = smtpSettings.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, any>);

    console.log("SMTP settings loaded:", {
      host: settings.smtp_host,
      port: settings.smtp_port,
      ssl: settings.smtp_ssl,
      starttls: settings.smtp_starttls,
      username: settings.smtp_username,
      from_email: settings.smtp_from_email,
      password_length: settings.smtp_password?.length || 0
    });

    // Get site_name from settings if not provided
    if (!variables.site_name) {
      const { data: siteSetting } = await metahub
        .from("site_settings")
        .select("value")
        .eq("key", "site_title")
        .single();

      if (siteSetting?.value) {
        variables.site_name = siteSetting.value;
      } else {
        variables.site_name = 'Dijital Market';
      }
    }

    // Replace variables in subject and content
    let subject = template.subject;
    let content = template.content;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      content = content.replace(regex, value);
    }

    console.log("Email prepared - Subject:", subject);

    // Send email via SMTP with manual DATA command
    try {
      const port = parseInt(settings.smtp_port);
      const useSsl = settings.smtp_ssl === 'true' || settings.smtp_ssl === true;

      console.log("Attempting SMTP connection with:", {
        hostname: settings.smtp_host,
        port: port,
        tls: useSsl,
        username: settings.smtp_username,
        from: settings.smtp_from_email
      });

      // Generate RFC-compliant Message-ID
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const domain = settings.smtp_from_email.split('@')[1];
      const messageId = `<${timestamp}@${domain}>`;

      // Create RFC 5322 compliant date
      const emailDate = new Date().toUTCString();

      // Base64 encode the HTML content
      const textEncoder = new TextEncoder();
      const contentBytes = textEncoder.encode(content);
      const base64Content = btoa(String.fromCharCode(...contentBytes));

      // Build the complete raw email message with all headers
      const rawEmail = [
        `From: "${settings.smtp_from_name}" <${settings.smtp_from_email}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `Date: ${emailDate}`,
        `Message-ID: ${messageId}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        `Content-Transfer-Encoding: base64`,
        ``,
        base64Content,
      ].join('\r\n');

      console.log("=== RAW EMAIL MESSAGE ===");
      console.log(rawEmail.split('\r\n').slice(0, 10).join('\n')); // Print first 10 lines
      console.log("=== END HEADERS ===");

      // Connect to SMTP server
      let conn;
      if (useSsl && port === 465) {
        conn = await Deno.connectTls({
          hostname: settings.smtp_host,
          port: port,
        });
        console.log("Connected with TLS");
      } else {
        conn = await Deno.connect({
          hostname: settings.smtp_host,
          port: port,
        });
        console.log("Connected without TLS");
      }

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // Helper to read server response
      const readResponse = async () => {
        const buffer = new Uint8Array(1024);
        const n = await conn.read(buffer);
        if (n) {
          const response = decoder.decode(buffer.subarray(0, n));
          console.log("Server:", response.trim());
          return response;
        }
        return "";
      };

      // Helper to send command
      const sendCommand = async (cmd: string) => {
        console.log("Client:", cmd.trim());
        await conn.write(encoder.encode(cmd + "\r\n"));
      };

      try {
        // Read greeting
        await readResponse();

        // EHLO
        await sendCommand(`EHLO ${domain}`);
        await readResponse();

        // AUTH LOGIN
        await sendCommand("AUTH LOGIN");
        await readResponse();

        // Send username (base64)
        const usernameB64 = btoa(settings.smtp_username);
        await sendCommand(usernameB64);
        await readResponse();

        // Send password (base64)
        const passwordB64 = btoa(settings.smtp_password);
        await sendCommand(passwordB64);
        await readResponse();

        // MAIL FROM
        await sendCommand(`MAIL FROM:<${settings.smtp_from_email}>`);
        await readResponse();

        // RCPT TO
        await sendCommand(`RCPT TO:<${recipientEmail}>`);
        await readResponse();

        // DATA
        await sendCommand("DATA");
        await readResponse();

        // Send the actual email content
        await conn.write(encoder.encode(rawEmail + "\r\n.\r\n"));
        console.log("Email data sent");
        const dataResponse = await readResponse();

        // QUIT
        await sendCommand("QUIT");
        await readResponse();

        conn.close();

        console.log("Email sent successfully to:", recipientEmail);
      } catch (smtpError) {
        conn.close();
        throw smtpError;
      }

      console.log("Email sent successfully to:", recipientEmail);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Email sent successfully"
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } catch (smtpError: any) {
      console.error("SMTP send error:", smtpError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to send email: ${smtpError.message}`
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
