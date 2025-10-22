import { serve } from "@/integrations/metahub/client";
import { createClient } from "@/integrations/metahub/client";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const metahubUrl = Deno.env.get("METAHUB_URL")!;
    const metahubKey = Deno.env.get("METAHUB_SERVICE_ROLE_KEY")!;
    const metahub = createClient(metahubUrl, metahubKey);

    const { data: smtpSettings } = await metahub
      .from("site_settings")
      .select("key, value")
      .in("key", ["smtp_host", "smtp_port", "smtp_username", "smtp_password", "smtp_from_email", "smtp_from_name"]);

    if (!smtpSettings || smtpSettings.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "SMTP ayarları bulunamadı"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const settingsMap = smtpSettings.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, any>);

    const smtpHost = settingsMap.smtp_host;
    const smtpPort = settingsMap.smtp_port;
    const smtpUsername = settingsMap.smtp_username;
    const smtpPassword = settingsMap.smtp_password;
    const smtpFromEmail = settingsMap.smtp_from_email;

    if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword || !smtpFromEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "SMTP ayarları eksik"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Test SMTP connection by attempting to connect
    try {
      const conn = await Deno.connect({
        hostname: smtpHost,
        port: smtpPort,
        transport: smtpPort === 465 ? "tcp" : "tcp",
      });

      conn.close();

      return new Response(
        JSON.stringify({
          success: true,
          message: "SMTP bağlantısı başarılı"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (connError: any) {
      console.error("SMTP connection error:", connError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `SMTP sunucusuna bağlanılamadı: ${connError.message}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in test-smtp function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
