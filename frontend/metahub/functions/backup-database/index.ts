import { createClient } from 'https://esm.sh/@metahub/metahub-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TableData {
  table_name: string;
  rows: any[];
  row_count: number;
}

function escapeSQL(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'object') {
    // Handle arrays and objects (convert to JSON string)
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  // String - escape single quotes
  return `'${String(value).replace(/'/g, "''")}'`;
}

function generateSQLInserts(tableData: TableData): string {
  if (tableData.rows.length === 0) {
    return `-- No data for table: ${tableData.table_name}\n`;
  }

  const columns = Object.keys(tableData.rows[0]);
  let sql = `\n-- Data for table: ${tableData.table_name}\n`;

  for (const row of tableData.rows) {
    const values = columns.map(col => escapeSQL(row[col])).join(', ');
    sql += `INSERT INTO public.${tableData.table_name} (${columns.join(', ')}) VALUES (${values});\n`;
  }

  return sql;
}

function generateSQLBackup(backupData: any): string {
  let sql = `-- Database Backup\n`;
  sql += `-- Generated: ${backupData.timestamp}\n`;
  sql += `-- Total tables: ${backupData.metadata.total_tables}\n`;
  sql += `-- Total rows: ${backupData.metadata.total_rows}\n\n`;

  sql += `BEGIN;\n\n`;

  // Generate INSERT statements for each table
  for (const tableData of backupData.tables) {
    sql += generateSQLInserts(tableData);
  }

  sql += `\nCOMMIT;\n`;

  return sql;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get format from query parameters (json or sql)
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'json';
    const metahubClient = createClient(
      Deno.env.get('METAHUB_URL') ?? '',
      Deno.env.get('METAHUB_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await metahubClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await metahubClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error('Insufficient permissions');
    }

    console.log('Starting database backup for user:', user.id);

    // List of tables to backup (public schema only)
    const tablesToBackup = [
      'profiles',
      'user_roles',
      'categories',
      'products',
      'product_options',
      'product_faqs',
      'product_reviews',
      'product_stock',
      'activation_codes',
      'orders',
      'order_items',
      'cart_items',
      'coupons',
      'blog_posts',
      'custom_pages',
      'menu_items',
      'site_settings',
      'topbar_settings',
      'email_templates',
      'popups',
      'fake_order_notifications',
      'support_tickets',
      'ticket_replies',
      'notifications',
      'wallet_transactions',
      'wallet_deposit_requests',
      'payment_requests',
      'api_providers',
      'system_version',
      'update_history',
      'update_snapshots',
    ];

    const backupData: {
      timestamp: string;
      tables: TableData[];
      metadata: {
        total_tables: number;
        total_rows: number;
      };
    } = {
      timestamp: new Date().toISOString(),
      tables: [],
      metadata: {
        total_tables: 0,
        total_rows: 0,
      },
    };

    let totalRows = 0;

    // Backup each table
    for (const tableName of tablesToBackup) {
      try {
        const { data: rows, error } = await metahubClient
          .from(tableName)
          .select('*');

        if (error) {
          console.error(`Error backing up table ${tableName}:`, error);
          continue;
        }

        const tableData: TableData = {
          table_name: tableName,
          rows: rows || [],
          row_count: rows?.length || 0,
        };

        backupData.tables.push(tableData);
        totalRows += tableData.row_count;

        console.log(`Backed up ${tableName}: ${tableData.row_count} rows`);
      } catch (error) {
        console.error(`Failed to backup table ${tableName}:`, error);
      }
    }

    backupData.metadata.total_tables = backupData.tables.length;
    backupData.metadata.total_rows = totalRows;

    console.log(`Backup completed: ${backupData.metadata.total_tables} tables, ${totalRows} total rows`);

    if (format === 'sql') {
      const sqlContent = generateSQLBackup(backupData);
      return new Response(sqlContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/sql',
        },
      });
    }

    return new Response(JSON.stringify(backupData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
