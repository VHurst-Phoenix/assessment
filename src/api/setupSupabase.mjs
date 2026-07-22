// Direct SQL execution via Supabase REST API
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY before running this script.');
}

async function setupSupabaseTables() {
  const sql = `
    CREATE TABLE IF NOT EXISTS public.assessments (
      id BIGSERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email VARCHAR(255) NOT NULL,
      identity TEXT,
      source TEXT,
      context TEXT,
      responses JSONB,
      score INTEGER,
      archetype TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_assessments_email ON public.assessments(email);
    CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON public.assessments(created_at);

    CREATE TABLE IF NOT EXISTS public.testimonials (
      id BIGSERIAL PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      anonymous TEXT DEFAULT 'No',
      role TEXT,
      stage TEXT,
      before TEXT,
      shift TEXT,
      after TEXT,
      status TEXT DEFAULT 'Pending Review',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_testimonials_status ON public.testimonials(status);
    CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON public.testimonials(created_at);
  `;

  try {
    console.log('Checking Supabase connection...');
    
    // Try the RPC endpoint
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
      console.log('✓ Tables created successfully!');
      return true;
    } else {
      const error = await response.json();
      console.log('✗ RPC not available. You need to manually create tables in Supabase Dashboard:');
      console.log('  1. Go to https://app.supabase.com');
      console.log('  2. Go to SQL Editor');
      console.log('  3. Create new query and paste the SQL above');
      return false;
    }
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    return false;
  }
}

await setupSupabaseTables();
