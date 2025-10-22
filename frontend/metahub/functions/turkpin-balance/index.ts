import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@/integrations/metahub/client";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BalanceRequest {
  providerId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const metahubUrl = Deno.env.get('METAHUB_URL')!;
    const metahubKey = Deno.env.get('METAHUB_SERVICE_ROLE_KEY')!;
    const metahub = createClient(metahubUrl, metahubKey);

    const { providerId } = await req.json() as BalanceRequest;

    console.log('Checking Turkpin balance for provider:', providerId);

    // Get API provider details
    const { data: provider, error: providerError } = await metahub
      .from('api_providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (providerError || !provider) {
      throw new Error('API provider not found');
    }

    console.log('Using provider:', provider.name);

    // Prepare XML request for balance check
    const xmlData = `<APIRequest>
  <params>
    <cmd>balance</cmd>
    <username>${provider.api_key.split(':')[0] || provider.api_key}</username>
    <password>${provider.api_key.split(':')[1] || provider.api_key}</password>
  </params>
</APIRequest>`;

    // Send request to Turkpin API
    const formData = new FormData();
    formData.append('DATA', xmlData);

    const apiResponse = await fetch(provider.api_url, {
      method: 'POST',
      body: formData,
    });

    const responseText = await apiResponse.text();
    console.log('Turkpin balance API response:', responseText);

    // Parse XML response using regex
    const getValue = (tag: string) => {
      const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`);
      const match = responseText.match(regex);
      return match ? match[1] : null;
    };

    const errorCode = getValue('error') || getValue('HATA_NO');
    const errorDesc = getValue('error_desc') || getValue('HATA_ACIKLAMA');

    if (errorCode !== '000') {
      throw new Error(`Turkpin API Error ${errorCode}: ${errorDesc}`);
    }

    // Extract balance information
    const balance = parseFloat(getValue('balance') || getValue('bakiye') || '0');
    const currency = getValue('currency') || getValue('para_birimi') || 'TRY';

    // Update provider balance in database
    await metahub
      .from('api_providers')
      .update({
        balance: balance,
        currency: currency,
        last_balance_check: new Date().toISOString()
      })
      .eq('id', providerId);

    return new Response(
      JSON.stringify({
        success: true,
        balance,
        currency
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in turkpin-balance function:', error);
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