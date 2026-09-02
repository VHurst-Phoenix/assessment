import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ConsentPage.css';

const CONSENT_KEY = 'phoenix_consent_accepted';

/** Check whether the user has already given consent this session. */
export function hasConsented() {
  return sessionStorage.getItem(CONSENT_KEY) === 'true';
}

const ConsentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('next') || '/assessment';

  const [agreed, setAgreed] = useState({
    dataCollection: false,
    coachingTerms: false,
    voluntaryParticipation: false,
  });
  const [submitError, setSubmitError] = useState('');

  const allChecked = Object.values(agreed).every(Boolean);

  const handleToggle = (key) => {
    setAgreed((prev) => ({ ...prev, [key]: !prev[key] }));
    setSubmitError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!allChecked) {
      setSubmitError('Please acknowledge all items before continuing.');
      return;
    }

    sessionStorage.setItem(CONSENT_KEY, 'true');
    navigate(redirectTo, { replace: true });
  };

  const handleDecline = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="animate-fade-slide">
      <div className="hero consent-hero">
        <div className="hero-label">Before You Begin</div>
        <h1>Informed <em>Consent</em></h1>
        <p>
          Please review and acknowledge the following before starting your assessment.
          Your privacy and trust are important to us.
        </p>
      </div>

      <div className="container">
        <form onSubmit={handleSubmit} className="consent-card">

          {/* ── Section 1: Data Collection & Privacy ── */}
          <div className="consent-section">
            <div className="consent-section-icon">🔒</div>
            <h3>Data Collection &amp; Privacy</h3>
            <p>
              The information you provide in this assessment—including your name, email address,
              and responses—will be securely stored and used exclusively by Phoenix Clear Insight
              Consulting to support your coaching experience. Your data will not be sold, shared
              with third parties, or used for marketing purposes without your explicit permission.
            </p>
            <label className="consent-checkbox-label" htmlFor="consent-data">
              <input
                id="consent-data"
                type="checkbox"
                checked={agreed.dataCollection}
                onChange={() => handleToggle('dataCollection')}
              />
              <span className="consent-checkmark" />
              <span>I understand how my data will be collected, stored, and used.</span>
            </label>
          </div>

          {/* ── Section 2: Coaching Terms ── */}
          <div className="consent-section">
            <div className="consent-section-icon">📋</div>
            <h3>Coaching Engagement Terms</h3>
            <p>
              This assessment is designed for self-reflection and coaching purposes only.
              It is not a diagnostic tool, a psychological evaluation, or a substitute for
              professional medical or mental health treatment. Results are indicative and are
              intended to support guided conversations with your coach.
            </p>
            <label className="consent-checkbox-label" htmlFor="consent-coaching">
              <input
                id="consent-coaching"
                type="checkbox"
                checked={agreed.coachingTerms}
                onChange={() => handleToggle('coachingTerms')}
              />
              <span className="consent-checkmark" />
              <span>I understand this is a coaching tool, not a clinical assessment.</span>
            </label>
          </div>

          {/* ── Section 3: Voluntary Participation ── */}
          <div className="consent-section">
            <div className="consent-section-icon">✋</div>
            <h3>Voluntary Participation</h3>
            <p>
              Your participation is entirely voluntary. You may stop the assessment at any time
              without consequence. You have the right to request deletion of your data at any
              point by contacting Phoenix Clear Insight Consulting directly.
            </p>
            <label className="consent-checkbox-label" htmlFor="consent-voluntary">
              <input
                id="consent-voluntary"
                type="checkbox"
                checked={agreed.voluntaryParticipation}
                onChange={() => handleToggle('voluntaryParticipation')}
              />
              <span className="consent-checkmark" />
              <span>I am participating voluntarily and may withdraw at any time.</span>
            </label>
          </div>

          {/* ── Error ── */}
          {submitError && (
            <div className="consent-error" role="alert">
              {submitError}
            </div>
          )}

          {/* ── Actions ── */}
          <div className="consent-actions">
            <button
              type="button"
              className="btn btn-secondary consent-decline-btn"
              onClick={handleDecline}
            >
              Decline &amp; Return Home
            </button>
            <button
              type="submit"
              className={`btn btn-primary consent-accept-btn ${allChecked ? 'ready' : ''}`}
              disabled={!allChecked}
            >
              I Agree — Continue to Assessment →
            </button>
          </div>

          <p className="consent-footer-note">
            By clicking "I Agree" you confirm that you have read, understood, and accept
            the terms outlined above. A copy of this consent is retained on your device for
            the duration of your session.
          </p>
        </form>
      </div>
    </div>
  );
};

export default ConsentPage;
