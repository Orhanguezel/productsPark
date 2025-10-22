import { createClient } from 'https://esm.sh/@metahub/metahub-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Service role key ile admin kontrolü
    const metahubClient = createClient(
      Deno.env.get('METAHUB_URL') ?? '',
      Deno.env.get('METAHUB_SERVICE_ROLE_KEY') ?? ''
    );

    // Authorization header'dan user'ı al
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized - No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await metahubClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized - Invalid token');
    }

    // Admin kontrolü
    const { data: roleData } = await metahubClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      throw new Error('Unauthorized - Admin access required');
    }

    const { snapshotId } = await req.json();
    console.log('Starting rollback to snapshot:', snapshotId);

    // Snapshot'ı al
    const { data: snapshot, error: snapshotError } = await metahubClient
      .from('update_snapshots')
      .select('*')
      .eq('id', snapshotId)
      .single();

    if (snapshotError || !snapshot) {
      throw new Error('Snapshot bulunamadı');
    }

    // Snapshot'tan ayarları geri yükle
    if (snapshot.snapshot_data.site_settings) {
      console.log('Restoring site settings...');

      // Mevcut ayarları sil
      await metahubClient.from('site_settings').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Snapshot'tan ayarları geri yükle
      for (const setting of snapshot.snapshot_data.site_settings) {
        await metahubClient.from('site_settings').insert(setting);
      }
    }

    // Versiyon geri al
    await metahubClient
      .from('system_version')
      .insert({ version: snapshot.version });

    // Update history'ye kayıt ekle
    const { data: currentVersionData } = await metahubClient
      .from('system_version')
      .select('version')
      .order('installed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    await metahubClient.from('update_history').insert({
      from_version: currentVersionData?.version || 'unknown',
      to_version: snapshot.version,
      status: 'rolled_back',
      applied_by: user.id,
      completed_at: new Date().toISOString(),
    });

    console.log('Rollback completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Geri alma işlemi başarıyla tamamlandı!',
        restoredVersion: snapshot.version,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in rollback-update:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});