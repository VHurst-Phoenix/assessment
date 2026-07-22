import { createAssessment, listAssessments, listTestimonials } from './supabaseRestClient.js';

function log(title, value) {
  console.log(`\n=== ${title} ===`);
  console.log(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
}

async function main() {
  // Dummy data (as requested) - should create new rows.
  const payload = {
    firstName: 'Supabase',
    lastName: 'REST',
    email: `supabase.rest.${Date.now()}@example.com`,
    identity: 'Test identity',
    source: 'Test',
    context: 'Write smoke test',
    responses: [{ q: 1, a: 5 }],
    score: 88,
    archetype: 'phoenix_momentum',
    createdAt: new Date().toISOString()
  };

  try {
    log('CREATE assessment', await createAssessment(payload));
  } catch (e) {
    console.error('Failed to create assessment:', e?.message || e);
    return;
  }

  try {
    const rows = await listAssessments();
    log('LIST assessments (first 5)', rows.slice(0, 5));
  } catch (e) {
    console.error('Failed to list assessments after create:', e?.message || e);
  }

  try {
    // Just show current state (don’t update, to avoid changing prod data)
    const testimonials = await listTestimonials({ status: 'Pending Review' }).catch(() => []);
    log('LIST testimonials status=Pending Review', testimonials);
  } catch (e) {
    console.error('Failed to list testimonials:', e?.message || e);
  }

  console.log('\nDone.');
}

main();

