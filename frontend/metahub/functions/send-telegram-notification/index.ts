import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@metahub/metahub-js@2.74.0";

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

    // Get Telegram settings including templates
    const { data: settings, error: settingsError } = await metahub
      .from('site_settings')
      .select('*')
      .in('key', ['telegram_bot_token', 'telegram_chat_id',
        'telegram_template_new_order', 'telegram_template_new_payment_request',
        'telegram_template_new_ticket', 'telegram_template_deposit_approved',
        'telegram_template_new_deposit_request']);

    if (settingsError) throw settingsError;

    const settingsObj = settings.reduce((acc: any, item: any) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    // Get notification type from request
    const { type, orderId, ticketId, depositId, amount, userName, paymentRequestId } = await req.json();

    // Check if this type of notification is enabled
    const notificationKey = `${type}_telegram`;
    const { data: typeSettings } = await metahub
      .from('site_settings')
      .select('value')
      .eq('key', notificationKey)
      .single();

    if (!typeSettings?.value || typeSettings.value === false || typeSettings.value === 'false') {
      console.log(`Telegram notifications disabled for type: ${type}`);
      return new Response(
        JSON.stringify({ message: `Telegram notifications disabled for ${type}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const botToken = settingsObj.telegram_bot_token;
    const chatId = settingsObj.telegram_chat_id;

    if (!botToken || !chatId) {
      throw new Error('Telegram bot token or chat ID not configured');
    }

    // Helper function to replace template variables
    const replaceVariables = (template: string, variables: Record<string, any>): string => {
      let result = template;
      Object.keys(variables).forEach(key => {
        const value = variables[key] !== undefined && variables[key] !== null ? String(variables[key]) : '';
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      });
      return result;
    };

    let message = '';

    // Build message based on notification type
    if (type === 'new_order') {
      const { data: order, error: orderError } = await metahub
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            products(name)
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Get custom template - handle both object and string formats
      let template = '🛒 *Yeni Sipariş Alındı!*\n\n📋 Sipariş No: {{order_number}}\n👤 Müşteri: {{customer_name}}\n📧 Email: {{customer_email}}\n{{customer_phone}}\n\n💰 Toplam Tutar: {{final_amount}} TL\n{{discount}}\n\n📦 Ürünler:\n{{order_items}}\n\n⏰ Sipariş Tarihi: {{created_at}}';

      if (settingsObj.telegram_template_new_order) {
        template = typeof settingsObj.telegram_template_new_order === 'object'
          ? settingsObj.telegram_template_new_order.template
          : settingsObj.telegram_template_new_order;
      }

      const orderItems = order.order_items.map((item: any) =>
        `  • ${item.product_name} x${item.quantity} - ${item.total_price} TL`
      ).join('\n');

      message = replaceVariables(template, {
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone ? `📱 Telefon: ${order.customer_phone}` : '',
        final_amount: order.final_amount,
        discount: order.discount_amount > 0 ? `🎟️ İndirim: -${order.discount_amount} TL` : '',
        order_items: orderItems,
        created_at: new Date(order.created_at).toLocaleString('tr-TR')
      });

    } else if (type === 'new_payment_request') {
      const { data: paymentRequest, error: prError } = await metahub
        .from('payment_requests')
        .select(`
          *,
          orders(
            order_number,
            customer_name,
            customer_email,
            customer_phone,
            final_amount,
            order_items(
              product_name,
              quantity,
              total_price
            )
          )
        `)
        .eq('id', paymentRequestId)
        .single();

      if (prError) throw prError;

      // Get custom template - handle both object and string formats
      let template = '💳 *Yeni Ödeme Talebi!*\n\n📋 Sipariş No: {{order_number}}\n👤 Müşteri: {{customer_name}}\n📧 Email: {{customer_email}}\n{{customer_phone}}\n\n💰 Tutar: {{amount}} TL\n💳 Ödeme Yöntemi: {{payment_method}}\n\n📦 Ürünler:\n{{order_items}}\n\n⏰ Talep Tarihi: {{created_at}}';

      if (settingsObj.telegram_template_new_payment_request) {
        template = typeof settingsObj.telegram_template_new_payment_request === 'object'
          ? settingsObj.telegram_template_new_payment_request.template
          : settingsObj.telegram_template_new_payment_request;
      }

      const orderItems = paymentRequest.orders.order_items.map((item: any) =>
        `  • ${item.product_name} x${item.quantity} - ${item.total_price} TL`
      ).join('\n');

      message = replaceVariables(template, {
        order_number: paymentRequest.orders.order_number,
        customer_name: paymentRequest.orders.customer_name,
        customer_email: paymentRequest.orders.customer_email,
        customer_phone: paymentRequest.orders.customer_phone ? `📱 Telefon: ${paymentRequest.orders.customer_phone}` : '',
        amount: paymentRequest.amount,
        payment_method: paymentRequest.payment_method.toUpperCase(),
        order_items: orderItems,
        created_at: new Date(paymentRequest.created_at).toLocaleString('tr-TR')
      });

    } else if (type === 'new_ticket') {
      const { data: ticket, error: ticketError } = await metahub
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (ticketError) throw ticketError;

      // Get custom template - handle both object and string formats
      let template = '🎫 *Yeni Destek Talebi Açıldı!*\n\n👤 Kullanıcı: {{user_name}}\n📋 Konu: {{subject}}\n📊 Öncelik: {{priority}}\n{{category}}\n\n💬 Mesaj:\n{{message}}\n\n⏰ Talep Tarihi: {{created_at}}';

      if (settingsObj.telegram_template_new_ticket) {
        template = typeof settingsObj.telegram_template_new_ticket === 'object'
          ? settingsObj.telegram_template_new_ticket.template
          : settingsObj.telegram_template_new_ticket;
      }

      message = replaceVariables(template, {
        user_name: userName,
        subject: ticket.subject,
        priority: ticket.priority,
        category: ticket.category ? `📁 Kategori: ${ticket.category}` : '',
        message: ticket.message,
        created_at: new Date(ticket.created_at).toLocaleString('tr-TR')
      });

    } else if (type === 'deposit_approved') {
      // Get custom template - handle both object and string formats
      let template = '💰 *Bakiye Yükleme Onaylandı!*\n\n👤 Kullanıcı: {{user_name}}\n💵 Tutar: {{amount}} TL\n\n⏰ Onay Tarihi: {{created_at}}';

      if (settingsObj.telegram_template_deposit_approved) {
        template = typeof settingsObj.telegram_template_deposit_approved === 'object'
          ? settingsObj.telegram_template_deposit_approved.template
          : settingsObj.telegram_template_deposit_approved;
      }

      message = replaceVariables(template, {
        user_name: userName,
        amount: amount,
        created_at: new Date().toLocaleString('tr-TR')
      });

    } else if (type === 'new_deposit_request') {
      // Get custom template - handle both object and string formats
      let template = '💰 *Yeni Bakiye Yükleme Talebi!*\n\n👤 Kullanıcı: {{user_name}}\n💵 Tutar: {{amount}} TL\n💳 Ödeme Yöntemi: {{payment_method}}\n\n⏰ Talep Tarihi: {{created_at}}';

      if (settingsObj.telegram_template_new_deposit_request) {
        template = typeof settingsObj.telegram_template_new_deposit_request === 'object'
          ? settingsObj.telegram_template_new_deposit_request.template
          : settingsObj.telegram_template_new_deposit_request;
      }

      message = replaceVariables(template, {
        user_name: userName,
        amount: amount,
        payment_method: 'Havale/EFT',
        created_at: new Date().toLocaleString('tr-TR')
      });

    } else {
      throw new Error('Invalid notification type');
    }

    // Send message to Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Telegram API error:', error);
      throw new Error(`Failed to send Telegram message: ${error}`);
    }

    console.log('Telegram notification sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
