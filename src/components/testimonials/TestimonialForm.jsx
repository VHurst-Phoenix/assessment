import { useState } from 'react';
import { createTestimonial } from '../../api/dbClient';
import {
  CONSENT_NOTICE,
  EDIT_CHOICES,
  ENGAGEMENT_TYPES,
  NAME_DISPLAY_OPTIONS,
  PLACEMENTS,
  PRIVACY_NOTE,
  SELF_BAND_OPTIONS,
  STORY_FIELDS,
  TESTIMONIAL_CONSENT_VERSION,
  emptyTestimonialForm,
  validateTestimonial,
} from '../../pages/testimonialOptions';
import './TestimonialForm.css';

// Share Your Story — developer build request v1.2 (M1–M16), top to bottom.
// The heading and subtitle (M1) live in the page hero, once.
export default function TestimonialForm() {
  const [form, setForm] = useState(emptyTestimonialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const set = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const togglePlacement = (value) => {
    setForm((current) => ({
      ...current,
      permittedUses: current.permittedUses.includes(value)
        ? current.permittedUses.filter((item) => item !== value)
        : [...current.permittedUses, value],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setSubmitError('');

    const found = validateTestimonial(form);
    setErrors(found);
    if (Object.keys(found).length) {
      setSubmitError(found.consent && Object.keys(found).length === 1
        ? found.consent
        : 'Please complete the highlighted fields before submitting.');
      return;
    }

    // Honeypot: a bot filled the hidden field. Pretend success, save nothing.
    if (form.website) {
      setSubmitted(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await createTestimonial({
        ...form,
        consentTimestamp: new Date().toISOString(),
        consentVersion: TESTIMONIAL_CONSENT_VERSION,
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to save story:', err);
      setSubmitError(err.message || 'Your story could not be saved. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="card intake-card story-thanks" role="status">
        <h3>Thank you for sharing your story.</h3>
        <p>Veta reviews every story before anything is published, using the name option and places you chose. Nothing is published automatically.</p>
        {form.storyCallRequest && <p>You asked to tell your story in a short call; Veta will be in touch.</p>}
      </div>
    );
  }

  const fieldError = (key) => errors[key] && <span className="story-field-error" role="alert">{errors[key]}</span>;

  return (
    <div className="card intake-card story-form-card">
      <form onSubmit={handleSubmit} noValidate className="unified-form story-form">
        {/* M2 */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="story-first">First Name *</label>
            <input id="story-first" type="text" value={form.firstName} onChange={set('firstName')} maxLength={100} />
            {fieldError('firstName')}
          </div>
          <div className="form-group">
            <label htmlFor="story-last">Last Name *</label>
            <input id="story-last" type="text" value={form.lastName} onChange={set('lastName')} maxLength={100} />
            {fieldError('lastName')}
          </div>
        </div>
        <p className="story-helper story-helper-row">For follow-up. You choose below how your name appears.</p>

        {/* M3 */}
        <div className="form-group">
          <label htmlFor="story-email">Email *</label>
          <input id="story-email" type="email" value={form.email} onChange={set('email')} maxLength={320} />
          <span className="story-helper">Used for follow-up and, if you've taken the Clarity Assessment, to match your story to your results. Never shown publicly.</span>
          {fieldError('email')}
        </div>

        {/* M4 */}
        <div className="form-group">
          <label htmlFor="story-role">Role / Profession <span className="story-optional">(optional)</span></label>
          <input id="story-role" type="text" value={form.role} onChange={set('role')} maxLength={200} />
          <span className="story-helper">Shown with your story if it's published.</span>
        </div>

        {/* M5 */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="story-engagement">What did you work on with Veta? *</label>
            <select id="story-engagement" value={form.engagementType} onChange={set('engagementType')}>
              <option value="">Select one...</option>
              {ENGAGEMENT_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            {fieldError('engagementType')}
          </div>
          {/* M7 — sorting only; never on the public card */}
          <div className="form-group">
            <label htmlFor="story-segment">Segment <span className="story-optional">(optional)</span></label>
            <select id="story-segment" value={form.segment} onChange={set('segment')}>
              <option value="">Select segment...</option>
              <option value="Individual">Individual</option>
              <option value="Corporate">Corporate</option>
              <option value="Federal">Federal</option>
            </select>
          </div>
        </div>

        {/* M6 */}
        <fieldset className="story-fieldset">
          <legend>Your Clarity Band <span className="story-optional">(optional)</span></legend>
          <span className="story-helper">If you've taken the Clarity Assessment with this email, we'll use your actual results instead.</span>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="story-band-start">When you started</label>
              <select id="story-band-start" value={form.selfBandStart} onChange={set('selfBandStart')}>
                <option value="">Select...</option>
                {SELF_BAND_OPTIONS.map((band) => <option key={band} value={band}>{band}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="story-band-now">Now</label>
              <select id="story-band-now" value={form.selfBandNow} onChange={set('selfBandNow')}>
                <option value="">Select...</option>
                {SELF_BAND_OPTIONS.map((band) => <option key={band} value={band}>{band}</option>)}
              </select>
            </div>
          </div>
        </fieldset>

        {/* M13 */}
        <p className="story-privacy-note">{PRIVACY_NOTE}</p>

        {/* M8 / Section 4 */}
        {STORY_FIELDS.map((field) => (
          <div className="form-group story-question" key={field.key}>
            <span className="story-question-heading">{field.heading}</span>
            <label htmlFor={`story-${field.key}`}>{field.label} *</label>
            <span className="story-helper">{field.helper}</span>
            {field.key === 'quote' ? (
              <input id={`story-${field.key}`} type="text" value={form[field.key]} onChange={set(field.key)} placeholder={field.placeholder} maxLength={field.maxLength} />
            ) : (
              <textarea id={`story-${field.key}`} rows="3" value={form[field.key]} onChange={set(field.key)} placeholder={field.placeholder} maxLength={field.maxLength} />
            )}
            {fieldError(field.key)}
          </div>
        ))}
        <p className="story-helper story-length-hint">Two to four sentences each is plenty.</p>

        {/* M10 */}
        <fieldset className="story-fieldset">
          <legend>How should your name appear? *</legend>
          {NAME_DISPLAY_OPTIONS.map((option) => (
            <label className="story-choice" key={option.value}>
              <input type="radio" name="story-name-display" value={option.value} checked={form.nameDisplay === option.value} onChange={set('nameDisplay')} />
              <span>{option.label}</span>
            </label>
          ))}
          {fieldError('nameDisplay')}
        </fieldset>

        {/* M11 */}
        <fieldset className="story-fieldset">
          <legend>Where your story may appear</legend>
          {PLACEMENTS.map((option) => (
            <label className="story-choice" key={option.value}>
              <input type="checkbox" checked={form.permittedUses.includes(option.value)} onChange={() => togglePlacement(option.value)} />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>

        {/* M12 */}
        <fieldset className="story-fieldset">
          <legend>Editing your words *</legend>
          {EDIT_CHOICES.map((option) => (
            <label className="story-choice" key={option.value}>
              <input type="radio" name="story-edit-choice" value={option.value} checked={form.editChoice === option.value} onChange={set('editChoice')} />
              <span>{option.label}</span>
            </label>
          ))}
          {fieldError('editChoice')}
        </fieldset>

        {/* M14 */}
        <label className="story-choice story-choice-standalone">
          <input type="checkbox" checked={form.storyCallRequest} onChange={set('storyCallRequest')} />
          <span>I'd rather tell my story in a short call with Veta.</span>
        </label>

        {/* Honeypot (V2): hidden from people and screen readers */}
        <div className="story-hp" aria-hidden="true">
          <label htmlFor="story-website">Website</label>
          <input id="story-website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
        </div>

        {/* M9 — next to consent, unticked by default */}
        <label className="story-choice story-choice-standalone">
          <input type="checkbox" checked={form.showBand} onChange={set('showBand')} />
          <span>Show my Clarity Band with my story</span>
        </label>

        {/* M15 / Section 5 — directly above Submit */}
        <div className="consent-notice-block story-consent">
          <div className="consent-notice-heading">{CONSENT_NOTICE.title}</div>
          <div className="consent-notice-body">
            <p>{CONSENT_NOTICE.intro}</p>
            {CONSENT_NOTICE.sections.map(([heading, text]) => (
              <p key={heading}><strong>{heading}:</strong> {text}</p>
            ))}
          </div>
          <label className="consent-inline-checkbox" htmlFor="story-consent">
            <input id="story-consent" type="checkbox" checked={form.consent} onChange={set('consent')} />
            <span className="consent-inline-checkmark" />
            <span>{CONSENT_NOTICE.checkbox} <em className="story-optional">(Required)</em></span>
          </label>
          {fieldError('consent')}
        </div>

        {/* M16 — looks disabled until consent; still clickable so we can say why */}
        <button
          type="submit"
          className={`btn btn-gold story-submit ${form.consent ? '' : 'is-blocked'}`}
          aria-disabled={!form.consent || isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving…' : 'Submit Story'}
        </button>
        {submitError && <div className="assessment-submit-error" role="alert">{submitError}</div>}
      </form>
    </div>
  );
}
