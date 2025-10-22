import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@/integrations/metahub/client";

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

    console.log('Starting Turkpin cron job - checking pending orders...');

    // Get all pending or processing order items for Turkpin products
    const { data: orderItems, error: fetchError } = await metahub
      .from('order_items')
      .select(`
        id,
        turkpin_order_no,
        delivery_status,
        products!inner (
          product_type,
          api_provider_id
        )
      `)
      .not('turkpin_order_no', 'is', null)
      .in('delivery_status', ['pending', 'processing'])
      .in('products.product_type', ['epin', 'topup']);

    if (fetchError) {
      console.error('Error fetching order items:', fetchError);
      throw fetchError;
    }

    if (!orderItems || orderItems.length === 0) {
      console.log('No pending Turkpin orders found');
      return new Response(
        JSON.stringify({ success: true, checked: 0, message: 'No pending orders' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${orderItems.length} pending Turkpin orders`);

    // Call the check-status function for all pending orders
    const { data: checkResult, error: checkError } = await metahub.functions.invoke('turkpin-check-status');

    if (checkError) {
      console.error('Error checking status:', checkError);
      throw checkError;
    }

    console.log('Status check completed:', checkResult);

    return new Response(
      JSON.stringify({
        success: true,
        checked: checkResult?.checked || 0,
        message: `Checked ${checkResult?.checked || 0} orders`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in turkpin-cron-check function:', error);
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
