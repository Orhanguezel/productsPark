import { createClient } from "@/integrations/metahub/client";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManualDeliveryRequest {
  orderItemId: string;
  deliveryContent: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const metahubUrl = Deno.env.get('METAHUB_URL')!;
    const metahubKey = Deno.env.get('METAHUB_SERVICE_ROLE_KEY')!;
    const metahub = createClient(metahubUrl, metahubKey);

    const { orderItemId, deliveryContent }: ManualDeliveryRequest = await req.json();

    console.log('Manual delivery request:', { orderItemId });

    if (!orderItemId || !deliveryContent) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get order item with order details
    const { data: orderItem, error: itemError } = await metahub
      .from('order_items')
      .select('*, orders(id, order_number, customer_name, customer_email, user_id, status)')
      .eq('id', orderItemId)
      .single();

    if (itemError || !orderItem) {
      console.error('Order item not found:', itemError);
      return new Response(
        JSON.stringify({ error: 'Order item not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const order = orderItem.orders as any;

    // Update order item with delivery content and status
    const { error: updateError } = await metahub
      .from('order_items')
      .update({
        delivery_content: deliveryContent,
        delivery_status: 'delivered',
      })
      .eq('id', orderItemId);

    if (updateError) {
      console.error('Error updating order item:', updateError);
      throw updateError;
    }

    console.log('Order item updated successfully');

    // Send delivery email
    try {
      const { data: siteSetting } = await metahub
        .from('site_settings')
        .select('value')
        .eq('key', 'site_title')
        .single();

      await metahub.functions.invoke('send-email', {
        body: {
          to: order.customer_email,
          template_key: 'order_item_delivery',
          variables: {
            customer_name: order.customer_name,
            order_number: order.order_number,
            product_name: orderItem.product_name,
            delivery_content: deliveryContent,
            site_name: siteSetting?.value || 'Platform',
          },
        },
      });

      console.log('Delivery email sent to:', order.customer_email);
    } catch (emailError) {
      console.error('Error sending delivery email:', emailError);
    }

    // Check if all items are delivered
    const { data: allItems } = await metahub
      .from('order_items')
      .select('delivery_status')
      .eq('order_id', order.id);

    const allDelivered = allItems?.every((item) => item.delivery_status === 'delivered');

    if (allDelivered) {
      // Update order status to completed
      await metahub
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', order.id);

      console.log('All items delivered, order completed');

      // Send order completed email
      try {
        const { data: siteSetting } = await metahub
          .from('site_settings')
          .select('value')
          .eq('key', 'site_title')
          .single();

        await metahub.functions.invoke('send-email', {
          body: {
            to: order.customer_email,
            template_key: 'order_completed',
            variables: {
              customer_name: order.customer_name,
              order_number: order.order_number,
              final_amount: '0',
              site_name: siteSetting?.value || 'Platform',
            },
          },
        });

        console.log('Order completed email sent');
      } catch (emailError) {
        console.error('Error sending order completed email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manual-delivery-email:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
