import { createClient } from "@/integrations/metahub/client";

Deno.serve(async (req) => {
  try {
    const metahubUrl = Deno.env.get('METAHUB_URL')!;
    const metahubKey = Deno.env.get('METAHUB_SERVICE_ROLE_KEY')!;
    const metahub = createClient(metahubUrl, metahubKey);

    // Get form data from PayTR
    const formData = await req.formData();
    const merchant_oid = formData.get('merchant_oid') as string;
    const status = formData.get('status') as string;
    const total_amount = formData.get('total_amount') as string;
    const hash = formData.get('hash') as string;
    const failed_reason_code = formData.get('failed_reason_code') as string;
    const failed_reason_msg = formData.get('failed_reason_msg') as string;
    const test_mode = formData.get('test_mode') as string;
    const payment_type = formData.get('payment_type') as string;
    const currency = formData.get('currency') as string;
    const payment_amount = formData.get('payment_amount') as string;

    console.log('PayTR callback received', {
      merchant_oid,
      status,
      total_amount,
      payment_type,
      test_mode
    });

    // Get PayTR settings to verify hash
    const { data: settings, error: settingsError } = await metahub
      .from('site_settings')
      .select('key, value')
      .in('key', ['paytr_merchant_key', 'paytr_merchant_salt']);

    if (settingsError || !settings) {
      console.error('PayTR settings not found');
      return new Response('OK', { status: 200 });
    }

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);

    const merchant_key = settingsMap.paytr_merchant_key;
    const merchant_salt = settingsMap.paytr_merchant_salt;

    // Verify hash
    const hashStr = merchant_oid + merchant_salt + status + total_amount;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(merchant_key);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const tokenData = encoder.encode(hashStr);
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, tokenData);
    const calculatedHash = btoa(String.fromCharCode(...new Uint8Array(signature)));

    if (calculatedHash !== hash) {
      console.error('PayTR hash mismatch!', {
        received: hash,
        calculated: calculatedHash
      });
      return new Response('OK', { status: 200 });
    }

    console.log('PayTR hash verified successfully');

    // Find order by merchant_oid (order_number)
    const { data: order, error: orderError } = await metahub
      .from('orders')
      .select('id, status, payment_status, coupon_id')
      .eq('order_number', merchant_oid)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', merchant_oid);
      return new Response('OK', { status: 200 });
    }

    // Only skip if order is completely done
    if (order.status === 'completed') {
      console.log('Order already completed:', merchant_oid);
      return new Response('OK', { status: 200 });
    }

    // Update order based on payment status
    if (status === 'success') {
      console.log('Payment successful, updating order:', order.id);

      // Check if this is a wallet deposit
      const isWalletDeposit = merchant_oid.startsWith('WALLET') || merchant_oid.startsWith('DEP');

      if (isWalletDeposit) {
        console.log('Processing wallet deposit for order:', merchant_oid);

        // Get the order to find user_id and amount
        const { data: fullOrder } = await metahub
          .from('orders')
          .select('user_id, total_amount')
          .eq('id', order.id)
          .single();

        if (fullOrder && fullOrder.user_id) {
          // Create order item for wallet deposit ONLY
          const { error: orderItemError } = await metahub
            .from('order_items')
            .insert({
              order_id: order.id,
              product_name: 'Site Bakiyesi',
              quantity: 1,
              product_price: fullOrder.total_amount,
              total_price: fullOrder.total_amount,
              delivery_status: 'delivered'
            });

          if (orderItemError) {
            console.error('Error creating order item for wallet deposit:', orderItemError);
          } else {
            console.log('Order item created for wallet deposit');
          }

          // Update user's wallet balance using safe parameterized query
          const { data: currentBalance } = await metahub
            .from('profiles')
            .select('wallet_balance')
            .eq('id', fullOrder.user_id)
            .single();

          const newBalance = (currentBalance?.wallet_balance || 0) + fullOrder.total_amount;

          const { error: walletError } = await metahub
            .from('profiles')
            .update({ wallet_balance: newBalance })
            .eq('id', fullOrder.user_id);

          if (walletError) {
            console.error('Error updating wallet balance:', walletError);
          } else {
            console.log('Wallet balance updated successfully');

            // Get user details and new balance for email
            const { data: profile } = await metahub
              .from('profiles')
              .select('full_name, wallet_balance')
              .eq('id', fullOrder.user_id)
              .single();

            const { data: userEmail } = await metahub.auth.admin.getUserById(fullOrder.user_id);

            // Get site name
            const { data: siteSetting } = await metahub
              .from('site_settings')
              .select('value')
              .eq('key', 'site_title')
              .single();

            // Send deposit success email
            if (userEmail?.user?.email) {
              await metahub.functions.invoke('send-email', {
                body: {
                  to: userEmail.user.email,
                  template_key: 'deposit_success',
                  variables: {
                    user_name: profile?.full_name || 'Kullanıcı',
                    amount: fullOrder.total_amount.toString(),
                    new_balance: profile?.wallet_balance?.toString() || '0',
                    site_name: siteSetting?.value || 'Platform'
                  }
                }
              }).catch(err => console.error('Email send error:', err));
            }

            // Send Telegram notification
            try {
              const { data: telegramSettings } = await metahub
                .from('site_settings')
                .select('value')
                .eq('key', 'deposit_approved_telegram')
                .single();

              if (telegramSettings?.value) {
                await metahub.functions.invoke('send-telegram-notification', {
                  body: {
                    type: 'deposit_approved',
                    depositId: order.id,
                    amount: fullOrder.total_amount,
                    userName: profile?.full_name || 'Kullanıcı'
                  }
                }).catch(err => console.error('Telegram notification error:', err));
              }
            } catch (telegramError) {
              console.error('Telegram notification exception:', telegramError);
            }
          }

          // Create wallet transaction record
          const { error: transactionError } = await metahub
            .from('wallet_transactions')
            .insert({
              user_id: fullOrder.user_id,
              amount: fullOrder.total_amount,
              type: 'deposit',
              description: `Bakiye yükleme - ${merchant_oid}`
            });

          if (transactionError) {
            console.error('Error creating wallet transaction:', transactionError);
          }
        }
      }

      // Update order status to paid and get customer details
      const { data: updatedOrder, error: updateError } = await metahub
        .from('orders')
        .update({
          payment_status: 'paid',
          status: isWalletDeposit ? 'completed' : 'processing',
          notes: `PayTR ödeme başarılı. Ödeme tipi: ${payment_type}, Para birimi: ${currency}`
        })
        .eq('id', order.id)
        .select('customer_email, customer_name, order_number, final_amount')
        .single();

      if (updateError) {
        console.error('Error updating order:', updateError);
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

      // Send order received email (after payment success, before product delivery)
      if (!isWalletDeposit && updatedOrder?.customer_email) {
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

      // Skip product delivery for wallet deposits
      if (isWalletDeposit) {
        console.log('Wallet deposit completed, skipping product delivery');
        return new Response('OK', { status: 200 });
      }

      // Get order items for auto-delivery
      const { data: orderItems } = await metahub
        .from('order_items')
        .select('*, products(delivery_type, api_product_id, api_provider_id, api_quantity)')
        .eq('order_id', order.id);

      if (orderItems) {
        // Get site name for emails
        const { data: siteSetting } = await metahub
          .from('site_settings')
          .select('value')
          .eq('key', 'site_title')
          .single();

        const siteName = siteSetting?.value || 'Platform';

        // Use updatedOrder data (already has customer details)
        const orderData = updatedOrder;

        for (const item of orderItems) {
          const product = item.products as any;

          // Handle API delivery
          if (product?.delivery_type === 'api' && product.api_product_id && product.api_provider_id) {
            console.log('Triggering API delivery for item:', item.id);

            try {
              await metahub.functions.invoke('smm-api-order', {
                body: {
                  orderItemId: item.id,
                  apiProviderId: product.api_provider_id,
                  apiProductId: product.api_product_id,
                  quantity: item.quantity,
                  apiQuantityMultiplier: product.api_quantity || 1
                }
              });
            } catch (apiError) {
              console.error('API delivery error:', apiError);
            }
          }

          // Handle auto_stock delivery
          if (product?.delivery_type === 'auto_stock') {
            console.log('Triggering stock delivery for item:', item.id);

            const { data: stockResult } = await metahub.rpc('assign_stock_to_order', {
              p_order_item_id: item.id,
              p_product_id: item.product_id,
              p_quantity: item.quantity
            });

            if (stockResult?.success) {
              console.log('Stock assigned successfully:', item.id);

              // Fetch updated item to get delivery_content
              const { data: updatedItem } = await metahub
                .from('order_items')
                .select('delivery_content')
                .eq('id', item.id)
                .single();

              // Send delivery email for stock item
              if (orderData?.customer_email && updatedItem?.delivery_content) {
                try {
                  await metahub.functions.invoke('send-email', {
                    body: {
                      to: orderData.customer_email,
                      template_key: 'order_item_delivery',
                      variables: {
                        customer_name: orderData.customer_name,
                        order_number: orderData.order_number,
                        product_name: item.product_name,
                        delivery_content: updatedItem.delivery_content,
                        site_name: siteName
                      }
                    }
                  }).catch(err => console.error('Item delivery email error:', err));

                  console.log('Stock delivery email sent to:', orderData.customer_email);
                } catch (emailError) {
                  console.error('Error sending stock delivery email:', emailError);
                }
              }
            } else {
              console.error('Stock assignment failed:', stockResult);
            }
          }

          // Handle file delivery
          if (product?.delivery_type === 'file' || product?.delivery_type === 'auto_file') {
            console.log('Marking file delivery as delivered for item:', item.id);

            await metahub
              .from('order_items')
              .update({ delivery_status: 'delivered' })
              .eq('id', item.id);

            // Send file delivery email
            if (orderData?.customer_email && item.delivery_content) {
              try {
                await metahub.functions.invoke('send-email', {
                  body: {
                    to: orderData.customer_email,
                    template_key: 'order_item_delivery',
                    variables: {
                      customer_name: orderData.customer_name,
                      order_number: orderData.order_number,
                      product_name: item.product_name,
                      delivery_content: item.delivery_content,
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

        // Check if all items are delivered
        const { data: updatedItems } = await metahub
          .from('order_items')
          .select('delivery_status')
          .eq('order_id', order.id);

        const allDelivered = updatedItems?.every(i => i.delivery_status === 'delivered');

        if (allDelivered) {
          await metahub
            .from('orders')
            .update({ status: 'completed' })
            .eq('id', order.id);

          console.log('All items delivered, order completed:', order.id);

          // Send order completed email (summary)
          if (orderData?.customer_email) {
            await metahub.functions.invoke('send-email', {
              body: {
                to: orderData.customer_email,
                template_key: 'order_completed',
                variables: {
                  customer_name: orderData.customer_name,
                  order_number: orderData.order_number,
                  final_amount: orderData.final_amount.toString(),
                  site_name: siteName
                }
              }
            }).catch(err => console.error('Order completed email error:', err));
          }
        }
      }

      // Send Telegram notification for new order (after payment success)
      if (!isWalletDeposit) {
        try {
          const { data: telegramSettings } = await metahub
            .from('site_settings')
            .select('value')
            .eq('key', 'new_order_telegram')
            .single();

          const isEnabled = telegramSettings?.value === true || telegramSettings?.value === 'true';

          if (isEnabled) {
            const { data: orderData } = await metahub
              .from('orders')
              .select('*')
              .eq('id', order.id)
              .single();

            if (orderData) {
              await metahub.functions.invoke('send-telegram-notification', {
                body: {
                  type: 'new_order',
                  orderId: order.id
                }
              }).catch(err => console.error('Telegram notification error:', err));
            }
          }
        } catch (telegramError) {
          console.error('Telegram notification exception:', telegramError);
        }
      }

    } else {
      console.log('Payment failed, updating order:', order.id);

      // Update order status to failed
      await metahub
        .from('orders')
        .update({
          payment_status: 'failed',
          status: 'cancelled',
          notes: `PayTR ödeme başarısız. Hata kodu: ${failed_reason_code}, Mesaj: ${failed_reason_msg}`
        })
        .eq('id', order.id);
    }

    console.log('PayTR callback processed successfully');
    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Error in paytr-callback:', error);
    return new Response('OK', { status: 200 });
  }
});
