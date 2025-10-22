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

    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Deleting orders for user:", email);

    // Find user by email
    const { data: authUsers, error: authError } = await metahub.auth.admin.listUsers();

    if (authError) {
      console.error("Error fetching users:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const user = authUsers.users.find(u => u.email === email);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Found user:", user.id);

    // Get all orders for this user
    const { data: orders, error: ordersError } = await metahub
      .from("orders")
      .select("id")
      .eq("user_id", user.id);

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      return new Response(
        JSON.stringify({ error: ordersError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!orders || orders.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No orders found for this user", deletedCount: 0 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const orderIds = orders.map(o => o.id);
    console.log(`Found ${orderIds.length} orders to delete`);

    // First, get all order item IDs
    const { data: orderItems, error: fetchItemsError } = await metahub
      .from("order_items")
      .select("id")
      .in("order_id", orderIds);

    if (fetchItemsError) {
      console.error("Error fetching order items:", fetchItemsError);
      return new Response(
        JSON.stringify({ error: fetchItemsError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const orderItemIds = orderItems?.map(item => item.id) || [];

    // Clear product_stock references first
    if (orderItemIds.length > 0) {
      const { error: stockUpdateError } = await metahub
        .from("product_stock")
        .update({ order_item_id: null, is_used: false, used_at: null })
        .in("order_item_id", orderItemIds);

      if (stockUpdateError) {
        console.error("Error updating product stock:", stockUpdateError);
      }
    }

    // Delete order items
    const { error: itemsError } = await metahub
      .from("order_items")
      .delete()
      .in("order_id", orderIds);

    if (itemsError) {
      console.error("Error deleting order items:", itemsError);
      return new Response(
        JSON.stringify({ error: itemsError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Delete payment requests
    const { error: paymentError } = await metahub
      .from("payment_requests")
      .delete()
      .in("order_id", orderIds);

    if (paymentError) {
      console.error("Error deleting payment requests:", paymentError);
    }

    // Delete orders
    const { error: deleteError } = await metahub
      .from("orders")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting orders:", deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Successfully deleted ${orderIds.length} orders`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully deleted ${orderIds.length} orders`,
        deletedCount: orderIds.length
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in delete-user-orders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
