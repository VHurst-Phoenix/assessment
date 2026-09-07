import { getSupabaseClient } from '../lib/supabaseClient';
import { env } from '../config/env';
import { getCategoryScores, getClarityScore, getRawTotal, getScoringBand } from '../pages/scoringBands';
import { clarityQuestions, executionQuestions, readinessQuestions } from '../pages/assessmentQuestions';
import { getExecutionResults, getReadinessResults } from '../pages/toolScoring';

const archetypeNames = {
  transitioner: 'Transitioner',
  strategist: 'Strategist',
  executor: 'Executor',
  phoenix: 'Phoenix',
};

function assertSupabaseClient() {
  const { client, error } = getSupabaseClient();

  if (error || !client) {
    throw new Error(error || 'Supabase is not configured correctly.');
  }

  return client;
}

function withTimeout(promise, timeoutMs = 30000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase request timed out. Please check your connection and try again.')), timeoutMs)
    ),
  ]);
}

function handleSupabaseError(error, fallbackMessage) {
  if (!error) return;
  const message = typeof error === 'string' ? error : error.message || fallbackMessage;
  if (message.includes('Failed to fetch') || message.includes('fetch') || message.includes('NetworkError')) {
    throw new Error('Unable to connect to Supabase database. Please check your network connection or VITE_SUPABASE_URL configuration.');
  }
  throw new Error(message);
}

async function debugInsert({ tableName, row, error, fallbackMessage }) {
  // This function is only meant for richer error context.
  const errorDetails = {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
  };

  console.error('[supabaseRestClient] Insert failed', {
    tableName,
    row,
    error: errorDetails,
    fallbackMessage,
  });

  handleSupabaseError(error, fallbackMessage);
}

function isMissingColumnError(error, columnName) {
  const message = error?.message || error?.details || '';
  return message.includes(columnName) && message.includes('schema cache');
}

export function mapAssessment(row) {
  if (!row) return null;
  const answers = Array.isArray(row.responses) ? row.responses : [];
  const hasCompleteResponses = answers.length === clarityQuestions.length;
  const correctedRawScore = hasCompleteResponses ? getRawTotal(answers) : row.raw_score;
  const correctedScore = hasCompleteResponses ? getClarityScore(answers) : row.score;
  const correctedBand = hasCompleteResponses ? getScoringBand(correctedScore) : null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    company: row.company,
    segment: row.segment,
    identity: row.identity,
    source: row.source,
    context: row.context,
    consentTimestamp: row.consent_timestamp,
    consentVersion: row.consent_version,
    responses: answers,
    answers,
    rawScore: correctedRawScore,
    score: correctedScore,
    archetype: correctedBand?.key || row.archetype,
    archetypeName: correctedBand?.label || archetypeNames[row.archetype] || row.archetype || '',
    categoryScores: hasCompleteResponses ? getCategoryScores(answers) : null,
    dimScores: Array.isArray(row.dim_scores) ? row.dim_scores : [],
    date: row.created_at,
  };
}

export function mapTestimonial(row) {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    anonymous: row.anonymous,
    role: row.role,
    segment: row.segment,
    // `stage` remains a backwards-compatible read of old testimonials.
    stage: row.band || row.stage,
    band: row.band || row.stage,
    bandSource: row.band_source || 'self-reported',
    showBand: row.show_band !== false,
    matchedAssessmentId: row.matched_assessment_id,
    beforeBand: row.before_band,
    afterBand: row.after_band,
    before: row.before,
    shift: row.shift,
    after: row.after,
    status: row.status,
    date: row.created_at,
  };
}

export function mapReadiness(row) {
  if (!row) return null;
  const answers = Array.isArray(row.responses) ? row.responses : [];
  const calculated = answers.length === readinessQuestions.length ? getReadinessResults(answers) : null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    company: row.company,
    segment: row.segment,
    score: calculated?.score ?? row.score,
    categoryScores: calculated?.categoryScores ?? (Array.isArray(row.category_scores) ? row.category_scores : []),
    band: calculated?.band?.label ?? row.band,
    gap: calculated?.gap?.archetype ?? row.gap,
    responses: answers,
    answers,
    sessionType: row.session_type,
    sessionDate: row.session_date,
    date: row.created_at,
  };
}

export function mapExecutionForm(row) {
  if (!row) return null;
  const answers = Array.isArray(row.responses) ? row.responses : [];
  const calculated = answers.length === executionQuestions.length ? getExecutionResults(answers) : null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    company: row.company,
    segment: row.segment,
    score: calculated?.score ?? row.score,
    categoryScores: calculated?.categoryScores ?? (Array.isArray(row.category_scores) ? row.category_scores : []),
    band: calculated?.band?.label ?? row.band,
    gap: calculated?.gap?.archetype ?? row.gap,
    programCheckpoint: row.program_checkpoint,
    answers,
    status: row.status,
    notes: row.notes,
    date: row.created_at,
  };
}

function assessmentRow(payload, { includeDimScores = true } = {}) {
  const row = {
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    identity: payload.identity ?? payload.gender ?? null,
    company: payload.company ?? null,
    segment: payload.segment ?? null,
    source: payload.source ?? null,
    context: payload.context ?? null,
    responses: payload.answers ?? payload.responses ?? [],
    raw_score: Number(payload.rawScore ?? getRawTotal(payload.answers ?? payload.responses ?? [])),
    score: Number(payload.score ?? 0),
    archetype: payload.archetype ?? null,
    consent_timestamp: payload.consentTimestamp ?? null,
    consent_version: payload.consentVersion ?? null,
    created_at: payload.date ?? new Date().toISOString(),
  };

  if (includeDimScores) {
    row.dim_scores = Array.isArray(payload.dimScores) ? payload.dimScores : null;
  }

  return row;
}

function readinessRow(payload) {
  return {
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    company: payload.company ?? null,
    segment: payload.segment ?? null,
    score: Number(payload.score ?? 0),
    category_scores: Array.isArray(payload.categoryScores) ? payload.categoryScores : [],
    band: payload.band ?? null,
    gap: payload.gap ?? null,
    responses: payload.answers ?? payload.responses ?? [],
    session_type: payload.sessionType ?? null,
    session_date: payload.sessionDate ?? null,
    created_at: payload.date ?? new Date().toISOString(),
  };
}

function executionFormRow(payload) {
  return {
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    company: payload.company ?? null,
    segment: payload.segment ?? null,
    score: Number(payload.score ?? 0),
    category_scores: Array.isArray(payload.categoryScores) ? payload.categoryScores : [],
    band: payload.band ?? null,
    gap: payload.gap ?? null,
    program_checkpoint: payload.programCheckpoint ?? null,
    responses: payload.answers ?? [],
    status: payload.status ?? 'Pending',
    notes: payload.notes ?? null,
    created_at: payload.date ?? new Date().toISOString(),
  };
}

export async function createAssessment(payload, { signal } = {}) {
  const supabase = assertSupabaseClient();

  const insertAssessment = (row) => {
    let query = supabase
      .from(env.supabaseAssessmentsTable)
      .insert(row)
      .select('*')
      .single();

    if (signal) {
      query = query.abortSignal(signal);
    }

    return query;
  };

  try {
    let { data, error } = await withTimeout(insertAssessment(assessmentRow(payload)), 30000);

    if (isMissingColumnError(error, 'dim_scores')) {
      console.warn('[supabaseRestClient] Supabase assessments table is missing dim_scores column. Retrying assessment insert without optional dimension scores.', {
        originalError: error?.message,
        timestamp: new Date().toISOString(),
      });
      ({ data, error } = await withTimeout(insertAssessment(assessmentRow(payload, { includeDimScores: false })), 30000));
    }

    handleSupabaseError(error, `Failed to create assessment in ${env.supabaseAssessmentsTable}.`);
    return mapAssessment(data);
  } catch (err) {
    handleSupabaseError(err, `Failed to create assessment in ${env.supabaseAssessmentsTable}.`);
  }
}

export async function listAssessments() {
  const supabase = assertSupabaseClient();
  try {
    const { data, error } = await supabase
      .from(env.supabaseAssessmentsTable)
      .select('*')
      .order('created_at', { ascending: false });

    handleSupabaseError(error, `Failed to load assessments from ${env.supabaseAssessmentsTable}.`);
    return (data || []).map(mapAssessment);
  } catch (err) {
    handleSupabaseError(err, `Failed to load assessments from ${env.supabaseAssessmentsTable}.`);
  }
}

export async function fetchAllRows(tableName, { orderBy = 'created_at', ascending = false } = {}) {
  if (!tableName) {
    throw new Error('Missing Supabase table name.');
  }

  const supabase = assertSupabaseClient();
  const pageSize = 1000;
  let from = 0;
  let rows = [];

  try {
    while (true) {
      let query = supabase
        .from(tableName)
        .select('*')
        .range(from, from + pageSize - 1);

      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }

      const { data, error } = await query;

      handleSupabaseError(error, `Failed to fetch all rows from ${tableName}.`);

      rows = rows.concat(data || []);

      if (!data || data.length < pageSize) {
        break;
      }

      from += pageSize;
    }
  } catch (err) {
    handleSupabaseError(err, `Failed to fetch all rows from ${tableName}.`);
  }

  return rows;
}

export async function createTestimonial(payload) {
  const supabase = assertSupabaseClient();

  try {
    const { data, error } = await withTimeout(supabase.functions.invoke('submit-testimonial', { body: payload }), 30000);
    handleSupabaseError(error, 'Failed to create testimonial.');
    if (data?.error) throw new Error(data.error);
    return mapTestimonial(data?.testimonial || data);
  } catch (err) {
    handleSupabaseError(err, 'Failed to create testimonial.');
  }
}

export async function listTestimonials({ status } = {}) {
  const supabase = assertSupabaseClient();
  try {
    let query = supabase
      .from(env.supabaseTestimonialsTable)
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    handleSupabaseError(error, 'Failed to load testimonials.');
    return (data || []).map(mapTestimonial);
  } catch (err) {
    handleSupabaseError(err, 'Failed to load testimonials.');
  }
}

export async function updateTestimonialStatus(id, status) {
  if (!id) {
    throw new Error('Invalid testimonial id.');
  }

  if (!status) {
    throw new Error('Invalid status.');
  }

  const supabase = assertSupabaseClient();
  try {
    const { data, error } = await supabase
      .from(env.supabaseTestimonialsTable)
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    handleSupabaseError(error, 'Failed to update testimonial.');
    return mapTestimonial(data);
  } catch (err) {
    handleSupabaseError(err, 'Failed to update testimonial.');
  }
}

export async function createReadiness(payload) {
  const supabase = assertSupabaseClient();
  const tableName = env.supabaseReadinessTable;
  const row = readinessRow(payload);

  try {
    const { data, error } = await withTimeout(
      supabase
        .from(tableName)
        .insert(row)
        .select('*')
        .single(),
      30000
    );

    if (error) {
      return debugInsert({
        tableName,
        row,
        error,
        fallbackMessage: 'Failed to create readiness assessment.',
      });
    }

    return mapReadiness(data);
  } catch (err) {
    handleSupabaseError(err, 'Failed to create readiness assessment.');
  }
}

export async function listReadiness() {
  const supabase = assertSupabaseClient();
  try {
    const { data, error } = await supabase
      .from(env.supabaseReadinessTable)
      .select('*')
      .order('created_at', { ascending: false });

    handleSupabaseError(error, 'Failed to load readiness records.');
    return (data || []).map(mapReadiness);
  } catch (err) {
    handleSupabaseError(err, 'Failed to load readiness records.');
  }
}

export async function createExecutionForm(payload) {
  const supabase = assertSupabaseClient();
  const tableName = env.supabaseExecutionFormsTable;
  const row = executionFormRow(payload);

  try {
    const { data, error } = await withTimeout(
      supabase
        .from(tableName)
        .insert(row)
        .select('*')
        .single(),
      30000
    );

    if (error) {
      return debugInsert({
        tableName,
        row,
        error,
        fallbackMessage: 'Failed to create execution form.',
      });
    }

    return mapExecutionForm(data);
  } catch (err) {
    handleSupabaseError(err, 'Failed to create execution form.');
  }
}

export async function listExecutionForms() {
  const supabase = assertSupabaseClient();
  try {
    const { data, error } = await supabase
      .from(env.supabaseExecutionFormsTable)
      .select('*')
      .order('created_at', { ascending: false });

    handleSupabaseError(error, 'Failed to load execution records.');
    return (data || []).map(mapExecutionForm);
  } catch (err) {
    handleSupabaseError(err, 'Failed to load execution records.');
  }
}


// Delete helper functions
export async function deleteRow(tableName, id) {
  if (!tableName) {
    throw new Error('Missing table name for delete operation.');
  }
  if (!id) {
    throw new Error('Missing id for delete operation.');
  }
  const supabase = assertSupabaseClient();
  try {
    const { data, error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)
      .single();
    handleSupabaseError(error, `Failed to delete row from ${tableName}.`);
    return data;
  } catch (err) {
    handleSupabaseError(err, `Failed to delete row from ${tableName}.`);
  }
}

export async function deleteTestimonial(id) {
  return deleteRow(env.supabaseTestimonialsTable, id);
}

export async function deleteAssessment(id) {
  return deleteRow(env.supabaseAssessmentsTable, id);
}

export async function deleteReadiness(id) {
  return deleteRow(env.supabaseReadinessTable, id);
}

export async function deleteExecutionForm(id) {
  return deleteRow(env.supabaseExecutionFormsTable, id);
}
