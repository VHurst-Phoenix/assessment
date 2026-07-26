import test from 'node:test';
import assert from 'node:assert/strict';
import { getAssessmentTab, getAssessmentPath } from './assessmentRoutes.js';

test('defaults to clarity for the public assessment route', () => {
  assert.equal(getAssessmentTab({ pathname: '/assessment' }), 'clarity');
});

test('uses the explicit route for readiness assessments', () => {
  assert.equal(getAssessmentTab({ pathname: '/assessment/readiness' }), 'readiness');
  assert.equal(getAssessmentPath('readiness'), '/assessment/readiness');
});

test('uses the explicit route for execution assessments', () => {
  assert.equal(getAssessmentTab({ pathname: '/assessment/execution' }), 'execution');
  assert.equal(getAssessmentPath('execution'), '/assessment/execution');
});

test('keeps legacy coach query params working', () => {
  assert.equal(getAssessmentTab({ mode: 'coach', assessment: 'readiness' }), 'readiness');
  assert.equal(getAssessmentTab({ mode: 'coach', assessment: 'execution' }), 'execution');
});
