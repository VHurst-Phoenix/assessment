const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY before running this script.');
}

async function main() {
  const row = {
    first_name: 'Test',
    last_name: 'Readiness',
    email: 'test.readiness@example.com',
    score: 80,
    responses: [{ q: 1, a: 4 }],
    session_type: 'clarity-intensive',
    session_date: '2026-06-01'
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/readiness?select=*`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(row)
    });

    if (res.ok) {
      const data = await res.json();
      console.log('✓ Successfully inserted readiness with extra columns!');
      console.log('Inserted record:', data);
    } else {
      const text = await res.text();
      console.error('✗ Failed to insert. Status:', res.status, text);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
