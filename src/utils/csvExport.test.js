import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeCsvValue, rowsToCsv } from './csvExport.js';
import { toClarityExportRow } from './clarityExport.js';

test('neutralizes formulas, including ones that also need quoting', () => {
  assert.equal(escapeCsvValue('=SUM(A1)'), "'=SUM(A1)");
  assert.equal(escapeCsvValue('@cmd'), "'@cmd");
  assert.equal(escapeCsvValue('=HYPERLINK("http://x","y")'), `"'=HYPERLINK(""http://x"",""y"")"`);
  assert.equal(escapeCsvValue('plain, text'), '"plain, text"');
  assert.equal(escapeCsvValue(42), '42');
});

test('exports Clarity records in the Build Spec §9 column order', () => {
  const row = toClarityExportRow({
    id: 'abc',
    date: '2026-10-14T00:00:00.000Z',
    firstName: 'Ada',
    lastName: 'Lovelace',
    company: 'Agency',
    segment: 'Federal',
    answers: Array(25).fill(3),
    score: 60,
    archetypeName: 'Executor',
    categoryScores: [12, 12, 12, 12, 12],
    consentTimestamp: '2026-10-14T00:00:00.000Z',
    consentVersion: '2026-10-14',
  });
  const header = rowsToCsv([row]).split('\n')[0].split(',');
  assert.deepEqual(header.slice(0, 6), ['Timestamp', 'Client ID', 'Client Name', 'Company/Agency Affiliation', 'Segment', 'Q01']);
  assert.equal(header[29], 'Q25');
  assert.deepEqual(header.slice(30), ['Band Total', 'Band Name', 'Inner Axis Score', 'Outer Axis Score', 'Position', 'Friction Vector Archetype', 'Growth Edge Category', 'Consent Timestamp', 'Consent Notice Version']);
  assert.equal(row.Position, 'System Evaluator');
  assert.equal(row['Friction Vector Archetype'], 'Imposter Protector');
  assert.equal(row['Growth Edge Category'], 'Strengths & Skills');
  assert.equal('email' in row, false);
});
