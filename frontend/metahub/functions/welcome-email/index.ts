import { serve } from "@/integrations/metahub/client";
import { createClient } from "@/integrations/metahub/client";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const metahubUrl = Deno.env.get("METAHUB_URL")!;
    const metahubKey = Deno.env.get("METAHUB_SERVICE_ROLE_KEY")!;
    const metahub = createClient(metahubUrl, metahubKey);

    // This function is triggered by auth.users insert
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const payload = await req.json();
    console.log("Welcome email trigger payload:", payload);

    const { record } = payload;

    if (!record || !record.email) {
      console.log("No email found in record");
      return new Response(
        JSON.stringify({ success: false, error: "No email in record" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile for full name
    const { data: profile } = await metahub
      .from("profiles")
      .select("full_name")
      .eq("id", record.id)
      .single();

    // Get site name from settings
    const { data: siteSettings } = await metahub
      .from("site_settings")
      .select("value")
      .eq("key", "site_title")
      .single();

    const userName = profile?.full_name || record.email.split("@")[0];
    const siteName = siteSettings?.value || "Platform";

    console.log("Sending welcome email to:", record.email);

    // Call send-email function
    const { data: emailResult, error: emailError } = await metahub.functions.invoke(
      "send-email",
      {
        body: {
          to: record.email,
          template_key: "welcome",
          variables: {
            user_name: userName,
            user_email: record.email,
            site_name: siteName,
          },
        },
      }
    );

    if (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Don't fail the registration if email fails
      return new Response(
        JSON.stringify({
          success: false,
          error: emailError.message,
          note: "User registration successful but email failed"
        }),
        {
          status: 200, // Return 200 so registration continues
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Welcome email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, data: emailResult }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in welcome-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 200, // Return 200 so registration continues
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
