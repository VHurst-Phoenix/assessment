import { useLocation, Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { sendAssessmentEmail, buildEmailHTML } from '../utils/emailService';
import { subscribeToConvertKit } from '../lib/convertKitClient';
import { dimFullNames, dimLabels, dimPhases, archetypes } from './assessmentQuestions.js';
import './AssessmentCompletePage.css';

const strengthInsights = [
  'This is where your energy is clearest right now. Notice it — not to feel good about it, but because your next step should start here. Strength without direction is still motion without momentum.',
  'You know what matters. That is rarer than it sounds. Use it as your filter for every decision in the next 90 days.',
  'You can see the patterns that have been running the show. That self-awareness is your edge. The next step is deciding what to do with what you see.',
  'Your direction is clear. The work now is building the belief that the destination is actually yours to claim.',
  'You trust yourself. That is the foundation everything else is built on. Protect it.'
];

const growthInsights = [
  'This dimension is quietly limiting everything else. Most people sense it but do not name it. You just named it. What you do with that information in the next 48 hours determines whether this assessment changes anything.',
  'When values are unclear, every decision costs twice as much energy. This is where the work starts.',
  'The pattern is still running in the background. Naming it is step one. Breaking it requires a different kind of support.',
  'You have capability without a clear direction to aim it at. That is an expensive gap. The Clarity Intensive closes it.',
  'Action without self-trust burns out fast. This is the foundational work.'
];

const AssessmentCompletePage = () => {
  const location = useLocation();
  const data = location.state;

  const dimScores = data?.dimScores || [0, 0, 0, 0, 0];
  const archetype = archetypes[data?.archetype] || archetypes.awakening;
  const avgScore = Math.round(dimScores.reduce((a, b) => a + b, 0) / 5);
  const avgPct = Math.round((avgScore / 25) * 100);
  const maxIdx = dimScores.indexOf(Math.max(...dimScores));
  let minIdx = dimScores.indexOf(Math.min(...dimScores));
  if (maxIdx === minIdx) minIdx = (maxIdx + 1) % 5;

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

  // 2. Grow Fills for Dimension Bars
  const [animateBars, setAnimateBars] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateBars(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // 3. Outbound Email sending
  const [emailStatus, setEmailStatus] = useState('sending'); // 'sending' | 'success' | 'error'
  const [emailError, setEmailError] = useState(null);
  const [convertKitStatus, setConvertKitStatus] = useState('idle'); // 'idle' | 'sending' | 'success' | 'error'
  const [convertKitError, setConvertKitError] = useState(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [resending, setResending] = useState(false);

  // Pre-build the email HTML once for the preview iframe
  const emailPreviewHTML = useMemo(() => (data ? buildEmailHTML(data) : ''), [data]);

  const triggerOutboundDelivery = async () => {
    if (!data) return;

    setEmailStatus('sending');
    setEmailError(null);
    setConvertKitStatus('sending');
    setConvertKitError(null);

    const [emailResult, convertKitResult] = await Promise.allSettled([
      sendAssessmentEmail(data),
      subscribeToConvertKit({
        email: data.email,
        firstName: data.firstName || '',
        archetype: data.archetype || 'awakening',
      }),
    ]);

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

    if (convertKitResult.status === 'fulfilled' && !convertKitResult.value?.error) {
      setConvertKitStatus('success');
    } else {
      const convertKitFailure =
        convertKitResult.status === 'rejected'
          ? convertKitResult.reason?.message
          : convertKitResult.value?.error;

      console.warn('[ConvertKit] subscription failed:', convertKitFailure);
      setConvertKitError(convertKitFailure || 'Unknown error');
      setConvertKitStatus('error');
    }
  };

  // Send on first mount
  useEffect(() => {
    if (!data) return undefined;
    let cancelled = false;

    const send = async () => {
      setEmailStatus('sending');
      setEmailError(null);
      setConvertKitStatus('sending');
      setConvertKitError(null);

      const [emailResult, convertKitResult] = await Promise.allSettled([
        sendAssessmentEmail(data),
        subscribeToConvertKit({
          email: data.email,
          firstName: data.firstName || '',
          archetype: data.archetype || 'awakening',
        }),
      ]);

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

      if (convertKitResult.status === 'fulfilled' && !convertKitResult.value?.error) {
        setConvertKitStatus('success');
      } else {
        const convertKitFailure =
          convertKitResult.status === 'rejected'
            ? convertKitResult.reason?.message
            : convertKitResult.value?.error;

        console.warn('[ConvertKit] subscription failed:', convertKitFailure);
        setConvertKitError(convertKitFailure || 'Unknown error');
        setConvertKitStatus('error');
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

  return (
    <div className="animate-fade-slide">
      {/* Dynamic Uniform Score Hero Section */}
      <div className="hero">
        <div className="hero-label">YOUR PHOENIX CLARITY RESULTS</div>
        <div className="score-hero-row">
          <div className="score-hero-big">{animatedScore}</div>
          <div className="score-hero-denom">/ 100</div>
        </div>
        <div className="r2-archetype-badge pulse-gold">{archetype.name}</div>
        <p className="score-hero-intro">{archetype.intro}</p>
      </div>

      <div className="container">
        {/* Email Delivery Interactive HUD */}
        <div className="email-status-card">
          {emailStatus === 'sending' && (
            <div className="email-status-inner">
              <span className="email-status-pulse-dot"></span>
              <div className="email-status-text-wrap">
                <strong>Generating Assessment Report...</strong>
                <span>Preparing detailed dimension scores and emailing to <em>{data.email}</em></span>
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
                <strong>Assessment Results Delivered!</strong>
                <span>A high-fidelity breakdown has been successfully dispatched to <strong>{data.email}</strong>.</span>
              </div>
              <div className="email-status-actions">
                <button className="email-preview-trigger-btn" onClick={() => setShowEmailPreview(true)}>
                  🔍 Open Email Report Preview
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
                <strong>Email Delivery Offline</strong>
                <span>Unable to establish mail servers, but your results have been locally archived.</span>
                {emailError && (
                  <div className="email-error-details" style={{ fontSize: '11px', color: '#8B2635', marginTop: '8px', background: '#FAECEE', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(139, 38, 53, 0.2)' }}>
                    <strong>Details:</strong> {emailError}
                  </div>
                )}
              </div>
              <div className="email-status-actions">
                <button className="email-preview-trigger-btn error" onClick={() => setShowEmailPreview(true)}>
                  🔍 Preview Report
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

        {convertKitStatus !== 'idle' && (
          <div className={`convertkit-status-card convertkit-${convertKitStatus}`} style={{ marginTop: 16, padding: '14px 18px', borderRadius: 12, background: convertKitStatus === 'error' ? '#FAECEE' : '#EFF6FF', color: convertKitStatus === 'error' ? '#8B2635' : '#0D1028' }}>
            <strong>ConvertKit automation</strong>{' '}
            {convertKitStatus === 'sending' && '— Subscribing this contact to your automation workflow...'}
            {convertKitStatus === 'success' && '— Contact successfully added to ConvertKit automation.'}
            {convertKitStatus === 'error' && `— Subscription failed: ${convertKitError || 'Unknown error'}`}
          </div>
        )}

        <div className="r2-section">
          <div className="r2-section-header">
            <div className="r2-section-title">YOUR FIVE DIMENSIONS</div>
            <div className="r2-section-sub">Each dimension scored out of 20 — the gold line shows your average across all five.</div>
          </div>
        <div className="r2-dimensions">
          {dimScores.map((rawScore, index) => {
            const pct = Math.round((rawScore / 25) * 100);
            const scaledOf20 = Math.round((rawScore / 25) * 20);
            const statusLabel = pct >= 72 ? 'Active' : pct >= 52 ? 'Developing' : 'Emerging';
            const statusClass = pct >= 72 ? 'status-active' : pct >= 52 ? 'status-developing' : 'status-emerging';
            return (
              <div className="r2-dim-row" key={dimLabels[index]}>
                <div className="r2-dim-label-wrap">
                  <span className="r2-dim-name">{dimLabels[index]}</span>
                  <span className="r2-dim-phase">{dimPhases[index]}</span>
                </div>
                <div className="r2-dim-bar-wrap">
                  <div className="r2-dim-track">
                    <div className="r2-dim-fill" style={{ width: animateBars ? `${pct}%` : '0%', transition: `width 1.2s cubic-bezier(0.25, 0.8, 0.25, 1) ${index * 120}ms` }}></div>
                    <div className="r2-avg-line" style={{ left: `${avgPct}%` }}></div>
                  </div>
                  <span className={`r2-dim-status ${statusClass}`}>{statusLabel}</span>
                </div>
                <div className="r2-dim-score-num">{scaledOf20}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="r2-split-section">
        <div className="r2-split-header">YOUR STRENGTHS &amp; GROWTH EDGE</div>
        <div className="r2-split-grid">
          <div className="r2-split-card r2-strength-card hover-lift">
            <div className="r2-split-card-label">YOUR STRONGEST DIMENSION</div>
            <div className="r2-split-card-name">{dimFullNames[maxIdx]}</div>
            <div className="r2-split-card-body">{strengthInsights[maxIdx]}</div>
          </div>
          <div className="r2-split-card r2-growth-card hover-lift">
            <div className="r2-split-card-label">YOUR PRIMARY GROWTH EDGE</div>
            <div className="r2-split-card-name">{dimFullNames[minIdx]}</div>
            <div className="r2-split-card-body">{growthInsights[minIdx]}</div>
          </div>
        </div>
      </div>

      <div className="r2-direct-read">
        <div className="r2-dr-label">WHAT YOUR SCORES ARE ACTUALLY TELLING ME</div>
        <div className="r2-dr-sublabel">VETA'S DIRECT READ — BASED ON YOUR RESULTS</div>
        <div className="r2-dr-intro">Your scores reveal something most people in your position never get told.</div>
        <div className="r2-dr-body">{archetype.directRead}</div>
      </div>

      <div className="r2-cta-block hover-glow">
        <div className="r2-cta-top">
          <div className="r2-cta-headline">The next step is a 90-minute conversation.</div>
          <div className="r2-cta-body">Your results have been sent to your email. The Clarity Intensive is where we take what the assessment surfaced and turn it into a specific, actionable direction — in one session. Most clients leave with more clarity than they got from six months of trying to figure it out alone. There are limited spots. Book yours now.</div>
          <div className="r2-cta-credit">✦ Your $497 Clarity Intensive fee applies as a full credit toward any coaching package if you upgrade within 30 days.</div>
          <div className="r2-cta-buttons">
            <a href="https://phoneixclearinsight.as.me/schedule/e8a7e423/appointment/92792406/calendar/14034515" className="r2-btn-primary scale-on-hover">Book Us →</a>
            <a href="https://www.phoenixclearinsight.com/program" className="r2-btn-secondary scale-on-hover">View Our Program</a>
          </div>
          <div className="r2-scholarship-note">Scholarship pricing available. Ask about it during your discovery call.</div>
        </div>
        <div className="r2-quote-block">
          <div className="r2-quote-mark">"</div>
          <div className="r2-quote-text">The assessment told you where you are. That is not the same as knowing what to do with it. Clarity without a next step is just interesting information. The Clarity Intensive turns it into a decision.</div>
          <div className="r2-quote-attr">— Veta P. Hurst, Esq., ICF-ACC</div>
        </div>
      </div>

      <div className="submit-section">
        <h3>Save Your Results</h3>
        <p>Click below to save your clarity score. You'll receive a confirmation at your email with your full breakdown.</p>
        <div className="success-msg">✓ Your results have been saved. Check your email for a confirmation with your full score breakdown.</div>
        <button 
          onClick={() => setShowEmailPreview(true)} 
          className="btn btn-secondary" 
          style={{ marginTop: '16px', border: '1px solid var(--gold)', background: 'transparent', display: 'inline-flex', gap: '8px' }}
        >
          📬 Open Interactive Email Viewer
        </button>
      </div>

      {/* High-fidelity email client preview modal — renders the exact HTML that is emailed */}
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
              <div><strong>Subject:</strong> Your Personal Phoenix Clarity Assessment Report</div>
              <div><strong>Date:</strong> {data.date ? new Date(data.date).toLocaleString() : new Date().toLocaleString()}</div>
            </div>
            <div className="email-modal-body">
              {/* Render the exact same HTML that gets emailed — pixel-perfect preview */}
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
    </div>
  );
};

export default AssessmentCompletePage;
