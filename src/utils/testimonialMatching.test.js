import test from 'node:test';
import assert from 'node:assert/strict';
import { findTestimonialMatches } from './testimonialMatching.js';

test('ranks approved testimonial matches by exact segment/band, exact band, then adjacent band', () => {
  const stories = [
    { id: 1, status: 'Approved', band: 'Executor', segment: 'Corporate' },
    { id: 2, status: 'Approved', band: 'Executor', segment: 'Federal' },
    { id: 3, status: 'Approved', band: 'Strategist', segment: 'Individual' },
    { id: 4, status: 'Pending Review', band: 'Executor', segment: 'Corporate' },
  ];
  const result = findTestimonialMatches({ band: 'Executor', segment: 'Corporate' }, stories);
  assert.deepEqual(result.tier1.map((story) => story.id), [1]);
  assert.deepEqual(result.tier2.map((story) => story.id), [2]);
  assert.deepEqual(result.tier3.map((story) => story.id), [3]);
});
