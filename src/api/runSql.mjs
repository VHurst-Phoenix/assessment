const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY before running this script.');
}

async function runSql() {
  const sql = `
    ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS dim_scores JSONB;
    ALTER TABLE public.readiness ADD COLUMN IF NOT EXISTS responses JSONB;
    ALTER TABLE public.readiness ADD COLUMN IF NOT EXISTS session_type TEXT;
    ALTER TABLE public.readiness ADD COLUMN IF NOT EXISTS session_date DATE;
  `;

  try {
    console.log('Sending SQL migration to Supabase exec_sql RPC...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql })
    });

    if (response.ok) {
      console.log('✓ SQL executed successfully!');
      const result = await response.json();
      console.log('Result:', result);
    } else {
      const text = await response.text();
      console.log('✗ Failed to execute SQL via RPC. Status:', response.status);
      console.log('Response:', text);
    }
  } catch (error) {
    console.error('✗ Error connecting or executing:', error.message);
  }
}

runSql();
