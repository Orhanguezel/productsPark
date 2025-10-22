import { createClient } from 'https://esm.sh/@metahub/metahub-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BalanceRequest {
  providerId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const metahub = createClient(
      Deno.env.get('METAHUB_URL') ?? '',
      Deno.env.get('METAHUB_SERVICE_ROLE_KEY') ?? ''
    );

    const { providerId } = await req.json() as BalanceRequest;

    console.log('Fetching balance for provider:', providerId);

    // Get provider details
    const { data: provider, error: providerError } = await metahub
      .from('api_providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (providerError || !provider) {
      throw new Error('API provider not found');
    }

    // Fetch balance from SMM API
    const formData = new FormData();
    formData.append('key', provider.api_key);
    formData.append('action', 'balance');

    console.log('Calling SMM API for balance:', provider.api_url);

    const apiResponse = await fetch(provider.api_url, {
      method: 'POST',
      body: formData,
    });

    if (!apiResponse.ok) {
      throw new Error(`SMM API returned ${apiResponse.status}`);
    }

    const balanceData = await apiResponse.json();
    console.log('Balance response:', balanceData);

    // Update provider with new balance
    const { error: updateError } = await metahub
      .from('api_providers')
      .update({
        balance: parseFloat(balanceData.balance || '0'),
        currency: balanceData.currency || 'USD',
        last_balance_check: new Date().toISOString(),
      })
      .eq('id', providerId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        balance: balanceData.balance,
        currency: balanceData.currency,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching balance:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
