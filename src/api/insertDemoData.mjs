// Insert demo data into Supabase tables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY before running this script.');
}

// Helper function for REST calls
async function fetchSupabase(path, method = 'GET', body = null) {
  const url = `${SUPABASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }

  return res.json().catch(() => null);
}

async function insertDemoData() {
  console.log('Inserting demo data into Supabase...\n');

  try {
    // Demo Assessment Data
    console.log('Adding demo assessment...');
    await fetchSupabase(
      '/rest/v1/assessments',
      'POST',
      {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        identity: 'Tech Lead',
        source: 'Internal Referral',
        context: 'Q2 Performance Assessment',
        responses: { communication: 8, leadership: 7, technical: 9 },
        score: 24,
        archetype: 'The Achiever'
      }
    );
    console.log('✓ Assessment added');

    // Demo Testimonial Data
    console.log('Adding demo testimonial...');
    await fetchSupabase(
      '/rest/v1/testimonials',
      'POST',
      {
        first_name: 'Jane',
        last_name: 'Smith',
        anonymous: 'No',
        role: 'Product Manager',
        stage: 'Growth',
        before: 'Struggling with prioritization',
        shift: 'Implemented clarity framework',
        after: 'Now leading cross-functional initiatives',
        status: 'Pending Review'
      }
    );
    console.log('✓ Testimonial added');

    // Demo Readiness Data
    console.log('Adding demo readiness assessment...');
    await fetchSupabase(
      '/rest/v1/readiness',
      'POST',
      {
        first_name: 'Michael',
        last_name: 'Johnson',
        email: 'michael.johnson@example.com',
        score: 78
      }
    );
    console.log('✓ Readiness assessment added');

    // Demo Execution Form Data
    console.log('Adding demo execution form...');
    await fetchSupabase(
      '/rest/v1/execution_forms',
      'POST',
      {
        first_name: 'Sarah',
        last_name: 'Williams',
        email: 'sarah.williams@example.com',
        responses: { action_plan: 'Complete', timeline: 'Q3', stakeholders: 'Identified' },
        status: 'In Progress',
        notes: 'Team alignment session scheduled for next week'
      }
    );
    console.log('✓ Execution form added');

    console.log('\n✓ Demo data insertion complete!');
  } catch (error) {
    console.error('✗ Error inserting demo data:', error.message);
  }
}

await insertDemoData();
