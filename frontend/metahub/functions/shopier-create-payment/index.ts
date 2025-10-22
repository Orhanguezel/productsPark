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

    console.log('Shopier payment request received', {
      orderId: orderData.order_id,
      amount: orderData.final_amount
    });

    // Get Shopier settings from site_settings
    const { data: settings, error: settingsError } = await metahub
      .from('site_settings')
      .select('key, value')
      .in('key', [
        'shopier_enabled',
        'shopier_client_id',
        'shopier_client_secret'
      ]);

    if (settingsError || !settings) {
      throw new Error('Shopier settings not found');
    }

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);

    const apiKey = settingsMap.shopier_client_id; // This is API_KEY
    const apiSecret = settingsMap.shopier_client_secret; // This is API_SECRET

    if (!apiKey || !apiSecret) {
      throw new Error('Shopier credentials not configured');
    }

    // Prepare Shopier payment form data
    const baseUrl = req.headers.get('origin') || 'https://48f706b2-062b-4933-8164-3ab6a1ada9fd.lovableproject.com';

    // Clean phone number - only digits
    const cleanPhone = customerInfo.phone.replace(/\D/g, '');

    console.log('Order data received:', {
      merchant_oid: orderData.merchant_oid,
      total_amount: orderData.total_amount,
      discount_amount: orderData.discount_amount,
      final_amount: orderData.final_amount,
      user_id: orderData.user_id
    });

    // Random number for signature
    const randomNr = Math.floor(100000 + Math.random() * 900000);

    // Currency: 0 = TL, 1 = USD, 2 = EUR
    const currency = 0;

    // Create signature BEFORE params
    // Signature = base64(hmac_sha256(random_nr + order_id + total + currency, api_secret))
    const signatureData = `${randomNr}${orderData.merchant_oid}${orderData.final_amount}${currency}`;
    const key = new TextEncoder().encode(apiSecret);
    const message = new TextEncoder().encode(signatureData);

    // HMAC-SHA256 calculation
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

    // Product info for Shopier
    const productInfo = orderData.items.map((item: any) => ({
      name: item.product_name,
      product_id: 1,
      product_type: 2, // 2 = physical product
      quantity: item.quantity || 1,
      variation: [],
      price: item.price,
      discount_price: null,
      subtotal_price: item.price * (item.quantity || 1),
      total_price: item.price * (item.quantity || 1),
      subtotal_tax: 0,
      total_tax: 0
    }));

    // General info
    const generalInfo = {
      total: orderData.final_amount,
      order_key: 'orderkey'
    };

    // Shopier form parameters (matching Symfony implementation)
    const shopierParams: any = {
      API_key: apiKey,
      website_index: 1,
      use_adress: 0,
      platform_order_id: orderData.merchant_oid,
      product_info: JSON.stringify(productInfo),
      general_info: JSON.stringify(generalInfo),
      product_name: orderData.items.map((item: any) => item.product_name).join(', '),
      product_type: 2, // 2 = physical product
      buyer_name: customerInfo.name.split(' ')[0] || 'Ad',
      buyer_surname: customerInfo.name.split(' ').slice(1).join(' ') || 'Soyad',
      buyer_email: customerInfo.email,
      buyer_phone: cleanPhone,
      buyer_account_age: 100,
      buyer_id_nr: orderData.user_id || '101',
      billing_address: '-',
      billing_city: '-',
      billing_country: '-',
      billing_postcode: '-',
      shipping_address: '-',
      shipping_city: '-',
      shipping_country: '-',
      shipping_postcode: '-',
      total_order_value: orderData.final_amount,
      currency: currency,
      platform: 0,
      is_in_frame: 0,
      current_language: 0,
      modul_version: '2.0.0',
      random_nr: randomNr,
      signature: signatureBase64
    };

    console.log('Shopier payment form data prepared', {
      platform_order_id: shopierParams.platform_order_id,
      total: shopierParams.total_order_value,
      phone: shopierParams.buyer_phone
    });

    // Return form data for client-side submission
    return new Response(
      JSON.stringify({
        success: true,
        form_action: 'https://www.shopier.com/ShowProduct/api_pay4.php',
        form_data: shopierParams,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in shopier-create-payment:', error);
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

