import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@/integrations/metahub/client";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const metahubUrl = Deno.env.get('METAHUB_URL')!;
    const metahubKey = Deno.env.get('METAHUB_SERVICE_ROLE_KEY')!;
    const metahub = createClient(metahubUrl, metahubKey);

    // Check if a specific order ID was provided
    const { orderId } = await req.json().catch(() => ({}));

    console.log('Starting SMM order status sync...', orderId ? `for order ${orderId}` : 'for all orders');

    // Build query for order items with API order IDs that are not completed
    let query = metahub
      .from('order_items')
      .select(`
        *,
        order_id,
        products!inner(api_provider_id, api_product_id)
      `)
      .not('api_order_id', 'is', null)
      .in('delivery_status', ['pending', 'processing']);

    // If orderId is provided, filter by that order
    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    const { data: orderItems, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${orderItems?.length || 0} orders to sync`);

    for (const item of orderItems || []) {
      try {
        // Get API provider
        const { data: provider } = await metahub
          .from('api_providers')
          .select('*')
          .eq('id', item.products.api_provider_id)
          .single();

        if (!provider) continue;

        // Check order status
        const formData = new FormData();
        formData.append('key', provider.api_key);
        formData.append('action', 'status');
        formData.append('order', item.api_order_id);

        const apiResponse = await fetch(provider.api_url, {
          method: 'POST',
          body: formData,
        });

        const statusData = await apiResponse.json();
        console.log(`Status for order ${item.api_order_id}:`, statusData);

        // Map SMM status to our delivery_status
        let deliveryStatus = item.delivery_status;
        let orderStatus = 'processing';

        // Check for failed/cancelled statuses first
        if (statusData.status === 'Canceled' || statusData.status === 'Cancelled') {
          deliveryStatus = 'failed';
          orderStatus = 'cancelled';
          console.log(`Order ${item.api_order_id} was cancelled by API`);
        } else if (statusData.error || statusData.status === 'Error') {
          deliveryStatus = 'failed';
          orderStatus = 'cancelled';
          console.log(`Order ${item.api_order_id} failed:`, statusData.error || 'Unknown error');
        } else if (statusData.status === 'Completed') {
          deliveryStatus = 'delivered';
          orderStatus = 'completed';
        } else if (statusData.status === 'Partial') {
          deliveryStatus = 'processing';
          orderStatus = 'processing';
        } else if (statusData.status === 'In progress' || statusData.status === 'Pending') {
          deliveryStatus = 'processing';
          orderStatus = 'processing';
        }

        // Update order item
        await metahub
          .from('order_items')
          .update({ delivery_status: deliveryStatus })
          .eq('id', item.id);

        // Update parent order status
        await metahub
          .from('orders')
          .update({ status: orderStatus })
          .eq('id', item.order_id);

        console.log(`Updated order item ${item.id} to ${deliveryStatus}`);

        // Send email if order completed
        if (orderStatus === 'completed') {
          try {
            const { data: order } = await metahub
              .from('orders')
              .select('customer_name, customer_email, order_number, final_amount')
              .eq('id', item.order_id)
              .single();

            const { data: siteSetting } = await metahub
              .from('site_settings')
              .select('value')
              .eq('key', 'site_name')
              .single();

            if (order) {
              await metahub.functions.invoke('send-email', {
                body: {
                  to: order.customer_email,
                  template_key: 'order_completed',
                  variables: {
                    customer_name: order.customer_name,
                    order_number: order.order_number,
                    final_amount: order.final_amount?.toString() || '0',
                    site_name: siteSetting?.value || 'Dijital Market'
                  }
                }
              });
              console.log(`Sent completion email for order ${order.order_number}`);
            }
          } catch (emailError) {
            console.error(`Error sending completion email:`, emailError);
          }
        }
      } catch (error) {
        console.error(`Error syncing order item ${item.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: orderItems?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in smm-api-status function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});