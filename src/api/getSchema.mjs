const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY before running this script.');
}

async function getSchema() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Tables found:', Object.keys(data.paths || {}));
      console.log('\n--- Details of /assessments ---');
      console.log(JSON.stringify(data.definitions?.assessments, null, 2));
      console.log('\n--- Details of /readiness ---');
      console.log(JSON.stringify(data.definitions?.readiness, null, 2));
    } else {
      console.log('Failed to fetch schema. Status:', response.status);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getSchema();
