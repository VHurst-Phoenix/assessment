// Redirect all API calls directly to Supabase REST client
export {
  createAssessment,
  fetchAllRows,
  listAssessments,
  createTestimonial,
  listTestimonials,
  updateTestimonialStatus,
  createReadiness,
  listReadiness,
  createExecutionForm,
  listExecutionForms,
  deleteTestimonial,
  deleteAssessment,
  deleteReadiness,
  deleteExecutionForm
} from './supabaseRestClient';
