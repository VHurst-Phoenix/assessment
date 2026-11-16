// Clarity question sets that have been live, newest last. Stored responses
// are raw 1–5 answers, so each record must be scored against the set the
// client actually saw: the five reverse-scored items differ between sets.
// Cut-over times are the Vercel production deployments that shipped each set
// (VHurst-Phoenix/assessment), taken from GitHub's deployment records.

import { clarityQuestions } from './assessmentQuestions.js';

const ORIGINAL_QUESTIONS = [
  { text: "I know what I am genuinely good at and can name my top strengths clearly.", dim: 0 },
  { text: "I use my strengths regularly in my work or daily life.", dim: 0 },
  { text: "Other people often seek me out for my specific expertise or perspective.", dim: 0 },
  { text: "I feel energized, not drained, when I'm using my core skills.", dim: 0 },
  { text: "I can articulate what makes my approach or contribution unique.", dim: 0 },
  { text: "I know what matters most to me and can name my top values.", dim: 1 },
  { text: "My daily choices and actions reflect what I say I care about.", dim: 1 },
  { text: "When something feels wrong, I can identify which value is being compromised.", dim: 1 },
  { text: "I feel a sense of meaning and purpose in how I spend my time.", dim: 1 },
  { text: "I rarely compromise on things that are truly important to me.", dim: 1 },
  { text: "I can identify recurring patterns in my life that have helped me.", dim: 2 },
  { text: "I can name at least one belief or habit that has been holding me back.", dim: 2 },
  { text: "I understand why I tend to react or respond the way I do in stressful situations.", dim: 2 },
  { text: "I have stopped tolerating things in my life that no longer serve me.", dim: 2 },
  { text: "I can see the connection between my past experiences and my current choices.", dim: 2 },
  { text: "I have a clear sense of where I want to go in the next chapter of my life.", dim: 3 },
  { text: "I can see real opportunities available to me right now.", dim: 3 },
  { text: "I know what my next aligned step is, even if I haven't taken it yet.", dim: 3 },
  { text: "I feel excited—not just anxious—about what's ahead.", dim: 3 },
  { text: "I have a vision for my life that feels both meaningful and achievable.", dim: 3 },
  { text: "I trust my own judgment when making important decisions.", dim: 4 },
  { text: "My current life situation reflects who I am becoming, not just who I've been.", dim: 4 },
  { text: "I feel confident moving forward even when I don't have all the answers.", dim: 4 },
  { text: "I believe that what I want is actually possible for me.", dim: 4 },
  { text: "I feel clear, grounded, and ready to take my next step.", dim: 4 },
];

const INTERIM_QUESTIONS = [
  { text: "I know what I am genuinely good at and can name my top strengths clearly.", dim: 0 },
  { text: "I use my strengths regularly in my work or daily life.", dim: 0 },
  { text: "I rarely find others seeking out my specific expertise or perspective.", dim: 0, reverse: true },
  { text: "I feel energized, not drained, when I'm using my core skills.", dim: 0 },
  { text: "I can articulate what makes my approach or contribution unique.", dim: 0 },
  { text: "I know what matters most to me and can name my top values.", dim: 1 },
  { text: "My daily choices and actions reflect what I say I care about.", dim: 1 },
  { text: "When something feels wrong, I rarely identify which value is being compromised.", dim: 1, reverse: true },
  { text: "I feel a sense of meaning and purpose in how I spend my time.", dim: 1 },
  { text: "I rarely compromise on things that are truly important to me.", dim: 1 },
  { text: "I can identify recurring patterns in my life that have helped me.", dim: 2 },
  { text: "I struggle to name any belief or habit that has been holding me back.", dim: 2, reverse: true },
  { text: "I understand why I tend to react or respond the way I do in stressful situations.", dim: 2 },
  { text: "I have stopped tolerating things in my life that no longer serve me.", dim: 2 },
  { text: "I can see the connection between my past experiences and my current choices.", dim: 2 },
  { text: "I have a clear sense of where I want to go in the next chapter of my life.", dim: 3 },
  { text: "I can see real opportunities available to me right now.", dim: 3 },
  { text: "I rarely know what my next aligned step is, even if I haven't taken it yet.", dim: 3, reverse: true },
  { text: "I feel excited—not just anxious—about what's ahead.", dim: 3 },
  { text: "I have a vision for my life that feels both meaningful and achievable.", dim: 3 },
  { text: "I often doubt my own judgment when making important decisions.", dim: 4, reverse: true },
  { text: "My current life situation reflects who I am becoming, not just who I've been.", dim: 4 },
  { text: "I feel confident moving forward even when I don't have all the answers.", dim: 4 },
  { text: "I believe that what I want is actually possible for me.", dim: 4 },
  { text: "I feel clear, grounded, and ready to take my next step.", dim: 4 },
];

const FREQUENCY_SCALE = ['Rarely', 'Occasionally', 'Sometimes', 'Frequently', 'Consistently'];
const AGREEMENT_SCALE = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

export const QUESTION_SET_VERSIONS = [
  {
    id: 'original',
    label: 'Original question set (live until Sep 7, 2026)',
    liveUntil: '2026-09-07T13:49:32Z', // deploy a6132a5
    questions: ORIGINAL_QUESTIONS,
    scale: FREQUENCY_SCALE,
  },
  {
    id: 'interim',
    label: 'Interim question set (Sep 7 – Sep 29, 2026)',
    liveUntil: '2026-09-29T17:35:34Z', // deploy 3b8c24c
    questions: INTERIM_QUESTIONS,
    scale: AGREEMENT_SCALE,
  },
  {
    id: 'locked',
    label: 'Locked Build Spec question set (from Sep 29, 2026)',
    liveUntil: null,
    questions: clarityQuestions,
    scale: AGREEMENT_SCALE,
  },
];

export const CURRENT_QUESTION_SET = QUESTION_SET_VERSIONS[QUESTION_SET_VERSIONS.length - 1];

// A record without a usable date is treated as current (new submissions).
export function getQuestionSetFor(date) {
  const time = new Date(date).getTime();
  if (!date || Number.isNaN(time)) return CURRENT_QUESTION_SET;
  return QUESTION_SET_VERSIONS.find((set) => !set.liveUntil || time < new Date(set.liveUntil).getTime());
}
