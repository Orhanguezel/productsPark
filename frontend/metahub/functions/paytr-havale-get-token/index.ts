import { createClient } from "@/integrations/metahub/client";
import { crypto } from "@/integrations/metahub/client";

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

    const { orderData, customerInfo } = await req.json();

    console.log('PayTR Havale request:', { orderData, customerInfo });

    // Get PayTR settings from site_settings (same merchant for both credit card and havale/eft)
    const { data: settings, error: settingsError } = await metahub
      .from('site_settings')
      .select('key, value')
      .in('key', ['paytr_merchant_id', 'paytr_merchant_key', 'paytr_merchant_salt', 'paytr_test_mode']);

    if (settingsError) {
      console.error('Settings error:', settingsError);
      throw new Error('PayTR ayarları alınamadı');
    }

    const settingsMap = settings.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, any>);

    const merchantId = settingsMap.paytr_merchant_id;
    const merchantKey = settingsMap.paytr_merchant_key;
    const merchantSalt = settingsMap.paytr_merchant_salt;
    // IMPORTANT: Always use 0 for production, Havale/EFT may not work in test mode
    const testMode = '0';

    if (!merchantId || !merchantKey || !merchantSalt) {
      throw new Error('PayTR Havale bilgileri eksik');
    }

    const paymentAmount = Math.round(orderData.payment_amount * 100); // Convert to kuruş
    const merchantOid = orderData.merchant_oid;
    const userIp = '185.94.188.100'; // Public IP (PayTR requires real IP, not 127.0.0.1)
    const paymentType = 'eft'; // Havale/EFT payment type
    const timeoutLimit = 30;
    const debugOn = 0; // No debug in production

    // Calculate hash - PayTR Havale/EFT hash format
    const hashStr = `${merchantId}${userIp}${merchantOid}${customerInfo.email}${paymentAmount}${paymentType}${testMode}`;
    console.log('Hash string:', hashStr);
    console.log('Merchant Salt:', merchantSalt);
    console.log('Merchant Key length:', merchantKey.length);

    const encoder = new TextEncoder();
    const keyData = encoder.encode(merchantKey);
    const messageData = encoder.encode(hashStr + merchantSalt);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const token = btoa(String.fromCharCode(...new Uint8Array(signature)));

    console.log('Generated token:', token);

    // Prepare request to PayTR
    const paytrData = {
      merchant_id: merchantId,
      user_ip: userIp,
      merchant_oid: merchantOid,
      email: customerInfo.email,
      payment_amount: paymentAmount.toString(),
      payment_type: paymentType,
      paytr_token: token,
      user_name: customerInfo.name,
      user_phone: customerInfo.phone,
      timeout_limit: timeoutLimit.toString(),
      debug_on: debugOn.toString(),
      test_mode: testMode,
    };

    console.log('PayTR request data:', paytrData);

    // Send request to PayTR
    const paytrResponse = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(paytrData).toString(),
    });

    const responseText = await paytrResponse.text();
    console.log('PayTR raw response:', responseText);
    console.log('PayTR response status:', paytrResponse.status);

    let paytrResult;
    try {
      paytrResult = JSON.parse(responseText);
    } catch (e) {
      console.error('PayTR response parse error:', e);
      console.error('Response was:', responseText);
      throw new Error('PayTR yanıtı işlenemedi: ' + responseText);
    }

    console.log('PayTR parsed result:', paytrResult);

    if (paytrResult.status === 'success') {
      return new Response(
        JSON.stringify({
          success: true,
          token: paytrResult.token,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      console.error('PayTR error:', paytrResult);
      throw new Error(paytrResult.reason || 'PayTR token alınamadı');
    }

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
