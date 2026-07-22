import { listAssessments, listTestimonials } from './supabaseRestClient.js';


// Simple smoke test against Supabase REST.
// Usage (from clarity-assessment-app folder):
//   node src/api/testSupabaseRest.mjs
//
// Note: This uses the same anon key used in supabaseRestClient.js.

function log(title, value) {
  console.log(`\n=== ${title} ===`);
  console.log(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
}

async function main() {
  try {
    log('LIST assessments (limit 1)', await listAssessments());
  } catch (e) {
    console.error('Failed to list assessments:', e?.message || e);
  }

  try {
    log('LIST testimonials (pending filter example: status=Pending Review)', await listTestimonials({ status: 'Pending Review' }));
  } catch (e) {
    console.error('Failed to list testimonials:', e?.message || e);
  }

  // We intentionally do NOT update anything by default.
  // If you want to test updates, uncomment the block below and provide a real id.
  //
  // const TEST_ID = 1;
  // try {
  //   log('UPDATE testimonial status', await updateTestimonialStatus(TEST_ID, 'Approved'));
  // } catch (e) {
  //   console.error('Failed to update testimonial status:', e?.message || e);
  // }

  console.log('\nDone.');
}

main();

