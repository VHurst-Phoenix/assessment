// Shared assessment content — single source of truth.
//
// Previously this content was duplicated between AssessmentPage.jsx and
// AssessmentCompletePage.jsx. It's extracted here so the new dashboard
// record detail view (and any future consumer) can render the exact
// question text a participant saw, instead of re-typing it a third time.

export const clarityDimensions = [
  "Strengths & Skills",
  "Values & What Matters",
  "Patterns & Blocks",
  "Direction & Opportunity",
  "Alignment & Confidence",
];

// Short labels used in dashboards / compact UI (matches AssessmentCompletePage.jsx)
export const dimLabels = ['Clarity', 'Confidence', 'Action', 'Alignment', 'Readiness'];
export const dimFullNames = clarityDimensions;
export const dimPhases = ['See It', 'Believe It', 'Achieve It', 'Alignment', 'Readiness'];

export const clarityQuestions = [
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

export const readinessQuestions = [
  "How clearly does this client see themselves—their values, strengths, and what they want?",
  "When you reflect back what you're hearing about them, how readily do they recognize themselves in it?",
  "How much does this client's sense of worth seem tied to external outcomes (title, approval, achievement)?",
  "How settled does this client seem in their own perspective, even when it's challenged?",
  "To what degree does this client believe they are capable of the change they're describing?",
  "How stable is this client's emotional baseline right now—not perfect, but functional?",
  "How well is this client able to sit with discomfort without needing to escape it immediately?",
  "Does this client appear to have the bandwidth—time, energy, mental space—for transformation work?",
  "How well-supported does this client feel by people in their life?",
  "How would you rate this client's overall emotional readiness to receive coaching feedback?",
  "How clear is this client on WHY they want this transformation—not just that they want it?",
  "How willing does this client seem to do work between sessions—not just show up to calls?",
  "How invested is this client in the process, not just in getting the answer quickly?",
  "How much has this client already demonstrated willingness to change—in their words or actions?",
  "How committed does this client seem to honoring the investment they're making—time, money, energy?",
];

export const executionQuestions = [
  "I have been taking consistent action between our coaching sessions.",
  "I complete the homework and reflection exercises my coach assigns.",
  "When I commit to doing something, I follow through on it.",
  "I am making progress on the goals we identified in our early sessions.",
  "I show up to each session having done what I said I would do.",
  "The actions I'm taking come from what I believe, not from what I think I should do.",
  "I can feel the difference between acting from fear and acting from alignment.",
  "I have caught myself operating from an old belief and consciously chosen a different response.",
  "My external actions are starting to match my internal shifts.",
  "I am making decisions that reflect who I am becoming, not who I used to be.",
  "When I hit an obstacle, I find a way through rather than stopping.",
  "I have recovered from at least one setback during this program without giving up.",
  "I can adapt my plan when something isn't working, without losing momentum.",
  "I am learning from what isn't working, not just celebrating what is.",
  "I believe I can sustain this growth beyond the end of our program.",
];

export const archetypes = {
  phoenix_momentum: {
    name: "Phoenix Momentum",
    intro: `You are in the Phoenix Momentum stage.\n\nYou've figured it out and started building. The direction is clear. The work is real. What you need now isn't more clarity — it's the faith to keep pressing forward even when the tangible proof of your progress hasn't shown up yet. You're closer than you think.`,
    directRead: `Your scores reveal something most people in your position never get told.\n\nYou have done the hard work of figuring it out. The direction is real. The building is happening. What your scores show is that the gap right now isn't capability or clarity — it's the faith to trust what you're building before the results are fully visible. That is one of the hardest phases of any transformation. Most people stop here because they can't see the proof yet. The Clarity Intensive is where we map exactly what the next chapter requires — and build the conviction to see it through.\n\nBook it.`
  },
  dreaming: {
    name: "Dreaming",
    intro: `You are in the Dreaming stage.\n\nThe vision is there. You can see exactly what you want. The problem is that you keep waiting for the conditions to be right before you move — and the conditions are never going to be right. That is not a planning problem. That is a belief problem.`,
    directRead: `Your scores reveal something most people in your position never get told.\n\nYou are not stuck because you lack clarity — you scored well there. You are stuck because some part of you does not yet believe you are allowed to have what you can see. That is a specific, identifiable pattern. I have seen it in dozens of high-achievers at exactly this stage, and I know what breaks it. It is not more planning. It is not more journaling. It is one direct conversation where someone who can see the pattern names it out loud.\n\nThat conversation is the Clarity Intensive. Book it.`
  },
  awakening: {
    name: "Awakening",
    intro: `You are in the Awakening stage.\n\nYou're still figuring out the pieces and navigating your healing journey. Identity is actively shifting. You're not lost — you're discovering. The discomfort you're feeling isn't a problem to solve. It's a signal that something real is happening.`,
    directRead: `Your scores reveal something most people in your position never get told.\n\nYou are not behind. You are not broken. You are in the middle of one of the most significant transitions a professional can go through — and you are navigating it without a map. The discomfort is not a signal that something is wrong. It is a signal that something real is happening. What you need right now is not a plan. It is a space where someone who has been exactly where you are can help you see what's actually shifting.\n\nThat space is the Clarity Intensive. Book it.`
  }
};