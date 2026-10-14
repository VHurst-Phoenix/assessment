// Clarity report narrative — single source for the results page and the
// outbound email. Text is verbatim from "Clarity — Full Narrative Content
// Library v1" (Phoenix Clear Insight, August 20, 2026). Band copy lives in
// scoringBands.js (library Section 2). Edit narrative here only.

// Library Appendix A: equal 4-point tiers on the 4–20 category scale.
export const DIMENSION_TIERS = ['Emerging', 'Developing', 'Strong', 'Exceptional'];

export const narrativeTier = (score) => {
  const value = Number(score);
  if (value < 8) return 'Emerging';
  if (value < 12) return 'Developing';
  if (value < 16) return 'Strong';
  return 'Exceptional';
};

// Library Section 6 — indexed [dimension][tier], dimensions in clarityDimensions order.
export const dimensionNarratives = [
  // Strengths & Skills
  [
    `Right now, naming your own strengths plainly is harder than it should be. This isn't false modesty — a lot of the accomplished people we work with have spent years being useful to everyone else's goals, which is exactly the kind of pattern that makes your own core strengths blur into background noise. You likely have real, specific capability here; what's underdeveloped is the language and confidence to claim it out loud, to yourself first and then to others.`,
    `You can point to a few things you're good at, but the picture is still partial — some strengths are clear to you, others you can sense but can't quite name, and you may not be using the ones you do know consistently. This is a common in-between: enough self-knowledge to function, not yet enough to lead with it.`,
    `You have a working, mostly accurate picture of what you're good at, and you're using it — people come to you for specific things, and you know why. What's likely still developing is full-time deployment: bringing your sharpest strengths into more of your work, rather than reserving them for the moments that call for them.`,
    `You know exactly what you're good at, you say so without hedging, and you're using it consistently — this shows up as real energy rather than depletion in how you describe your work. At this level, the growth edge isn't discovery, it's stewardship: making sure you keep choosing work that actually uses this, rather than drifting into roles that don't.`,
  ],
  // Values & What Matters
  [
    `What matters most to you hasn't been clearly named yet — which makes it very hard to notice when your daily choices quietly contradict it. This is often the case for people who've spent a long stretch operating on other people's priorities (a job, a role, a family expectation) without stopping to ask what they'd choose if the choice were fully theirs.`,
    `You have a rough sense of what matters to you, but it's not yet specific enough to use as a real filter for decisions — so you can feel when something's off without always being able to say exactly which value got compromised. That specificity is the next unlock.`,
    `You can name what matters to you with real clarity, and most of your daily choices genuinely reflect it. Where this tends to loosen is under pressure or during transition, when a values match slips in favor of what's expedient — worth watching for, not worrying about.`,
    `Your values are clear, named, and consistently reflected in how you actually spend your time — you can feel it when something's off almost immediately, and you generally act on that signal. At this level, the edge is holding this clarity steady through the next big change, not just the current one.`,
  ],
  // Patterns & Blocks
  [
    `There's a pattern (or several) actively running the show right now — something learned a long time ago that made sense once and doesn't anymore, but still shapes what you do or avoid without much conscious input from you. This is the most common reason smart, capable people stay stuck: not a skills gap, a pattern gap. Naming it precisely is most of the work.`,
    `You can sense that something is getting in your own way, and you may even be able to describe it in general terms — but the exact mechanism (what triggers it, what it protects you from, what it costs you) isn't fully mapped yet. Partial awareness without a precise map tends to produce insight without behavior change.`,
    `You've identified your main pattern with real specificity, and you're actively interrupting it more often than not — this is genuinely difficult, unglamorous work, and it's already showing up in your other scores. What typically resurfaces at this stage is the same pattern in a new disguise, especially under stress.`,
    `You have real, working clarity on your own patterns — what they are, what triggers them, and how to catch them early — and it shows in how consistently you're operating from choice rather than reflex. This is a genuinely rare level of self-awareness; the edge now is mentoring or modeling it for others, since it rarely gets easier to sustain in isolation.`,
  ],
  // Direction & Opportunity
  [
    `Where you're actually headed is still foggy, and it's hard to evaluate an opportunity clearly when you don't have a direction to measure it against — so opportunities tend to arrive and get judged one at a time, in isolation, rather than against a real sense of where you're going. That's exhausting, and it's not a personal failing; it's what happens before direction has had a chance to form.`,
    `You have a general sense of direction — enough to rule some things out — but it's not specific enough yet to actively pull opportunities toward you rather than just reacting to whatever shows up. The next stage of this isn't more options; it's more precision about the ones you already have.`,
    `Your direction is reasonably clear, and you're recognizing real opportunity when it's in front of you. Where this tends to catch people at this level is timing and sequencing — knowing what's next, not just what's possible, and resisting good opportunities that aren't actually the right next one.`,
    `You have a clear, specific sense of direction, and it's actively shaping which opportunities you pursue and which you let pass — this is a genuinely strategic level of clarity. The edge here is protecting that direction from well-meaning noise as your visibility and options both keep expanding.`,
  ],
  // Alignment & Confidence
  [
    `There's a real gap right now between what you know to be true about yourself and what you're able to act on with confidence — the insight may already be there, but the follow-through consistently lags behind it. This gap is where most self-doubt actually lives: not a lack of capability, a lack of trust in the capability that's already present.`,
    `You're becoming more consistent, but confidence still comes and goes depending on the context or the audience — steady in some rooms, shakier in others. That inconsistency is useful data: it usually points to exactly where the remaining doubt is concentrated, rather than being evenly spread.`,
    `You're operating from real, mostly steady confidence, and your actions are lining up with what you actually believe about yourself more often than not. What tends to test this stage is a genuinely new arena — the confidence built in one context doesn't always transfer automatically to the next one, and that's worth expecting rather than being surprised by.`,
    `You're operating with strong, consistent internal alignment — what you believe, what you say, and what you do are closely matched, across most contexts. At this level the real risk isn't doubt, it's overcorrection: staying so committed to a hard-won confidence that it's slow to update when the situation genuinely calls for something different.`,
  ],
];

export const getDimensionNarrative = (dimensionIndex, score) =>
  dimensionNarratives[dimensionIndex]?.[DIMENSION_TIERS.indexOf(narrativeTier(score))] || '';

// Library Section 3.
export const positionNarratives = {
  'System Evaluator': `You're currently in an evaluating posture on both fronts — direction and values are still forming, and the outward action, confidence, and momentum that usually follow aren't fully engaged yet either. This isn't a low point; it's often the most honest place to start from, because it means you haven't committed real energy to a direction that isn't actually yours. People in System Evaluator tend to be quietly, carefully taking stock — reading the terrain before choosing where to move. The work here isn't to force momentum before it's earned. It's to get sharper, faster, about what you actually want, so the action that follows is pointed at the right target instead of just any target.`,
  'Strategic Planner': `You know where you're headed and why it matters — your Inner Clarity axis is strong. What hasn't caught up yet is the Outer Action axis: the strengths deployment and lived confidence that would turn a clear plan into visible motion. This is one of the most common and most fixable positions in the whole framework — the thinking work is largely done, and what remains is permission and follow-through, not more analysis. People in Strategic Planner often over-plan as a way of feeling in control while avoiding the more exposed step of actually moving. The unlock here is usually a single well-timed push into action, not another round of refinement.`,
  'Kinetic Operator': `You're in motion, and it shows — your strengths are active and your confidence reads as real in how you operate. What's still forming is the Inner Clarity axis underneath it: a fully settled sense of what matters most and exactly where this momentum is headed. This is a genuinely productive place to be, and also a place worth a periodic gut-check, because sustained action without a settled direction can quietly optimize for the wrong target for longer than people realize. The work here isn't to slow down. It's to occasionally look up from the doing and confirm the direction is still the one you'd choose.`,
  'Momentum Builder': `You're in peak operational flow — clear on what matters and where you're headed, and actively, confidently building toward it. Both axes are strong, which is genuinely rare and worth naming directly: most people spend years working toward exactly this combination. The real risk at this stage isn't stalling, it's coasting — assuming the clarity and momentum you've built will sustain themselves without deliberate maintenance. What tends to serve people here best isn't a new direction; it's protecting and periodically re-examining the one that's already working, before drift sets in unnoticed.`,
};

// Library Section 4.
export const frictionNarratives = {
  'Self-Discounter': `The friction showing up for you right now traces back to values that haven't been fully claimed as yours — even where you have some sense of direction, the deeper "what actually matters to me" question is still underdeveloped, and that uncertainty quietly drags on everything built on top of it. This often shows up as difficulty saying no, chronic people-pleasing, or a nagging sense that your choices are technically fine but not quite yours. The friction isn't a discipline problem. It's that you haven't yet given yourself full permission to name what you actually want, separate from what's expected of you.`,
  'Vision Staller': `The friction here centers on direction more than values — you have a reasonably clear sense of what matters to you, but translating that into a specific "and therefore, this is where I'm headed" has stalled. This often looks like being values-clear but strategy-vague: able to say what you care about, unable yet to say what that means you should actually do next. The drag isn't confusion about who you are. It's that the values haven't yet been converted into a concrete direction you can move toward.`,
  'Imposter Protector': `The friction here is Outer-Axis, and it centers on strengths more than alignment — even where your confidence and follow-through are holding up reasonably well, there's real hesitation around fully owning and deploying what you're actually good at. This is the classic imposter pattern: capability that's genuinely there, protected behind a layer of self-doubt that keeps it from being used at full strength. The drag isn't a skills gap. It's a permission gap — the strengths exist and are underused because claiming them out loud still feels like a risk.`,
  'The Magnifier': `The friction here is Outer-Axis, and it centers on alignment and confidence more than raw strengths — you likely know what you're capable of, but a pattern of overanalyzing, over-preparing, or second-guessing is slowing down how confidently you act on it. This tends to show up as perfectionism, rumination, or bracing for a critique that may never come. The drag isn't a lack of capability. It's that scrutiny — of yourself, of the situation, of every possible outcome — is running louder than the confidence that's actually earned.`,
};

// Library Section 5 — shown with the Growth Edge. The client's Growth Edge
// text itself is that dimension's tier commentary (getDimensionNarrative).
export const growthEdgeFraming = `Growth Edge names the single dimension where you have the most room to expand right now — not a weakness, and not a verdict on the rest of your profile, but the one place a small, deliberate stretch will move the needle most.`;
