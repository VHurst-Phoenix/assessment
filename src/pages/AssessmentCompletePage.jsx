import { useLocation, Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { sendAssessmentEmail, buildEmailHTML, SUMMARY_EMAIL_SUBJECT } from '../utils/emailService';
import { buildClarityReport } from './clarityReport.js';
import { CLARITY_INTENSIVE_URL, DISCOVERY_CALL_URL, PROGRAM_URL } from '../config/booking.js';
import './AssessmentCompletePage.css';

// The results page is the summary only: score, Band, and the names of the
// Position, Friction Vector and Growth Edge. The complete narrative report is
// a PDF the coach releases after the client books the Clarity Intensive.
const AssessmentCompletePage = () => {
  const location = useLocation();
  const data = location.state;
  const report = useMemo(() => buildClarityReport(data), [data]);
  const band = report?.band;

  // 1. Count Up Score Animation
  const [animatedScore, setAnimatedScore] = useState(0);
  useEffect(() => {
    if (!data) {
      return undefined;
    }

    let start = 0;
    const end = data.score;
    if (end <= 0) {
      return undefined;
    }

    const duration = 1200; // ms
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setAnimatedScore(end);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [data]);

  // 2. Outbound summary email
  const [emailStatus, setEmailStatus] = useState('sending'); // 'sending' | 'success' | 'error'
  const [emailError, setEmailError] = useState(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [resending, setResending] = useState(false);

  // Pre-build the email HTML once for the preview iframe
  const emailPreviewHTML = useMemo(() => (data ? buildEmailHTML(data) : ''), [data]);

  const triggerOutboundDelivery = async () => {
    if (!data) return;

    setEmailStatus('sending');
    setEmailError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const [emailResult] = await Promise.allSettled([
        sendAssessmentEmail(data, controller.signal),
      ]);
      clearTimeout(timeoutId);

      if (emailResult.status === 'fulfilled') {
        setEmailStatus('success');
      } else {
        console.error('[AssessmentCompletePage] Email send failed:', {
          error: emailResult.reason?.message,
          email: data.email,
          assessmentId: data.id,
          timestamp: new Date().toISOString(),
        });
        setEmailError(emailResult.reason?.message || 'Unknown error');
        setEmailStatus('error');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[AssessmentCompletePage] Email send failed:', {
        error: err.message,
        email: data.email,
        assessmentId: data.id,
        timestamp: new Date().toISOString(),
      });
      setEmailError(err.message || 'Unknown error');
      setEmailStatus('error');
    }
  };

  // Send on first mount
  useEffect(() => {
    if (!data) return undefined;
    let cancelled = false;

    const send = async () => {
      setEmailStatus('sending');
      setEmailError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const [emailResult] = await Promise.allSettled([
          sendAssessmentEmail(data, controller.signal),
        ]);
        clearTimeout(timeoutId);

        if (cancelled) {
          return;
        }

        if (emailResult.status === 'fulfilled') {
          setEmailStatus('success');
        } else {
          console.error('[AssessmentCompletePage] Initial email send failed:', {
            error: emailResult.reason?.message,
            email: data.email,
            assessmentId: data.id,
            timestamp: new Date().toISOString(),
          });
          setEmailError(emailResult.reason?.message || 'Unknown error');
          setEmailStatus('error');
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (cancelled) {
          return;
        }
        console.error('[AssessmentCompletePage] Initial email send failed:', {
          error: err.message,
          email: data.email,
          assessmentId: data.id,
          timestamp: new Date().toISOString(),
        });
        setEmailError(err.message || 'Unknown error');
        setEmailStatus('error');
      }
    };

    send();
    return () => { cancelled = true; };
  }, [data]);

  const handleResend = async () => {
    setResending(true);
    try {
      await triggerOutboundDelivery();
    } finally {
      setResending(false);
    }
  };

  if (!data) {
    return (
      <div className="container">
        <p>No assessment data found. Please take the assessment first.</p>
        <Link to="/assessment" className="btn btn-primary">Take Assessment</Link>
      </div>
    );
  }

  const teasers = [
    { label: 'Your Position', value: report.position?.quadrant },
    { label: 'Your Friction Vector', value: report.frictionVector?.archetype },
    { label: 'Your Growth Edge', value: report.growthEdge?.name },
  ];

  return (
    <div className="animate-fade-slide">
      <div className="hero">
        <div className="hero-label">YOUR PHOENIX CLARITY RESULTS</div>
        <div className="score-hero-row">
          <div className="score-hero-big">{animatedScore}</div>
          <div className="score-hero-denom">/ 100</div>
        </div>
        <div className="r2-archetype-badge pulse-gold">{band?.label || 'Clarity Assessment'}</div>
        <p className="score-hero-intro" style={{ whiteSpace: 'pre-line' }}>{band?.intro || 'Your results are ready for review.'}</p>
      </div>

      <div className="container">
        {/* Email Delivery Interactive HUD */}
        <div className="email-status-card">
          {emailStatus === 'sending' && (
            <div className="email-status-inner">
              <span className="email-status-pulse-dot"></span>
              <div className="email-status-text-wrap">
                <strong>Sending your summary...</strong>
                <span>Emailing your Clarity summary to <em>{data.email}</em></span>
              </div>
              <div className="email-loading-spinner-wrap">
                <span className="email-spinner"></span>
              </div>
            </div>
          )}
          {emailStatus === 'success' && (
            <div className="email-status-inner success">
              <div className="email-status-icon">📬</div>
              <div className="email-status-text-wrap">
                <strong>Summary sent</strong>
                <span>Your Clarity summary has been sent to <strong>{data.email}</strong>.</span>
              </div>
              <div className="email-status-actions">
                <button className="email-preview-trigger-btn" onClick={() => setShowEmailPreview(true)}>
                  🔍 View Email
                </button>
                <button
                  className="email-preview-trigger-btn resend"
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending ? '↻ Sending…' : '↻ Resend Email'}
                </button>
              </div>
            </div>
          )}
          {emailStatus === 'error' && (
            <div className="email-status-inner error">
              <div className="email-status-icon">⚠️</div>
              <div className="email-status-text-wrap">
                <strong>We couldn't send your summary email</strong>
                <span>Your results are saved. You can try sending the email again.</span>
                {emailError && (
                  <div className="email-error-details" style={{ fontSize: '11px', color: '#8B2635', marginTop: '8px', background: '#FAECEE', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(139, 38, 53, 0.2)' }}>
                    <strong>Details:</strong> {emailError}
                  </div>
                )}
              </div>
              <div className="email-status-actions">
                <button className="email-preview-trigger-btn error" onClick={() => setShowEmailPreview(true)}>
                  🔍 View Email
                </button>
                <button
                  className="email-preview-trigger-btn resend"
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending ? '↻ Retrying…' : '↻ Retry Send'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="r2-section">
          <div className="r2-section-header">
            <div className="r2-section-title">YOUR CLARITY PROFILE AT A GLANCE</div>
            <div className="r2-section-sub">What each of these means for you is explained in your complete Clarity Report.</div>
          </div>
          <div className="r2-teaser-grid">
            {teasers.map((teaser) => (
              <div className="r2-teaser-card" key={teaser.label}>
                <div className="r2-teaser-label">{teaser.label}</div>
                <div className="r2-teaser-value">{teaser.value || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="r2-cta-block hover-glow">
          <div className="r2-cta-top">
            <div className="r2-cta-headline">Unlock your complete Clarity Report.</div>
            <div className="r2-cta-body">Your complete report explains what your Position, Friction Vector and Growth Edge mean for you, with a detailed read of all five dimensions and Veta's direct read of your results. It is released as a PDF when you book your Clarity Intensive — the 90-minute session where we turn what the assessment surfaced into a specific, actionable direction.</div>
            <div className="r2-cta-credit">✦ Your $497 Clarity Intensive fee applies as a full credit toward any coaching package if you upgrade within 30 days.</div>
            <div className="r2-cta-buttons">
              <a href={CLARITY_INTENSIVE_URL} className="r2-btn-primary scale-on-hover">Book Your Clarity Intensive →</a>
              <a href={DISCOVERY_CALL_URL} className="r2-btn-secondary scale-on-hover">Book a Free Discovery Call</a>
            </div>
            <div className="r2-scholarship-note">Scholarship pricing available. Ask about it during your discovery call. · <a href={PROGRAM_URL}>View our program</a></div>
          </div>
          <div className="r2-quote-block">
            <div className="r2-quote-mark">"</div>
            <div className="r2-quote-text">The assessment told you where you are. That is not the same as knowing what to do with it. Clarity without a next step is just interesting information. The Clarity Intensive turns it into a decision.</div>
            <div className="r2-quote-attr">— Veta P. Hurst, Esq., ICF-ACC</div>
          </div>
        </div>
      </div>

      {/* Email preview modal — renders the exact HTML that is emailed */}
      {showEmailPreview && (
        <div className="email-modal-overlay" onClick={() => setShowEmailPreview(false)}>
          <div className="email-modal-container animate-bounce-in" onClick={e => e.stopPropagation()}>
            <div className="email-modal-header">
              <div className="email-modal-title-bar">
                <span className="email-modal-dot red"></span>
                <span className="email-modal-dot yellow"></span>
                <span className="email-modal-dot green"></span>
                <span className="email-modal-title">Sent Mail Viewer</span>
              </div>
              <button className="email-modal-close" onClick={() => setShowEmailPreview(false)}>&times;</button>
            </div>
            <div className="email-envelope-info">
              <div><strong>From:</strong> Veta P. Hurst &lt;veta@phoenixclearinsight.com&gt;</div>
              <div><strong>To:</strong> {data.firstName || 'there'} {data.lastName || ''} &lt;{data.email || ''}&gt;</div>
              <div><strong>Subject:</strong> {SUMMARY_EMAIL_SUBJECT}</div>
              <div><strong>Date:</strong> {data.date ? new Date(data.date).toLocaleString() : new Date().toLocaleString()}</div>
            </div>
            <div className="email-modal-body">
              <iframe
                title="Email Preview"
                srcDoc={emailPreviewHTML}
                style={{ width: '100%', minHeight: '720px', border: 'none', background: '#F7F4EF' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentCompletePage;
