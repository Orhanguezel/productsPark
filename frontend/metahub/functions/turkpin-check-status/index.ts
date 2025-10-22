import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@/integrations/metahub/client";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckStatusRequest {
  orderItemId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const metahubUrl = Deno.env.get('METAHUB_URL')!;
    const metahubKey = Deno.env.get('METAHUB_SERVICE_ROLE_KEY')!;
    const metahub = createClient(metahubUrl, metahubKey);

    const body = await req.json() as CheckStatusRequest;
    const orderItemId = body?.orderItemId;

    console.log('Starting Turkpin order status sync...', orderItemId ? `for order item ${orderItemId}` : 'for all pending orders');

    // Get pending/processing order items with Turkpin order numbers
    let query = metahub
      .from('order_items')
      .select(`
        id,
        turkpin_order_no,
        delivery_status,
        order_id,
        product_id,
        products!inner (
          api_provider_id,
          product_type
        )
      `)
      .not('turkpin_order_no', 'is', null)
      .in('delivery_status', ['pending', 'processing']);

    if (orderItemId) {
      query = query.eq('id', orderItemId);
    }

    const { data: orderItems, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    if (!orderItems || orderItems.length === 0) {
      console.log('No orders to check');
      return new Response(
        JSON.stringify({ success: true, checked: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${orderItems.length} orders to check`);

    let successCount = 0;

    // Check each order
    for (const item of orderItems) {
      try {
        const productData = Array.isArray(item.products) ? item.products[0] : item.products;

        if (!productData?.api_provider_id) {
          console.log(`Order item ${item.id} has no API provider, skipping`);
          continue;
        }

        // Get provider details
        const { data: provider, error: providerError } = await metahub
          .from('api_providers')
          .select('*')
          .eq('id', productData.api_provider_id)
          .single();

        if (providerError || !provider) {
          console.error(`Provider not found for order item ${item.id}`);
          continue;
        }

        // Prepare status check request
        const xmlData = `<APIRequest>
  <params>
    <cmd>siparisDurumu</cmd>
    <username>${provider.api_key.split(':')[0] || provider.api_key}</username>
    <password>${provider.api_key.split(':')[1] || provider.api_key}</password>
    <siparisNo>${item.turkpin_order_no}</siparisNo>
  </params>
</APIRequest>`;

        const formData = new FormData();
        formData.append('DATA', xmlData);

        const apiResponse = await fetch(provider.api_url, {
          method: 'POST',
          body: formData,
        });

        const responseText = await apiResponse.text();
        console.log(`Status check response for ${item.turkpin_order_no}:`, responseText);

        // Parse XML response using regex
        const getValue = (tag: string) => {
          const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`);
          const match = responseText.match(regex);
          return match ? match[1] : null;
        };

        const durumKodu = getValue('DURUM_KODU');
        const siparisDurumu = getValue('SIPARIS_DURUMU');
        const siparisDurumuAciklama = getValue('SIPARIS_DURUMU_ACIKLAMA');
        const ekstra = getValue('EKSTRA');

        // Map Turkpin status to our system
        let newDeliveryStatus = item.delivery_status;
        let deliveryContent = null;
        let deliveryError = null;
        let orderStatus = null;

        // Check for problems (status code 999) FIRST
        if (durumKodu === '999') {
          newDeliveryStatus = 'failed';
          deliveryError = ekstra || siparisDurumuAciklama;
          orderStatus = 'cancelled';
          console.log(`Order ${item.turkpin_order_no} failed with code 999:`, deliveryError);
        } else {
          switch (siparisDurumu) {
            case '3': // Cancelled - check this before completed
              newDeliveryStatus = 'failed';
              deliveryError = ekstra || siparisDurumuAciklama;
              orderStatus = 'cancelled';
              console.log(`Order ${item.turkpin_order_no} was cancelled by Turkpin`);
              break;
            case '2': // Completed
              newDeliveryStatus = 'delivered';
              orderStatus = 'completed';

              // Extract epin codes using regex
              const epinPattern = /<epin>([\s\S]*?)<\/epin>/g;
              const codes: string[] = [];
              let epinMatch;

              while ((epinMatch = epinPattern.exec(responseText)) !== null) {
                const epinContent = epinMatch[1];
                const codeMatch = epinContent.match(/<code>(.*?)<\/code>/);
                const descMatch = epinContent.match(/<desc>(.*?)<\/desc>/);

                const code = codeMatch ? codeMatch[1] : '';
                const desc = descMatch ? descMatch[1] : '';

                codes.push(desc ? `${code} (${desc})` : code);
              }

              if (codes.length > 0) {
                deliveryContent = codes.join('\n');
              }
              break;
            case '1': // Processing
              newDeliveryStatus = 'processing';
              break;
            case '99': // Delivery stage
            case '199': // Pre-order delivery stage
              newDeliveryStatus = 'processing';
              break;
          }
        }

        // Update order item
        const updateData: any = {
          delivery_status: newDeliveryStatus,
          api_response_log: {
            checked_at: new Date().toISOString(),
            status_code: durumKodu,
            order_status: siparisDurumu,
            description: siparisDurumuAciklama,
            extra: ekstra
          }
        };

        if (deliveryContent) updateData.delivery_content = deliveryContent;
        if (deliveryError) updateData.delivery_error = deliveryError;

        await metahub
          .from('order_items')
          .update(updateData)
          .eq('id', item.id);

        // Update parent order status if needed
        if (orderStatus) {
          await metahub
            .from('orders')
            .update({ status: orderStatus })
            .eq('id', item.order_id);
        }

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

        successCount++;
      } catch (error) {
        console.error(`Error checking order item ${item.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: successCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in turkpin-check-status function:', error);
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