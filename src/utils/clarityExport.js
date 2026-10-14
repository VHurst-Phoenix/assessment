// Clarity CSV export columns, in the order set by the Final Build Spec §9.
// Email, identity, source and context are intentionally left out of routine
// exports until the open Appendix A decision on those fields is made.

import { clarityDimensions } from '../pages/assessmentQuestions.js';
import { getFrictionVector, getGrowthEdge, getPosition } from '../pages/scoringBands.js';

const questionColumns = Array.from({ length: 25 }, (_, index) => `Q${String(index + 1).padStart(2, '0')}`);

export function toClarityExportRow(record) {
  const categoryScores = record.categoryScores?.length === 5 ? record.categoryScores : record.dimScores;
  const position = getPosition(categoryScores);
  const frictionVector = getFrictionVector(categoryScores, position);
  const growthEdge = getGrowthEdge(categoryScores);
  const answers = Array.isArray(record.answers) ? record.answers : [];

  const row = {
    Timestamp: record.date ?? '',
    'Client ID': record.id ?? '',
    'Client Name': [record.firstName, record.lastName].filter(Boolean).join(' '),
    'Company/Agency Affiliation': record.company ?? '',
    Segment: record.segment ?? '',
  };

  questionColumns.forEach((column, index) => {
    row[column] = answers[index] ?? '';
  });

  return {
    ...row,
    'Band Total': record.score ?? '',
    'Band Name': record.archetypeName ?? '',
    'Inner Axis Score': position?.innerAxis ?? '',
    'Outer Axis Score': position?.outerAxis ?? '',
    Position: position?.quadrant ?? '',
    'Friction Vector Archetype': frictionVector?.archetype ?? '',
    'Growth Edge Category': growthEdge ? clarityDimensions[growthEdge.index] : '',
    'Consent Timestamp': record.consentTimestamp ?? '',
    'Consent Notice Version': record.consentVersion ?? '',
  };
}
