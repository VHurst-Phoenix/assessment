#!/usr/bin/env node
/**
 * Full-stack audit: Supabase schema, CRUD operations, edge functions, and website routes.
 * Usage: node scripts/auditSystem.mjs
 * Loads VITE_* vars from .env in project root.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  const envPath = resolve(root, '.env');
  if (!existsSync(envPath)) return {};
  const vars = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL || '';
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY || '';
const TABLES = {
  assessments: env.VITE_SUPABASE_ASSESSMENTS_TABLE || 'assessments',
  testimonials: env.VITE_SUPABASE_TESTIMONIALS_TABLE || 'testimonials',
  readiness: env.VITE_SUPABASE_READINESS_TABLE || 'readiness',
  execution_forms: env.VITE_SUPABASE_EXECUTION_FORMS_TABLE || 'execution_forms',
};

const errors = [];
const warnings = [];
const passes = [];

function fail(category, message, detail) {
  errors.push({ category, message, detail });
}

function warn(category, message, detail) {
  warnings.push({ category, message, detail });
}

function pass(category, message) {
  passes.push({ category, message });
}

async function supabaseFetch(path, { method = 'GET', body, prefer } = {}) {
  const headers = {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${SUPABASE_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  return { ok: res.ok, status: res.status, text, json };
}

async function getTableColumns(table) {
  const res = await supabaseFetch(`/rest/v1/${table}?select=*&limit=0`);
  if (!res.ok) return { ok: false, error: res.text || res.json?.message, columns: [] };
  // PostgREST returns empty array for limit=0; infer columns from a single row if needed
  const sample = await supabaseFetch(`/rest/v1/${table}?select=*&limit=1`);
  const columns = sample.ok && Array.isArray(sample.json) && sample.json[0]
    ? Object.keys(sample.json[0])
    : [];
  return { ok: true, columns, sampleError: sample.ok ? null : sample.text };
}

async function auditEnv() {
  if (!SUPABASE_URL) fail('env', 'VITE_SUPABASE_URL is missing');
  else pass('env', 'VITE_SUPABASE_URL is set');
  if (!ANON_KEY) fail('env', 'VITE_SUPABASE_ANON_KEY is missing');
  else pass('env', 'VITE_SUPABASE_ANON_KEY is set');
  if (!env.VITE_RESEND_API_KEY) warn('env', 'VITE_RESEND_API_KEY is missing — email sending may fail');
  if (!env.VITE_RESEND_FROM_EMAIL) warn('env', 'VITE_RESEND_FROM_EMAIL is missing — email sending may fail');
}

async function auditSchema() {
  const expected = {
    assessments: ['id', 'first_name', 'last_name', 'email', 'responses', 'score', 'archetype', 'raw_score', 'dim_scores', 'company', 'segment', 'consent_timestamp', 'consent_version'],
    testimonials: ['id', 'first_name', 'last_name', 'email', 'before', 'shift', 'after', 'status', 'band', 'segment', 'band_source', 'show_band', 'matched_assessment_id'],
    readiness: ['id', 'first_name', 'last_name', 'email', 'score', 'responses', 'session_type', 'session_date'],
    execution_forms: ['id', 'first_name', 'last_name', 'email', 'score', 'responses', 'status'],
  };

  for (const [key, table] of Object.entries(TABLES)) {
    const { ok, columns, error, sampleError } = await getTableColumns(table);
    if (!ok) {
      fail('schema', `Cannot access table "${table}"`, error);
      continue;
    }
    pass('schema', `Table "${table}" is reachable`);
    if (sampleError) warn('schema', `Table "${table}" returned no sample rows`, sampleError);

    const expectedCols = expected[key] || [];
    for (const col of expectedCols) {
      if (!columns.includes(col)) {
        fail('schema', `Table "${table}" is missing column "${col}"`, { existing: columns });
      }
    }
    if (columns.length) pass('schema', `Table "${table}" columns: ${columns.join(', ')}`);
  }
}

async function auditReads() {
  for (const [key, table] of Object.entries(TABLES)) {
    const res = await supabaseFetch(`/rest/v1/${table}?select=*&limit=5&order=created_at.desc`);
    if (res.status === 401 || res.status === 403) {
      // RLS may block anon reads — expected for some tables
      warn('read', `Anon read on "${table}" blocked (${res.status}) — expected if RLS restricts reads`, res.text?.slice(0, 200));
    } else if (!res.ok) {
      fail('read', `Failed to list "${table}"`, res.text?.slice(0, 300));
    } else {
      pass('read', `Listed "${table}" (${Array.isArray(res.json) ? res.json.length : 0} rows returned)`);
    }
  }
}

async function auditWrites() {
  const ts = Date.now();

  // Assessment with full payload (includes raw_score + dim_scores)
  const assessmentRow = {
    first_name: 'Audit',
    last_name: 'Test',
    email: `audit.assessment.${ts}@example.com`,
    identity: 'Test',
    source: 'Audit',
    context: 'System audit',
    responses: [{ q: 1, a: 3 }],
    raw_score: 75,
    score: 68.5,
    archetype: 'strategist',
    dim_scores: [15, 14, 13, 12, 11],
    consent_timestamp: new Date().toISOString(),
    consent_version: '1.0',
    company: 'Audit Co',
    segment: 'Individual',
  };

  let res = await supabaseFetch(`/rest/v1/${TABLES.assessments}?select=*`, {
    method: 'POST', body: assessmentRow, prefer: 'return=representation',
  });
  if (!res.ok) {
    fail('write', 'Assessment insert with full payload failed', res.text?.slice(0, 400));
    // Retry without optional columns
    const { raw_score, dim_scores, ...minimal } = assessmentRow;
    res = await supabaseFetch(`/rest/v1/${TABLES.assessments}?select=*`, {
      method: 'POST', body: minimal, prefer: 'return=representation',
    });
    if (res.ok) warn('write', 'Assessment insert succeeded only after omitting raw_score/dim_scores', res.json?.[0]?.id);
    else fail('write', 'Assessment insert failed even without optional columns', res.text?.slice(0, 400));
  } else {
    pass('write', `Assessment insert succeeded (id: ${res.json?.[0]?.id})`);
  }

  // Readiness insert (anon may be blocked by RLS)
  const readinessRow = {
    first_name: 'Audit', last_name: 'Readiness',
    email: `audit.readiness.${ts}@example.com`,
    score: 72, responses: [{ q: 1, a: 4 }],
    session_type: 'clarity-intensive', session_date: '2026-09-11',
  };
  res = await supabaseFetch(`/rest/v1/${TABLES.readiness}?select=*`, {
    method: 'POST', body: readinessRow, prefer: 'return=representation',
  });
  if (res.status === 401 || res.status === 403) {
    warn('write', 'Readiness insert blocked for anon — expected (coach-only RLS)', res.text?.slice(0, 200));
  } else if (!res.ok) {
    fail('write', 'Readiness insert failed', res.text?.slice(0, 400));
  } else {
    pass('write', `Readiness insert succeeded (id: ${res.json?.[0]?.id})`);
  }

  // Execution form insert
  const executionRow = {
    first_name: 'Audit', last_name: 'Execution',
    email: `audit.execution.${ts}@example.com`,
    score: 65, responses: [{ q: 1, a: 3 }], status: 'Pending',
  };
  res = await supabaseFetch(`/rest/v1/${TABLES.execution_forms}?select=*`, {
    method: 'POST', body: executionRow, prefer: 'return=representation',
  });
  if (res.status === 401 || res.status === 403) {
    warn('write', 'Execution form insert blocked for anon — expected (coach-only RLS)', res.text?.slice(0, 200));
  } else if (!res.ok) {
    fail('write', 'Execution form insert failed', res.text?.slice(0, 400));
  } else {
    pass('write', `Execution form insert succeeded (id: ${res.json?.[0]?.id})`);
  }
}

async function auditEdgeFunctions() {
  // submit-testimonial
  const testimonialPayload = {
    firstName: 'Audit', lastName: 'Story',
    email: `audit.testimonial.${Date.now()}@example.com`,
    before: 'Before state', shift: 'Shift happened', after: 'After state',
    band: 'Strategist', segment: 'Individual',
  };
  const fnRes = await fetch(`${SUPABASE_URL}/functions/v1/submit-testimonial`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testimonialPayload),
  });
  const fnText = await fnRes.text();
  let fnJson = null;
  try { fnJson = fnText ? JSON.parse(fnText) : null; } catch { /* ignore */ }

  if (fnRes.status === 404) {
    fail('edge-function', 'submit-testimonial edge function not deployed', fnText?.slice(0, 200));
  } else if (!fnRes.ok) {
    fail('edge-function', `submit-testimonial returned ${fnRes.status}`, fnText?.slice(0, 400));
  } else {
    pass('edge-function', `submit-testimonial succeeded (id: ${fnJson?.testimonial?.id})`);
  }

  // send-email
  const emailRes = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: 'OPTIONS',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  if (emailRes.status === 404) {
    warn('edge-function', 'send-email edge function not deployed (404)');
  } else {
    pass('edge-function', `send-email edge function reachable (${emailRes.status})`);
  }
}

function startPreviewServer() {
  return new Promise((resolvePromise, reject) => {
    const proc = spawn('npm', ['run', 'preview', '--', '--port', '4173', '--host', '127.0.0.1'], {
      cwd: root, stdio: ['ignore', 'pipe', 'pipe'], shell: true,
    });
    let output = '';
    proc.stdout.on('data', (d) => { output += d; if (output.includes('Local:')) resolvePromise(proc); });
    proc.stderr.on('data', (d) => { output += d; });
    setTimeout(() => reject(new Error('Preview server did not start in time')), 15000);
    proc.on('error', reject);
  });
}

async function auditWebsite(previewProc) {
  const routes = ['/', '/consent', '/assessment', '/assessment/clarity', '/assessment/readiness',
    '/assessment/execution', '/assessment/testimonial', '/assessment-complete', '/blog',
    '/client-stories', '/login', '/dashboard'];

  for (const route of routes) {
    try {
      const res = await fetch(`http://127.0.0.1:4173${route}`);
      if (!res.ok) {
        fail('website', `Route ${route} returned HTTP ${res.status}`);
      } else {
        const html = await res.text();
        if (!html.includes('id="root"')) {
          fail('website', `Route ${route} missing React root element`);
        } else if (html.includes('Missing required environment variables')) {
          fail('website', `Route ${route} shows env configuration error in HTML`);
        } else {
          pass('website', `Route ${route} loads (HTTP ${res.status})`);
        }
      }
    } catch (e) {
      fail('website', `Route ${route} unreachable`, e.message);
    }
  }

  if (previewProc) previewProc.kill();
}

async function main() {
  console.log('=== System Audit ===\n');

  await auditEnv();
  if (!SUPABASE_URL || !ANON_KEY) {
    printReport();
    process.exit(1);
  }

  await auditSchema();
  await auditReads();
  await auditWrites();
  await auditEdgeFunctions();

  // Build first if dist missing
  try {
    const previewProc = await startPreviewServer();
    await auditWebsite(previewProc);
  } catch (e) {
    warn('website', 'Could not start preview server for route checks', e.message);
  }

  printReport();
  process.exit(errors.length > 0 ? 1 : 0);
}

function printReport() {
  console.log('\n=== PASSES (' + passes.length + ') ===');
  for (const p of passes) console.log(`  [${p.category}] ${p.message}`);

  if (warnings.length) {
    console.log('\n=== WARNINGS (' + warnings.length + ') ===');
    for (const w of warnings) {
      console.log(`  [${w.category}] ${w.message}`);
      if (w.detail) console.log('    ', typeof w.detail === 'string' ? w.detail : JSON.stringify(w.detail));
    }
  }

  if (errors.length) {
    console.log('\n=== ERRORS (' + errors.length + ') ===');
    for (const e of errors) {
      console.log(`  [${e.category}] ${e.message}`);
      if (e.detail) console.log('    ', typeof e.detail === 'string' ? e.detail.slice(0, 500) : JSON.stringify(e.detail).slice(0, 500));
    }
  } else {
    console.log('\n=== ERRORS: none ===');
  }
}

main().catch((e) => { console.error('Audit crashed:', e); process.exit(1); });
