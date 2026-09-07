export const clarityBandOrder = ['Transitioner', 'Strategist', 'Executor', 'Phoenix'];

export const normaliseEmail = (email) => String(email || '').trim().toLowerCase();

export function isAdjacentBand(firstBand, secondBand) {
  return Math.abs(clarityBandOrder.indexOf(firstBand) - clarityBandOrder.indexOf(secondBand)) === 1;
}

// Match approved stories for a selected Clarity profile in the order coaches
// should consider them: exact band + segment, exact band, then adjacent band.
export function findTestimonialMatches(profile, testimonials) {
  if (!profile?.band || !Array.isArray(testimonials)) return { tier1: [], tier2: [], tier3: [] };
  const eligible = testimonials.filter((story) => story.status === 'Approved' && story.band);
  const tier1 = eligible.filter((story) => story.band === profile.band && story.segment === profile.segment);
  const tier2 = eligible.filter((story) => story.band === profile.band && !tier1.includes(story));
  const tier3 = eligible.filter((story) => isAdjacentBand(story.band, profile.band) && !tier1.includes(story) && !tier2.includes(story));
  return { tier1, tier2, tier3 };
}
