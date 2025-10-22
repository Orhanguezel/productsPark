import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@/integrations/metahub/client";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameListRequest {
  providerId: string;
  listType: 'epin' | 'topup';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const metahubUrl = Deno.env.get('METAHUB_URL')!;
    const metahubKey = Deno.env.get('METAHUB_SERVICE_ROLE_KEY')!;
    const metahub = createClient(metahubUrl, metahubKey);

    const { providerId, listType } = await req.json() as GameListRequest;

    console.log('Fetching game list:', { providerId, listType });

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

    // Prepare XML request
    const cmd = listType === 'epin' ? 'epinOyunListesi' : 'yukletOyunListesi';
    const xmlData = `<APIRequest>
  <params>
    <cmd>${cmd}</cmd>
    <username>${provider.api_key.split(':')[0] || provider.api_key}</username>
    <password>${provider.api_key.split(':')[1] || provider.api_key}</password>
  </params>
</APIRequest>`;

    console.log('Sending request to Turkpin API');

    // Send request to Turkpin API
    const formData = new FormData();
    formData.append('DATA', xmlData);

    const apiResponse = await fetch(provider.api_url, {
      method: 'POST',
      body: formData,
    });

    const responseText = await apiResponse.text();
    console.log('Turkpin API response:', responseText);

    // Parse XML response using regex
    const errorMatch = responseText.match(/<error>(.*?)<\/error>/);
    const errorDescMatch = responseText.match(/<error_desc>(.*?)<\/error_desc>/);

    const errorCode = errorMatch ? errorMatch[1] : null;
    const errorDesc = errorDescMatch ? errorDescMatch[1] : null;

    if (errorCode !== '000') {
      throw new Error(`Turkpin API Error ${errorCode}: ${errorDesc}`);
    }

    // Extract games using regex
    const oyunPattern = /<oyun>[\s\S]*?<id>(.*?)<\/id>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/oyun>/g;
    const games: Array<{ id: string; name: string }> = [];
    let match;

    while ((match = oyunPattern.exec(responseText)) !== null) {
      games.push({
        id: match[1],
        name: match[2]
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        games
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in turkpin-game-list function:', error);
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