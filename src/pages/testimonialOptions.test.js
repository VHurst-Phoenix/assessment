import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  EDIT_CHOICES,
  ENGAGEMENT_TYPES,
  NAME_DISPLAY_OPTIONS,
  PLACEMENTS,
  TESTIMONIAL_CONSENT_VERSION,
  emptyTestimonialForm,
  publicDisplayName,
  validateTestimonial,
} from './testimonialOptions.js';
import { toTestimonialExportRow } from '../utils/testimonialExport.js';

const migration = readFileSync(new URL('../../supabase/migrations/20261117120000_testimonial_form_v1_2.sql', import.meta.url), 'utf8');

const completeForm = () => ({
  ...emptyTestimonialForm(),
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  engagementType: 'clarity_intensive',
  before: 'b',
  shift: 's',
  after: 'a',
  quote: 'q',
  editChoice: 'exact',
  consent: true,
});

test('form option values match the database insert rule', () => {
  for (const list of [ENGAGEMENT_TYPES, NAME_DISPLAY_OPTIONS, PLACEMENTS, EDIT_CHOICES]) {
    for (const { value } of list) assert.ok(migration.includes(`'${value}'`), `missing ${value} in migration`);
  }
  assert.ok(migration.includes(`consent_version = '${TESTIMONIAL_CONSENT_VERSION}'`));
});

test('consent starts empty and blocks submission (P1, M15, M16)', () => {
  const form = emptyTestimonialForm();
  assert.equal(form.consent, false);
  assert.ok(validateTestimonial({ ...completeForm(), consent: false }).consent);
  assert.deepEqual(validateTestimonial(completeForm()), {});
});

test('defaults: Anonymous name, Band hidden, no placements (Decisions 1–3)', () => {
  const form = emptyTestimonialForm();
  assert.equal(form.nameDisplay, 'anonymous');
  assert.equal(form.showBand, false);
  assert.deepEqual(form.permittedUses, []);
});

test('the quote and engagement type are required (P2, M5)', () => {
  assert.ok(validateTestimonial({ ...completeForm(), quote: ' ' }).quote);
  assert.ok(validateTestimonial({ ...completeForm(), quote: 'x'.repeat(301) }).quote);
  assert.ok(validateTestimonial({ ...completeForm(), engagementType: '' }).engagementType);
});

test('public name follows the client’s choice', () => {
  const story = { firstName: 'Ada', lastName: 'Lovelace' };
  assert.equal(publicDisplayName({ ...story, nameDisplay: 'anonymous' }), 'Anonymous client');
  assert.equal(publicDisplayName({ ...story, nameDisplay: 'first_last_initial' }), 'Ada L.');
  assert.equal(publicDisplayName({ ...story, nameDisplay: 'full_name' }), 'Ada Lovelace');
  assert.equal(publicDisplayName({ ...story }), 'Anonymous client');
});

test('CSV lists only the checked placements and flags assessment-only as feedback', () => {
  const row = toTestimonialExportRow({
    engagementType: 'assessment_only',
    nameDisplay: 'first_last_initial',
    permittedUses: ['social_media', 'speaking'],
    editChoice: 'shorten_with_approval',
    storyCallRequest: true,
  });
  assert.equal(row['Permitted Uses'], 'Social media; Speaking');
  assert.equal(row['Story Type'], 'Feedback');
  assert.equal(row['Engagement Type'], 'Assessment only');
  assert.equal(row['Name Display'], 'First name and last initial');
  assert.equal(row['Edit Choice'], 'You may shorten them; send me the edit to approve');
  assert.equal(row['Story-Call Request'], 'Yes');
});
