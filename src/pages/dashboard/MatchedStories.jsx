import { findTestimonialMatches } from '../../utils/testimonialMatching';

// Testimonial Matching Engine (Dashboard Build Spec): Tier 1 = same Segment +
// exact Band, Tier 2 = exact Band, Tier 3 = adjacent Band. bandSource shown.
export default function MatchedStories({ record, testimonials }) {
  const band = record.archetypeName || record.archetype;
  const matches = findTestimonialMatches({ band, segment: record.segment }, testimonials);
  const tier = matches.tier1.length ? 1 : matches.tier2.length ? 2 : matches.tier3.length ? 3 : null;
  const stories = tier ? matches[`tier${tier}`].slice(0, 2) : [];

  if (!tier) {
    return <p className="focus-muted">No approved stories match this Band yet.</p>;
  }

  return (
    <div className="matched-stories">
      <span className={`match-tier match-tier-${tier}`}>Tier {tier} match</span>
      {stories.map((story) => (
        <div className="matched-story" key={story.id}>
          <div className="matched-story-top">
            <strong>{story.anonymous === 'Yes' ? 'Anonymous client' : `${story.firstName || ''} ${story.lastName ? `${story.lastName[0]}.` : ''}`.trim()} — {story.band}</strong>
            <span className={`source-tag ${story.bandSource === 'verified' ? 'source-verified' : 'source-self'}`}>{story.bandSource || 'self-reported'}</span>
          </div>
          <p>“{story.shift || story.after || ''}”</p>
        </div>
      ))}
    </div>
  );
}
