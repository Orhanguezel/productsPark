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
    // Get JWT token from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const metahubUrl = Deno.env.get("METAHUB_URL")!;
    const metahubKey = Deno.env.get("METAHUB_SERVICE_ROLE_KEY")!;
    const metahubAnonKey = Deno.env.get("METAHUB_ANON_KEY")!;

    // Create client with service role for operations
    const metahubAdmin = createClient(metahubUrl, metahubKey);

    // Create client with user's JWT for auth verification
    const token = authHeader.replace("Bearer ", "");
    const metahubClient = createClient(metahubUrl, metahubAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await metahubClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if user is admin OR deleting their own account
    const { data: isAdmin } = await metahubAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    const isOwnAccount = user.id === userId;

    if (!isAdmin && !isOwnAccount) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: You can only delete your own account or must be an admin" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Deleting user:", userId, "Requested by:", user.id, "Is admin:", isAdmin);

    // Delete user from auth.users (this will cascade delete to profiles due to foreign key)
    const { error: deleteError } = await metahubAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("User deleted successfully:", userId);

    return new Response(
      JSON.stringify({ success: true, message: "User deleted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in delete-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
