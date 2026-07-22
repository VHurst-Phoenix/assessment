import { getSupabaseClient } from '../lib/supabaseClient';
import { env } from '../config/env';

const archetypeNames = {
  phoenix_momentum: 'Phoenix Momentum',
  dreaming: 'Dreaming',
  awakening: 'Awakening',
};

function assertSupabaseClient() {
  const { client, error } = getSupabaseClient();

  if (error || !client) {
    throw new Error(error || 'Supabase is not configured correctly.');
  }

  return client;
}

function handleSupabaseError(error, fallbackMessage) {
  if (!error) return;
  throw new Error(error.message || fallbackMessage);
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

  const msg = error?.message || errorDetails?.details || fallbackMessage;
  throw new Error(msg);
}

function isMissingColumnError(error, columnName) {
  const message = error?.message || error?.details || '';
  return message.includes(columnName) && message.includes('schema cache');
}

export function mapAssessment(row) {
  if (!row) return null;
  const answers = Array.isArray(row.responses) ? row.responses : [];
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    identity: row.identity,
    source: row.source,
    context: row.context,
    responses: answers,
    answers,
    score: row.score,
    archetype: row.archetype,
    archetypeName: archetypeNames[row.archetype] || row.archetype || '',
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
    anonymous: row.anonymous,
    role: row.role,
    stage: row.stage,
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
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    score: row.score,
    responses: answers,
    answers,
    sessionType: row.session_type,
    sessionDate: row.session_date,
    date: row.created_at,
  };
}

export function mapExecutionForm(row) {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    answers: row.responses,
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
    source: payload.source ?? null,
    context: payload.context ?? null,
    responses: payload.answers ?? payload.responses ?? [],
    score: Number(payload.score ?? 0),
    archetype: payload.archetype ?? null,
    created_at: payload.date ?? new Date().toISOString(),
  };

  if (includeDimScores) {
    row.dim_scores = Array.isArray(payload.dimScores) ? payload.dimScores : null;
  }

  return row;
}

function testimonialRow(payload) {
  return {
    first_name: payload.firstName ?? null,
    last_name: payload.lastName ?? null,
    anonymous: payload.anonymous ? String(payload.anonymous) : 'No',
    role: payload.role ?? null,
    stage: payload.stage ?? null,
    before: payload.before ?? null,
    shift: payload.shift ?? null,
    after: payload.after ?? null,
    status: payload.status ?? 'Pending Review',
    created_at: payload.date ?? new Date().toISOString(),
  };
}

function readinessRow(payload) {
  return {
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    score: Number(payload.score ?? 0),
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
    responses: payload.answers ?? [],
    status: payload.status ?? 'Pending',
    notes: payload.notes ?? null,
    created_at: payload.date ?? new Date().toISOString(),
  };
}

export async function createAssessment(payload) {
  const supabase = assertSupabaseClient();

  const insertAssessment = (row) => supabase
    .from(env.supabaseAssessmentsTable)
    .insert(row)
    .select('*')
    .single();

  let { data, error } = await insertAssessment(assessmentRow(payload));

  if (isMissingColumnError(error, 'dim_scores')) {
    console.warn('[supabaseRestClient] Supabase assessments table is missing dim_scores column. Retrying assessment insert without optional dimension scores.', {
      originalError: error?.message,
      timestamp: new Date().toISOString(),
    });
    ({ data, error } = await insertAssessment(assessmentRow(payload, { includeDimScores: false })));
  }

  handleSupabaseError(error, `Failed to create assessment in ${env.supabaseAssessmentsTable}.`);
  return mapAssessment(data);
}

export async function listAssessments() {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from(env.supabaseAssessmentsTable)
    .select('*')
    .order('created_at', { ascending: false });

  handleSupabaseError(error, `Failed to load assessments from ${env.supabaseAssessmentsTable}.`);
  return (data || []).map(mapAssessment);
}

export async function fetchAllRows(tableName, { orderBy = 'created_at', ascending = false } = {}) {
  if (!tableName) {
    throw new Error('Missing Supabase table name.');
  }

  const supabase = assertSupabaseClient();
  const pageSize = 1000;
  let from = 0;
  let rows = [];

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

  return rows;
}

export async function createTestimonial(payload) {
  const supabase = assertSupabaseClient();
  const tableName = env.supabaseTestimonialsTable;
  const row = testimonialRow(payload);

  const { data, error } = await supabase
    .from(tableName)
    .insert(row)
    .select('*')
    .single();

  if (error) {
    return debugInsert({
      tableName,
      row,
      error,
      fallbackMessage: 'Failed to create testimonial.',
    });
  }

  return mapTestimonial(data);
}

export async function listTestimonials({ status } = {}) {
  const supabase = assertSupabaseClient();
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
}

export async function updateTestimonialStatus(id, status) {
  if (!id) {
    throw new Error('Invalid testimonial id.');
  }

  if (!status) {
    throw new Error('Invalid status.');
  }

  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from(env.supabaseTestimonialsTable)
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();

  handleSupabaseError(error, 'Failed to update testimonial.');
  return mapTestimonial(data);
}

export async function createReadiness(payload) {
  const supabase = assertSupabaseClient();
  const tableName = env.supabaseReadinessTable;
  const row = readinessRow(payload);

  const { data, error } = await supabase
    .from(tableName)
    .insert(row)
    .select('*')
    .single();

  if (error) {
    return debugInsert({
      tableName,
      row,
      error,
      fallbackMessage: 'Failed to create readiness assessment.',
    });
  }

  return mapReadiness(data);
}

export async function listReadiness() {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from(env.supabaseReadinessTable)
    .select('*')
    .order('created_at', { ascending: false });

  handleSupabaseError(error, 'Failed to load readiness records.');
  return (data || []).map(mapReadiness);
}

export async function createExecutionForm(payload) {
  const supabase = assertSupabaseClient();
  const tableName = env.supabaseExecutionFormsTable;
  const row = executionFormRow(payload);

  const { data, error } = await supabase
    .from(tableName)
    .insert(row)
    .select('*')
    .single();

  if (error) {
    return debugInsert({
      tableName,
      row,
      error,
      fallbackMessage: 'Failed to create execution form.',
    });
  }

  return mapExecutionForm(data);
}

export async function listExecutionForms() {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from(env.supabaseExecutionFormsTable)
    .select('*')
    .order('created_at', { ascending: false });

  handleSupabaseError(error, 'Failed to load execution records.');
  return (data || []).map(mapExecutionForm);
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
  const { data, error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id)
    .single();
  handleSupabaseError(error, `Failed to delete row from ${tableName}.`);
  return data;
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

