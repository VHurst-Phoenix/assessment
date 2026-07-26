const viteEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const isDev = typeof import.meta !== 'undefined' && import.meta.env ? Boolean(import.meta.env.DEV) : false;

const requiredClientEnv = {
  supabaseUrl: viteEnv.VITE_SUPABASE_URL || '',
  supabaseAnonKey: viteEnv.VITE_SUPABASE_ANON_KEY || '',
};

const resendApiKey = viteEnv.VITE_RESEND_API_KEY || '';

export const env = {
  ...requiredClientEnv,
  supabaseAssessmentsTable: viteEnv.VITE_SUPABASE_ASSESSMENTS_TABLE || 'assessments',
  supabaseTestimonialsTable: viteEnv.VITE_SUPABASE_TESTIMONIALS_TABLE || 'testimonials',
  supabaseReadinessTable: viteEnv.VITE_SUPABASE_READINESS_TABLE || 'readiness',
  supabaseExecutionFormsTable: viteEnv.VITE_SUPABASE_EXECUTION_FORMS_TABLE || 'execution_forms',
  resendApiKey,
  resendFromEmail: viteEnv.VITE_RESEND_FROM_EMAIL || '',
  emailApiUrl: viteEnv.VITE_EMAIL_API_URL || '',
  emailFunctionUrl: viteEnv.VITE_EMAIL_FUNCTION_URL || '',
};

export function validateClientEnv() {
  const missing = Object.entries(requiredClientEnv)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required environment variables: ${missing.join(', ')}`,
    };
  }

  // Table name sanity checks (fail loudly if someone sets them to empty string)
  const tableVars = {
    supabaseAssessmentsTable: viteEnv.VITE_SUPABASE_ASSESSMENTS_TABLE,
    supabaseTestimonialsTable: viteEnv.VITE_SUPABASE_TESTIMONIALS_TABLE,
    supabaseReadinessTable: viteEnv.VITE_SUPABASE_READINESS_TABLE,
    supabaseExecutionFormsTable: viteEnv.VITE_SUPABASE_EXECUTION_FORMS_TABLE,
  };

  const emptyExplicit = Object.entries(tableVars)
    .filter(([, v]) => v !== undefined && String(v).trim() === '')
    .map(([k]) => k);


  if (emptyExplicit.length > 0) {
    return {
      valid: false,
      error: `Supabase table env vars are set but empty: ${emptyExplicit.join(', ')}`,
    };
  }

  return {
    valid: true,
    error: null,
  };
}

// Dev-time diagnostics so we can confirm the frontend is targeting the expected Supabase tables.
if (isDev) {
  console.log('[env] Supabase tables:', {
    assessments: env.supabaseAssessmentsTable,
    testimonials: env.supabaseTestimonialsTable,
    readiness: env.supabaseReadinessTable,
    execution_forms: env.supabaseExecutionFormsTable,
  });
}
