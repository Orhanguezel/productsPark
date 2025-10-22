import { createClient } from "@/integrations/metahub/client";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const metahubUrl = Deno.env.get('METAHUB_URL')!;
    const metahubKey = Deno.env.get('METAHUB_SERVICE_ROLE_KEY')!;
    const metahub = createClient(metahubUrl, metahubKey);

    const payload = await req.json();
    console.log('Shopier callback received:', payload);

    const {
      platform_order_id,
      status,
      payment_id,
      signature,
      API_key,
      random_nr
    } = payload;

    if (!platform_order_id) {
      console.error('Missing platform_order_id in callback');
      return new Response('Missing order_id', { status: 400 });
    }

    // Get Shopier API Secret for signature verification
    const { data: settings } = await metahub
      .from('site_settings')
      .select('value')
      .eq('key', 'shopier_client_secret')
      .single();

    if (settings) {
      const apiSecret = settings.value;

      // Verify signature
      // Signature = base64(sha256(API_key + payment_id + API_secret + random_nr + platform_order_id))
      const signatureData = `${API_key}${payment_id}${apiSecret}${random_nr}${platform_order_id}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(signatureData);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const calculatedSignature = btoa(String.fromCharCode(...hashArray));

      if (calculatedSignature !== signature) {
        console.error('Invalid signature');
        return new Response('Invalid signature', { status: 403 });
      }
    }

    // Find the order by order_number (platform_order_id)
    const { data: orders, error: orderError } = await metahub
      .from('orders')
      .select('*, coupon_id')
      .eq('order_number', platform_order_id);

    if (orderError || !orders || orders.length === 0) {
      console.error('Order not found:', platform_order_id);
      return new Response('Order not found', { status: 404 });
    }

    const order = orders[0];

    // Update order based on payment status
    if (status === 'success') {
      console.log('Payment successful, updating order:', order.id);

      // Update order status and get customer details
      const { data: updatedOrder, error: updateError } = await metahub
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'processing',
          payment_method: 'shopier',
        })
        .eq('id', order.id)
        .select('customer_email, customer_name, order_number, final_amount')
        .single();

      if (updateError) {
        console.error('Error updating order:', updateError);
        throw updateError;
      }

      // Update coupon used count if coupon was used with safe parameterized query
      if (order.coupon_id) {
        const { data: currentCoupon } = await metahub
          .from('coupons')
          .select('used_count')
          .eq('id', order.coupon_id)
          .single();

        if (currentCoupon) {
          const { error: couponError } = await metahub
            .from('coupons')
            .update({ used_count: (currentCoupon.used_count || 0) + 1 })
            .eq('id', order.coupon_id);

          if (couponError) {
            console.error('Error updating coupon:', couponError);
          }
        }
      }

      // Send order received email
      if (updatedOrder?.customer_email) {
        try {
          const { data: siteSetting } = await metahub
            .from('site_settings')
            .select('value')
            .eq('key', 'site_title')
            .single();

          await metahub.functions.invoke('send-email', {
            body: {
              to: updatedOrder.customer_email,
              template_key: 'order_received',
              variables: {
                customer_name: updatedOrder.customer_name,
                order_number: updatedOrder.order_number,
                final_amount: updatedOrder.final_amount?.toString() || '0',
                status: 'İşleniyor',
                site_name: siteSetting?.value || 'Dijital Market'
              }
            }
          });
          console.log('Order received email sent');
        } catch (emailError) {
          console.error('Error sending order received email:', emailError);
        }
      }

      // Get order items
      const { data: orderItems } = await metahub
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      if (orderItems) {
        // Get site name for emails
        const { data: siteSetting } = await metahub
          .from('site_settings')
          .select('value')
          .eq('key', 'site_title')
          .single();

        const siteName = siteSetting?.value || 'Platform';

        // Process delivery for each item
        for (const item of orderItems) {
          const { data: product } = await metahub
            .from('products')
            .select('delivery_type, api_provider_id, api_product_id')
            .eq('id', item.product_id)
            .single();

          if (product) {
            if (product.delivery_type === 'stock') {
              // Assign stock to order item
              const { data: stockResult } = await metahub.rpc('assign_stock_to_order', {
                p_order_item_id: item.id,
                p_product_id: item.product_id,
                p_quantity: item.quantity,
              });

              if (stockResult && !stockResult.success) {
                console.error('Stock assignment failed:', stockResult);
              } else if (stockResult?.success) {
                // Fetch updated item to get delivery_content
                const { data: updatedItem } = await metahub
                  .from('order_items')
                  .select('delivery_content')
                  .eq('id', item.id)
                  .single();

                // Send delivery email for stock item
                if (updatedItem?.delivery_content) {
                  try {
                    await metahub.functions.invoke('send-email', {
                      body: {
                        to: updatedOrder.customer_email,
                        template_key: 'order_item_delivery',
                        variables: {
                          customer_name: updatedOrder.customer_name,
                          order_number: updatedOrder.order_number,
                          product_name: item.product_name,
                          delivery_content: updatedItem.delivery_content,
                          site_name: siteName
                        }
                      }
                    }).catch(err => console.error('Stock delivery email error:', err));

                    console.log('Stock delivery email sent to:', updatedOrder.customer_email);
                  } catch (emailError) {
                    console.error('Error sending stock delivery email:', emailError);
                  }
                }
              }
            } else if (product.delivery_type === 'api' && product.api_provider_id) {
              // Call API provider
              try {
                await metahub.functions.invoke('smm-api-order', {
                  body: {
                    orderItemId: item.id,
                    productId: item.product_id,
                    apiProviderId: product.api_provider_id,
                    apiProductId: product.api_product_id,
                    quantity: item.quantity,
                    selectedOptions: item.selected_options,
                  },
                });
              } catch (error) {
                console.error('API order error:', error);
              }
            } else if (product.delivery_type === 'file' || product.delivery_type === 'auto_file') {
              // Mark file delivery as delivered
              await metahub
                .from('order_items')
                .update({ delivery_status: 'delivered' })
                .eq('id', item.id);

              // Send file delivery email
              try {
                await metahub.functions.invoke('send-email', {
                  body: {
                    to: updatedOrder.customer_email,
                    template_key: 'order_item_delivery',
                    variables: {
                      customer_name: updatedOrder.customer_name,
                      order_number: updatedOrder.order_number,
                      product_name: item.product_name,
                      delivery_content: item.delivery_content || 'Dosya indirilmek üzere hazır',
                      site_name: siteName
                    }
                  }
                }).catch(err => console.error('File delivery email error:', err));
              } catch (emailError) {
                console.error('Error sending file delivery email:', emailError);
              }
            }
          }
        }
      }

      // Check if all items are delivered and send completion email
      const { data: allItems } = await metahub
        .from('order_items')
        .select('delivery_status')
        .eq('order_id', order.id);

      const allDelivered = allItems?.every(i => i.delivery_status === 'delivered');

      if (allDelivered) {
        await metahub
          .from('orders')
          .update({ status: 'completed' })
          .eq('id', order.id);

        console.log('All items delivered, order completed');

        // Send order completed email
        if (updatedOrder?.customer_email) {
          const { data: siteSetting } = await metahub
            .from('site_settings')
            .select('value')
            .eq('key', 'site_title')
            .single();

          await metahub.functions.invoke('send-email', {
            body: {
              to: updatedOrder.customer_email,
              template_key: 'order_completed',
              variables: {
                customer_name: updatedOrder.customer_name,
                order_number: updatedOrder.order_number,
                final_amount: updatedOrder.final_amount?.toString() || '0',
                site_name: siteSetting?.value || 'Dijital Market'
              }
            }
          }).catch(err => console.error('Order completed email error:', err));
        }
      }

      // Send notification if user exists
      if (order.user_id) {
        await metahub.from('notifications').insert({
          user_id: order.user_id,
          type: 'success',
          title: 'Ödeme Başarılı',
          message: `#${order.order_number} numaralı siparişinizin ödemesi alındı.`,
          link: `/dashboard`,
        });
      }

      // Send Telegram notification for new order
      try {
        const { data: telegramSettings } = await metahub
          .from('site_settings')
          .select('value')
          .eq('key', 'new_order_telegram')
          .single();

        const isEnabled = telegramSettings?.value === true || telegramSettings?.value === 'true';

        if (isEnabled) {
          await metahub.functions.invoke('send-telegram-notification', {
            body: {
              type: 'new_order',
              orderId: order.id
            }
          }).catch(err => console.error('Telegram notification error:', err));
        }
      } catch (telegramError) {
        console.error('Telegram notification exception:', telegramError);
      }

      console.log('Order completed successfully');
    } else {
      console.log('Payment failed or cancelled:', status);

      await metahub
        .from('orders')
        .update({
          payment_status: 'failed',
          status: 'cancelled',
        })
        .eq('id', order.id);
    }

    return new Response('OK', {
      headers: { ...corsHeaders },
      status: 200
    });

  } catch (error) {
    console.error('Error in shopier-callback:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
