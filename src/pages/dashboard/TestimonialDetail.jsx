import {
  editChoiceLabel,
  engagementLabel,
  hasPublishConsent,
  isFeedbackOnly,
  nameDisplayLabel,
  placementLabels,
  publicDisplayName,
} from '../testimonialOptions';

const when = (value) => (value ? new Date(value).toLocaleString() : null);

// Moderation view for one story (Share Your Story v1.2). Shows exactly what
// the client allowed, and what the public card would show.
export default function TestimonialDetail({ story }) {
  const consented = hasPublishConsent(story);
  const uses = placementLabels(story.permittedUses);
  const timeline = [
    ['Submitted', story.date],
    ['Approved', story.approvedAt],
    ['Rejected', story.rejectedAt],
    ['Removal requested', story.removalRequestedAt],
    ['Removed', story.removedAt],
  ].filter(([, value]) => value);

  return (
    <>
      {!consented && (
        <section className="focus-callout story-warning">
          <span>No consent on file</span>
          <strong>Submitted before consent to publish existed. It cannot be published.</strong>
        </section>
      )}
      {isFeedbackOnly(story.engagementType) && (
        <section className="focus-callout story-feedback">
          <span>Feedback, not a coaching testimonial</span>
          <strong>The client chose "Assessment only". It is kept off the Client Stories page.</strong>
        </section>
      )}
      {story.storyCallRequest && (
        <section className="focus-callout">
          <span>Story call requested</span>
          <strong>The client would rather tell their story in a short call with Veta.</strong>
        </section>
      )}

      <div className="focus-output-grid">
        <div><span>Status</span><strong>{story.status || '—'}</strong><small>{when(story.statusChangedAt) ? `Changed ${when(story.statusChangedAt)}` : ''}</small></div>
        <div><span>Name shown</span><strong>{consented ? publicDisplayName(story) : '—'}</strong><small>{nameDisplayLabel(story.nameDisplay)}</small></div>
        <div><span>Worked on</span><strong>{engagementLabel(story.engagementType) || '—'}</strong><small>Internal only</small></div>
        <div><span>Band</span><strong>{story.band || '—'}</strong><small>{story.band ? `${story.bandSource || 'self-reported'} · ${story.showBand ? 'shown publicly' : 'not shown'}` : ''}</small></div>
        <div><span>May appear in</span><strong>{uses.length ? uses.join(', ') : 'Nowhere selected'}</strong></div>
        <div><span>Editing</span><strong>{editChoiceLabel(story.editChoice) || '—'}</strong></div>
        <div><span>Segment</span><strong>{story.segment || 'Unset'}</strong><small>Never shown publicly</small></div>
        <div><span>Consent</span><strong>{consented ? story.consentVersion : 'None'}</strong><small>{when(story.consentTimestamp) || ''}</small></div>
      </div>

      {(story.selfBandStart || story.selfBandNow) && (
        <p className="focus-muted">Self-reported Band: started {story.selfBandStart || '—'}, now {story.selfBandNow || '—'}.</p>
      )}

      <section className="story-preview">
        {story.quote && <div><span>One sentence</span><p>“{story.quote}”</p></div>}
        <div><span>Before</span><p>{story.before || 'No response provided.'}</p></div>
        <div><span>The shift</span><p>{story.shift || 'No response provided.'}</p></div>
        <div><span>After</span><p>{story.after || 'No response provided.'}</p></div>
      </section>

      {timeline.length > 0 && (
        <section className="focus-section">
          <h3>Status history</h3>
          {timeline.map(([label, value]) => <p className="focus-muted" key={label}>{label}: {when(value)}</p>)}
        </section>
      )}
    </>
  );
}

