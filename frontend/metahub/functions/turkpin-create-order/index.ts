import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@/integrations/metahub/client";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateOrderRequest {
  orderItemId: string;
  providerId: string;
  gameId: string;
  productId: string;
  quantity: number;
  orderType: 'epin' | 'topup';
  preOrder?: boolean;
  barem?: number;
  description?: string;
  character?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const metahubUrl = Deno.env.get('METAHUB_URL')!;
    const metahubKey = Deno.env.get('METAHUB_SERVICE_ROLE_KEY')!;
    const metahub = createClient(metahubUrl, metahubKey);

    const { orderItemId, providerId, gameId, productId, quantity, orderType, preOrder, barem, description, character } = await req.json() as CreateOrderRequest;

    console.log('Creating Turkpin order:', { orderItemId, providerId, gameId, productId, quantity, orderType });

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

    // Prepare XML request based on order type
    const cmd = orderType === 'epin' ? 'epinSiparisYarat' : 'yukletSiparisYarat';
    let xmlParams = `
    <cmd>${cmd}</cmd>
    <username>${provider.api_key.split(':')[0] || provider.api_key}</username>
    <password>${provider.api_key.split(':')[1] || provider.api_key}</password>
    <oyunKodu>${gameId}</oyunKodu>
    <urunKodu>${productId}</urunKodu>
    <adet>${quantity}</adet>`;

    if (orderType === 'epin') {
      if (character) xmlParams += `\n    <character>${character}</character>`;
      if (preOrder) xmlParams += `\n    <pre_order>true</pre_order>`;
      if (barem) xmlParams += `\n    <barem>${barem}</barem>`;
    } else if (orderType === 'topup' && description) {
      xmlParams += `\n    <aciklama>${description}</aciklama>`;
    }

    const xmlData = `<APIRequest>
  <params>${xmlParams}
  </params>
</APIRequest>`;

    console.log('Sending order request to Turkpin API');

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
    const getValue = (tag: string) => {
      const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`);
      const match = responseText.match(regex);
      return match ? match[1] : '';
    };

    const hataNO = getValue('HATA_NO');
    const hataAciklama = getValue('HATA_ACIKLAMA');
    const siparisNo = getValue('siparisNo');
    const siparisSonuc = getValue('siparisSonuc');

    // Handle errors
    if (hataNO !== '000') {
      const errorDetails = {
        error_code: hataNO,
        error_message: hataAciklama,
        full_response: responseText
      };

      // Update order item with error
      await metahub
        .from('order_items')
        .update({
          delivery_status: 'failed',
          delivery_error: hataAciklama,
          delivery_error_details: errorDetails,
          api_response_log: errorDetails
        })
        .eq('id', orderItemId);

      throw new Error(`Turkpin API Error ${hataNO}: ${hataAciklama}`);
    }

    // Extract epin codes if available
    let epinCodes: string[] = [];
    if (orderType === 'epin') {
      const epinPattern = /<epin>([\s\S]*?)<\/epin>/g;
      let epinMatch;

      while ((epinMatch = epinPattern.exec(responseText)) !== null) {
        const epinContent = epinMatch[1];
        const codeMatch = epinContent.match(/<code>(.*?)<\/code>/);
        const descMatch = epinContent.match(/<desc>(.*?)<\/desc>/);

        const code = codeMatch ? codeMatch[1] : '';
        const desc = descMatch ? descMatch[1] : '';

        epinCodes.push(desc ? `${code} (${desc})` : code);
      }
    }

    // Update order item with success
    const deliveryContent = epinCodes.length > 0 ? epinCodes.join('\n') : 'Sipariş oluşturuldu. Teslimat bekleniyor.';
    const deliveryStatus = epinCodes.length > 0 ? 'delivered' : 'processing';

    await metahub
      .from('order_items')
      .update({
        turkpin_order_no: siparisNo,
        delivery_content: deliveryContent,
        delivery_status: deliveryStatus,
        api_response_log: {
          success: true,
          order_no: siparisNo,
          result: siparisSonuc,
          codes: epinCodes,
          timestamp: new Date().toISOString()
        }
      })
      .eq('id', orderItemId);

    // Update parent order status to processing
    const { data: orderItem } = await metahub
      .from('order_items')
      .select('order_id')
      .eq('id', orderItemId)
      .single();

    if (orderItem) {
      await metahub
        .from('orders')
        .update({ status: deliveryStatus === 'delivered' ? 'completed' : 'processing' })
        .eq('id', orderItem.order_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderNo: siparisNo,
        codes: epinCodes
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in turkpin-create-order function:', error);
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