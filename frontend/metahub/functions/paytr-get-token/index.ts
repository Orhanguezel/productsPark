import { createClient } from "@/integrations/metahub/client";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const metahubUrl = Deno.env.get('METAHUB_URL')!;
    const metahubKey = Deno.env.get('METAHUB_SERVICE_ROLE_KEY')!;
    const metahub = createClient(metahubUrl, metahubKey);

    const {
      orderData,
      customerInfo
    } = await req.json();

    console.log('PayTR token request received', {
      orderId: orderData.merchant_oid,
      amount: orderData.payment_amount
    });

    // Get PayTR settings from site_settings
    const { data: settings, error: settingsError } = await metahub
      .from('site_settings')
      .select('key, value')
      .in('key', [
        'paytr_enabled',
        'paytr_merchant_id',
        'paytr_merchant_key',
        'paytr_merchant_salt',
        'paytr_test_mode',
        'paytr_max_installment',
        'paytr_no_installment',
        'paytr_timeout_limit',
        'paytr_currency'
      ]);

    if (settingsError || !settings) {
      throw new Error('PayTR settings not found');
    }

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);

    const merchant_id = settingsMap.paytr_merchant_id;
    const merchant_key = settingsMap.paytr_merchant_key;
    const merchant_salt = settingsMap.paytr_merchant_salt;
    const test_mode = settingsMap.paytr_test_mode === true ? '1' : '0';
    const max_installment = String(settingsMap.paytr_max_installment || 0);
    const no_installment = String(settingsMap.paytr_no_installment || 0);
    const timeout_limit = String(settingsMap.paytr_timeout_limit || 30);
    const currency = settingsMap.paytr_currency || 'TL';

    // Build user_basket (base64 encoded JSON)
    const basketItems = orderData.items.map((item: any) => [
      item.product_name || 'DİJİTAL ÜRÜN',
      String((item.total_price / item.quantity).toFixed(2)),
      item.quantity
    ]);

    const basketJson = JSON.stringify(basketItems);
    const user_basket = btoa(basketJson);

    // Payment amount must be multiplied by 100
    const payment_amount = String(Math.round(orderData.final_amount * 100));

    // Get user IP (from headers)
    const user_ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      '85.34.78.112'; // Fallback IP

    // Create hash for paytr_token
    const hashStr = `${merchant_id}${user_ip}${orderData.merchant_oid}${customerInfo.email}${payment_amount}${user_basket}${no_installment}${max_installment}${currency}${test_mode}`;
    const hashData = hashStr + merchant_salt;

    const encoder = new TextEncoder();
    const data = encoder.encode(hashData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Create HMAC for final token
    const keyData = encoder.encode(merchant_key);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const tokenData = encoder.encode(hashData);
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, tokenData);
    const paytr_token = btoa(String.fromCharCode(...new Uint8Array(signature)));

    // Success and fail URLs
    const baseUrl = req.headers.get('origin') || 'https://48f706b2-062b-4933-8164-3ab6a1ada9fd.lovableproject.com';
    const merchant_ok_url = `${baseUrl}/odeme-basarili`;
    const merchant_fail_url = `${baseUrl}/odeme-bildirimi?status=failed`;

    // Prepare form data for PayTR API
    const formData = new URLSearchParams();
    formData.append('merchant_id', merchant_id);
    formData.append('user_ip', user_ip);
    formData.append('merchant_oid', orderData.merchant_oid);
    formData.append('email', customerInfo.email);
    formData.append('payment_amount', payment_amount);
    formData.append('user_basket', user_basket);
    formData.append('no_installment', no_installment);
    formData.append('max_installment', max_installment);
    formData.append('currency', currency);
    formData.append('test_mode', test_mode);
    formData.append('paytr_token', paytr_token);
    formData.append('user_name', customerInfo.name);
    formData.append('user_address', customerInfo.address || 'DİJİTAL ÜRÜN');
    formData.append('user_phone', customerInfo.phone);
    formData.append('merchant_ok_url', merchant_ok_url);
    formData.append('merchant_fail_url', merchant_fail_url);
    formData.append('timeout_limit', timeout_limit);
    formData.append('debug_on', '1');
    formData.append('lang', 'tr');

    console.log('Sending request to PayTR API', {
      merchant_id,
      merchant_oid: orderData.merchant_oid,
      test_mode,
      payment_amount,
      user_ip,
      currency
    });

    // Call PayTR API
    const paytrResponse = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const responseText = await paytrResponse.text();
    console.log('PayTR API response:', responseText);

    const paytrData = JSON.parse(responseText);

    if (paytrData.status === 'success') {
      return new Response(
        JSON.stringify({
          success: true,
          token: paytrData.token
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } else {
      console.error('PayTR token error:', paytrData);
      return new Response(
        JSON.stringify({
          success: false,
          error: paytrData.reason || 'Token oluşturulamadı'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

  } catch (error) {
    console.error('Error in paytr-get-token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
