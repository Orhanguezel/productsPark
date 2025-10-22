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

    const { targetVersion } = await req.json();
    console.log('Starting update to version:', targetVersion);

    // Mevcut versiyonu al
    const { data: currentVersionData } = await metahubClient
      .from('system_version')
      .select('version')
      .order('installed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentVersion = currentVersionData?.version || '1.0.0';

    // Update history kaydı oluştur
    const { data: historyData, error: historyError } = await metahubClient
      .from('update_history')
      .insert({
        from_version: currentVersion,
        to_version: targetVersion,
        status: 'in_progress',
        applied_by: user.id,
      })
      .select()
      .single();

    if (historyError) throw historyError;

    try {
      // 1. Snapshot oluştur (rollback için)
      console.log('Creating snapshot...');
      const { data: settingsData } = await metahubClient
        .from('site_settings')
        .select('*');

      await metahubClient.from('update_snapshots').insert({
        version: currentVersion,
        snapshot_data: { site_settings: settingsData },
      });

      // 2. Güncelleme paketini indir
      const updateServerUrl = Deno.env.get('UPDATE_SERVER_URL') || 'https://updates.yourdomain.com';
      console.log('Downloading update package...');

      const migrationsResponse = await fetch(
        `${updateServerUrl}/versions/${targetVersion}/migrations.sql`
      );

      if (!migrationsResponse.ok) {
        throw new Error('Migration dosyası indirilemedi');
      }

      const migrations = await migrationsResponse.text();
      console.log('Downloaded migrations');

      // 3. Protected tables bilgisini al
      const protectedResponse = await fetch(
        `${updateServerUrl}/versions/${targetVersion}/protected-tables.json`
      );

      let protectedTables = [];
      if (protectedResponse.ok) {
        const protectedData = await protectedResponse.json();
        protectedTables = protectedData.tables || [];
        console.log('Protected tables:', protectedTables);
      }

      // 4. Migration'ları uygula
      console.log('Applying migrations...');

      // Migration'ları satır satır böl ve uygula
      const migrationStatements = migrations
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of migrationStatements) {
        try {
          const { error } = await metahubClient.rpc('exec_sql', { sql: statement });
          if (error) throw error;
        } catch (error) {
          console.error('Migration error:', statement, error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          // Sadece "already exists" ve "IF NOT EXISTS" hatalarını yok say
          if (!errorMessage.includes('already exists') &&
            !errorMessage.includes('IF NOT EXISTS')) {
            throw error;
          }
          console.log('Skipping non-critical error:', errorMessage);
        }
      }

      // 5. Versiyon güncelle
      console.log('Updating version...');
      await metahubClient
        .from('system_version')
        .insert({ version: targetVersion });

      // 6. Update history'yi güncelle
      const { data: versionInfo } = await fetch(
        `${updateServerUrl}/versions/${targetVersion}/info.json`
      ).then(r => r.json());

      await metahubClient
        .from('update_history')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          changelog: versionInfo?.changelog?.tr || '',
        })
        .eq('id', historyData.id);

      console.log('Update completed successfully!');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Güncelleme başarıyla tamamlandı!',
          newVersion: targetVersion,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (error) {
      console.error('Update failed, rolling back...', error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Rollback: Update history'yi güncelle
      await metahubClient
        .from('update_history')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: errorMessage,
        })
        .eq('id', historyData.id);

      throw error;
    }

  } catch (error) {
    console.error('Error in apply-update:', error);
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