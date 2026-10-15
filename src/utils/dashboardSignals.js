// Small, pure helpers for the Coach Console (Dashboard Build Spec modules).

import { normaliseEmail } from './testimonialMatching.js';

// Position meanings — Clarity Final Build Spec §5.
export const POSITION_DESCRIPTIONS = {
  'System Evaluator': 'Low Inner / Low Outer — a necessary tactical pause.',
  'Strategic Planner': 'High Inner / Low Outer — strategy-rich, deployment-poor.',
  'Kinetic Operator': 'Low Inner / High Outer — high activity, low strategy; burnout risk.',
  'Momentum Builder': 'High Inner / High Outer — peak operational flow.',
};

export const DATE_RANGES = [
  { value: 'all', label: 'All time' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'quarter', label: 'This quarter' },
];

export function isInDateRange(date, range, now = new Date()) {
  if (!range || range === 'all') return true;
  const time = new Date(date).getTime();
  if (Number.isNaN(time)) return false;
  if (range === 'quarter') {
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    return time >= quarterStart.getTime();
  }
  return time >= now.getTime() - Number(range) * 24 * 60 * 60 * 1000;
}

// Trajectory compares a record with the same client's previous submission in
// the same tool (matched by email). Movement under one point counts as holding.
export function getTrajectory(record, records) {
  const email = normaliseEmail(record?.email);
  if (!email || record?.score === null || record?.score === undefined) return null;
  const recordTime = new Date(record.date).getTime();
  const previous = (records || [])
    .filter((item) => item.id !== record.id && normaliseEmail(item.email) === email && new Date(item.date).getTime() < recordTime)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  if (!previous || previous.score === null || previous.score === undefined) return { direction: 'first', label: 'First check-in' };
  const change = Number(record.score) - Number(previous.score);
  if (change >= 1) return { direction: 'up', label: 'Improving', change };
  if (change <= -1) return { direction: 'down', label: 'Declining', change };
  return { direction: 'flat', label: 'Holding', change };
}
