import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@/integrations/metahub/client";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMMOrderRequest {
  orderItemId: string;
  apiProviderId: string;
  apiProductId: string;
  quantity: number;
  apiQuantityMultiplier: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const metahubUrl = Deno.env.get('METAHUB_URL')!;
    const metahubKey = Deno.env.get('METAHUB_SERVICE_ROLE_KEY')!;
    const metahub = createClient(metahubUrl, metahubKey);

    const { orderItemId, apiProviderId, apiProductId, quantity, apiQuantityMultiplier } = await req.json() as SMMOrderRequest;

    const finalQuantity = quantity * (apiQuantityMultiplier || 1);

    console.log('Processing SMM order:', { orderItemId, apiProviderId, apiProductId, quantity, apiQuantityMultiplier, finalQuantity });

    // Get order item to extract link from selected_options
    const { data: orderItem, error: orderItemError } = await metahub
      .from('order_items')
      .select('selected_options')
      .eq('id', orderItemId)
      .single();

    if (orderItemError || !orderItem) {
      throw new Error('Order item not found');
    }

    // Extract link from selected_options - try common keys first, then use first value
    let link = orderItem.selected_options?.link || orderItem.selected_options?.username;

    // If not found, get the first value from selected_options
    if (!link && orderItem.selected_options) {
      const values = Object.values(orderItem.selected_options);
      link = values[0] as string;
    }

    if (!link) {
      throw new Error('Link/username not found in order item');
    }

    console.log('Extracted link from order item:', link);

    // Get API provider details
    const { data: provider, error: providerError } = await metahub
      .from('api_providers')
      .select('*')
      .eq('id', apiProviderId)
      .single();

    if (providerError || !provider) {
      throw new Error('API provider not found');
    }

    console.log('Using provider:', provider.name);

    // Send order to SMM API
    const formData = new FormData();
    formData.append('key', provider.api_key);
    formData.append('action', 'add');
    formData.append('service', apiProductId);
    formData.append('link', link);
    formData.append('quantity', finalQuantity.toString());

    const apiResponse = await fetch(provider.api_url, {
      method: 'POST',
      body: formData,
    });

    const responseData = await apiResponse.json();
    console.log('SMM API response:', responseData);

    if (!apiResponse.ok || responseData.error) {
      // Handle API errors by marking order as failed
      const errorMessage = responseData.error || 'SMM API request failed';

      await metahub
        .from('order_items')
        .update({
          delivery_status: 'failed',
          delivery_error: errorMessage,
          delivery_error_details: responseData
        })
        .eq('id', orderItemId);

      throw new Error(errorMessage);
    }

    // Update order item with API order ID
    const { error: updateError } = await metahub
      .from('order_items')
      .update({
        api_order_id: responseData.order.toString(),
        delivery_status: 'processing'
      })
      .eq('id', orderItemId);

    if (updateError) {
      console.error('Error updating order item:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        apiOrderId: responseData.order
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in smm-api-order function:', error);
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