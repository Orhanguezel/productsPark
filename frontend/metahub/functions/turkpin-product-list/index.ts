import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@/integrations/metahub/client";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductListRequest {
  providerId: string;
  gameId: string;
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

    const { providerId, gameId, listType } = await req.json() as ProductListRequest;

    console.log('Fetching product list:', { providerId, gameId, listType });

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
    const cmd = listType === 'epin' ? 'epinUrunleri' : 'yukletUrunListesi';
    const xmlData = `<APIRequest>
  <params>
    <cmd>${cmd}</cmd>
    <username>${provider.api_key.split(':')[0] || provider.api_key}</username>
    <password>${provider.api_key.split(':')[1] || provider.api_key}</password>
    <oyunKodu>${gameId}</oyunKodu>
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

    // Extract products using regex
    const urunPattern = /<urun>([\s\S]*?)<\/urun>/g;
    const products: Array<any> = [];
    let match;

    while ((match = urunPattern.exec(responseText)) !== null) {
      const urunContent = match[1];

      const getValue = (tag: string) => {
        const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`);
        const match = urunContent.match(regex);
        return match ? match[1] : '';
      };

      products.push({
        id: getValue('id'),
        name: getValue('name'),
        price: parseFloat(getValue('price') || '0'),
        stock: parseInt(getValue('stock') || '0'),
        min_order: parseInt(getValue('min_order') || '1'),
        max_order: getValue('max_order') ? parseInt(getValue('max_order') || '0') : 0,
        tax_type: parseInt(getValue('tax_type') || '0'),
        pre_order: getValue('pre_order') === 'true',
        min_barem: getValue('min_barem') ? parseFloat(getValue('min_barem') || '0') : undefined,
        max_barem: getValue('max_barem') ? parseFloat(getValue('max_barem') || '0') : undefined,
        barem_step: getValue('barem_step') ? parseFloat(getValue('barem_step') || '0') : undefined,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        products
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in turkpin-product-list function:', error);
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