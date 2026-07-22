// Test inserting without importing supabaseFetch
// Import supabaseFetch from supabaseRestClient.js. Note: we need to import it.
// Since supabaseRestClient doesn't export supabaseFetch, let's write a custom fetch here.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY before running this script.');
}

async function main() {
  const row = {
    first_name: 'Test',
    last_name: 'Without Dim Scores',
    email: 'test.nodims@example.com',
    identity: 'Test',
    source: 'Test',
    context: 'Test',
    responses: [],
    score: 50,
    archetype: 'awakening'
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/assessments?select=*`, {
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
      console.log('✓ Successfully inserted assessment without dim_scores!');
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
