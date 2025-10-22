import { createClient } from 'https://esm.sh/@metahub/metahub-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateManifest {
  latestVersion: string;
  minimumVersion: string;
  releaseDate: string;
  isCritical: boolean;
  downloadUrl: string;
  checksum: string;
}

interface VersionInfo {
  version: string;
  releaseDate: string;
  requiredVersion: string;
  isCritical: boolean;
  changelog: {
    tr: string;
  };
  estimatedTime: string;
}

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

    // Mevcut versiyonu al
    const { data: versionData, error: versionError } = await metahubClient
      .from('system_version')
      .select('version')
      .order('installed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (versionError) throw versionError;

    const currentVersion = versionData?.version || '1.0.0';
    console.log('Current version:', currentVersion);

    // VDS sunucudan manifest çek (örnek URL - kendi VDS URL'inizi buraya ekleyin)
    const updateServerUrl = Deno.env.get('UPDATE_SERVER_URL') || 'https://updates.yourdomain.com';

    let manifest: UpdateManifest;
    let versionInfo: VersionInfo;

    try {
      const manifestResponse = await fetch(`${updateServerUrl}/manifest.json`);
      if (!manifestResponse.ok) {
        throw new Error('Cannot fetch update manifest');
      }
      manifest = await manifestResponse.json();
      console.log('Manifest:', manifest);

      // Versiyon bilgisini çek
      const versionResponse = await fetch(`${updateServerUrl}/versions/${manifest.latestVersion}/info.json`);
      if (!versionResponse.ok) {
        throw new Error('Cannot fetch version info');
      }
      versionInfo = await versionResponse.json();
    } catch (error) {
      console.error('Update server unreachable:', error);
      return new Response(
        JSON.stringify({
          updateAvailable: false,
          currentVersion,
          error: 'Güncelleme sunucusuna ulaşılamıyor. VDS sunucunuzun çalıştığından emin olun.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Versiyon karşılaştırması
    const isNewer = compareVersions(manifest.latestVersion, currentVersion) > 0;

    if (isNewer) {
      return new Response(
        JSON.stringify({
          updateAvailable: true,
          currentVersion,
          latestVersion: manifest.latestVersion,
          releaseDate: versionInfo.releaseDate,
          isCritical: versionInfo.isCritical,
          changelog: versionInfo.changelog.tr,
          estimatedTime: versionInfo.estimatedTime,
          requiredVersion: versionInfo.requiredVersion,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({
        updateAvailable: false,
        currentVersion,
        latestVersion: manifest.latestVersion,
        message: 'Sisteminiz güncel!',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in check-updates:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;

    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
}