import { useLocation, Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { sendAssessmentEmail, buildEmailHTML } from '../utils/emailService';
import { dimFullNames, dimLabels } from './assessmentQuestions.js';
import { MAX_CATEGORY_SCORE, getPosition, getFrictionVector, getGrowthEdge, getRawTotal, getScoringBand, getScoringBandByKey } from './scoringBands.js';
import './AssessmentCompletePage.css';

const narrativeTier = (score) => (score < 8 ? 'Emerging' : score < 12 ? 'Developing' : score < 16 ? 'Strong' : 'Exceptional');

const dimensionNarratives = [
  ['Naming your own strengths plainly is harder than it should be right now. The work is to notice your real capability and build the language and confidence to claim it.', 'You can point to a few strengths, but the picture is still partial. The next step is to name and use the strengths you already sense more consistently.', "You have a mostly accurate picture of what you are good at and are using it. The edge is full-time deployment: bringing your sharpest strengths into more of your work.", "You know what you are good at, say so without hedging, and use it consistently. Your edge is stewardship: keep choosing work that actually uses it."],
  ["What matters most to you has not been clearly named yet, which makes it hard to notice when daily choices contradict it. Start by separating what is yours from other people's priorities.", "You have a rough sense of what matters, but it is not yet specific enough to guide decisions. Naming that specificity is the next unlock.", 'You can name what matters with real clarity, and most choices reflect it. Watch for moments of pressure or transition, when expedience can displace a values match.', 'Your values are clear, named, and consistently reflected in how you spend your time. The edge is holding that clarity steady through the next big change.'],
  ["A learned pattern may be shaping what you do or avoid without much conscious input. This is not a skills gap; naming the pattern precisely is most of the work.", 'You can sense something getting in your way, but the trigger, protection, and cost are not fully mapped. A precise map turns insight into behavior change.', "You have identified a main pattern and are interrupting it more often than not. Expect it to resurface in a new disguise, especially under stress.", 'You have working clarity on your patterns, triggers, and early warning signs. The edge is sustaining this choice-led way of operating.'],
  ["Where you are headed is still foggy, so every opportunity has to be judged in isolation. This is what direction feels like before it has had a chance to form.", 'You have a general sense of direction, enough to rule some things out. The next stage is precision about the options already in front of you.', "Your direction is clear and you recognize real opportunity. The edge is sequencing: knowing what is next, not just what is possible.", 'Your direction actively shapes which opportunities you pursue and which you let pass. Protect it from well-meaning noise as your options expand.'],
  ["There is a gap between what you know about yourself and what you can act on with confidence. The issue is not capability; it is trust in capability already present.", 'You are becoming more consistent, but confidence changes with the context or audience. That variation is useful data about where doubt is concentrated.', "You are operating from mostly steady confidence, and your actions increasingly match what you believe. Expect a new arena to test whether that confidence transfers.", 'What you believe, say, and do are closely matched across most contexts. Stay open enough to update that hard-won confidence when the situation calls for it.'],
];

const positionNarratives = {
  'System Evaluator': "Direction and values are still forming, and outward action and confidence have not fully engaged yet. This is not a low point; it is often the most honest place to begin. The work is not to force momentum before it is earned, but to get sharper about what you actually want so future action is pointed at the right target.",
  'Strategic Planner': "You know where you are headed and why it matters. What has not caught up is strengths deployment and lived confidence that turn a clear plan into visible motion. The thinking work is largely done; what remains is permission and follow-through, not another round of refinement.",
  'Kinetic Operator': "Your strengths are active and your confidence reads as real in how you operate. What is still forming is the settled sense of what matters most and where this momentum is headed. Keep moving, but periodically look up from the doing and confirm the direction is still the one you would choose.",
  'Momentum Builder': "You are clear on what matters and where you are headed, and actively building toward it. The real risk is not stalling but coasting — assuming the clarity and momentum you have built will sustain themselves without deliberate maintenance.",
};

const frictionNarratives = {
  'Self-Discounter': "The friction traces back to values that have not been fully claimed as yours. The drag is not a discipline problem; it is the permission to name what you actually want, separate from what is expected of you.",
  'Vision Staller': "You have a reasonable sense of what matters, but translating it into a specific direction has stalled. The values have not yet been converted into a concrete destination you can move toward.",
  'Imposter Protector': "There is hesitation around fully owning and deploying what you are genuinely good at. The drag is not a skills gap; it is a permission gap that keeps real capability underused.",
  'The Magnifier': "You likely know what you are capable of, but overanalyzing, over-preparing, or second-guessing slows down how confidently you act on it. Scrutiny is running louder than the confidence you have earned.",
};

const AssessmentCompletePage = () => {
  const location = useLocation();
  const data = location.state;

  const rawDimScores = data?.dimScores || [0, 0, 0, 0, 0];
  const categoryScores = rawDimScores;
  const rawScore = Number(data?.rawScore ?? getRawTotal(data?.answers)) || 0;
  const totalScore = categoryScores.reduce((a, b) => a + b, 0);
  const band = getScoringBandByKey(data?.archetype) || getScoringBand(data?.score);
  const position = getPosition(categoryScores);
  const frictionVector = getFrictionVector(categoryScores, position);
  const growthEdge = getGrowthEdge(categoryScores);
  const avgScore = totalScore / 5;
  const avgPct = Math.round((avgScore / MAX_CATEGORY_SCORE) * 100);
  const maxIdx = categoryScores.indexOf(Math.max(...categoryScores));
  const growthEdgeIndex = growthEdge?.index ?? 0;
  const strongestTier = narrativeTier(categoryScores[maxIdx]);
  const growthTier = narrativeTier(categoryScores[growthEdgeIndex]);

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
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [resending, setResending] = useState(false);

  // Pre-build the email HTML once for the preview iframe
  const emailPreviewHTML = useMemo(() => (data ? buildEmailHTML(data) : ''), [data]);

  const triggerOutboundDelivery = async () => {
    if (!data) return;

    setEmailStatus('sending');
    setEmailError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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
      const timeoutId = setTimeout(() => controller.abort(), 30000);

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

  return (
    <div className="animate-fade-slide">
      {/* Dynamic Uniform Score Hero Section */}
      <div className="hero">
        <div className="hero-label">YOUR PHOENIX CLARITY RESULTS</div>
        <div className="score-hero-row">
          <div className="score-hero-big">{animatedScore}</div>
          <div className="score-hero-denom">/ 100</div>
        </div>
        <div className="score-hero-intro">Adjusted response total: {rawScore} / 125</div>
        <div className="r2-archetype-badge pulse-gold">{band?.label || 'Clarity Assessment'}</div>
        <p className="score-hero-intro">{band?.intro || 'Your results are ready for review.'}</p>
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

        <div className="r2-section">
          <div className="r2-section-header">
            <div className="r2-section-title">YOUR FIVE DIMENSIONS</div>
            <div className="r2-section-sub">Each dimension is normalized to 20 points — the gold line shows your average across all five.</div>
          </div>
        <div className="r2-dimensions">
          {categoryScores.map((catScore, index) => {
            const pct = Math.round((catScore / MAX_CATEGORY_SCORE) * 100);
            const statusLabel = narrativeTier(catScore);
            const statusClass = `tier-${statusLabel.toLowerCase()}`;
            const narrativeIndex = ['Emerging', 'Developing', 'Strong', 'Exceptional'].indexOf(statusLabel);
            return (
              <div className="r2-dim-row" key={dimLabels[index]}>
                <div className="r2-dim-label-wrap">
                  <span className="r2-dim-name">{dimLabels[index]}</span>
                </div>
                <div className="r2-dim-bar-wrap">
                  <div className="r2-dim-track">
                    <div className="r2-dim-fill" style={{ width: animateBars ? `${pct}%` : '0%', transition: `width 1.2s cubic-bezier(0.25, 0.8, 0.25, 1) ${index * 120}ms` }}></div>
                    <div className="r2-avg-line" style={{ left: `${avgPct}%` }}></div>
                  </div>
                  <span className={`r2-dim-status ${statusClass}`}>{statusLabel}</span>
                  <p className="r2-dim-narrative">{dimensionNarratives[index][narrativeIndex]}</p>
                </div>
                <div className="r2-dim-score-num">{Number.isInteger(catScore) ? catScore : catScore.toFixed(1)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="r2-split-section">
        <div className="r2-split-header">YOUR STRENGTHS &amp; GROWTH EDGE</div>
        <div className="r2-split-grid">
          <div className="r2-split-card r2-strength-card hover-lift">
            <div className="r2-split-card-label">YOUR STRONGEST DIMENSION · {strongestTier}</div>
            <div className="r2-split-card-name">{dimFullNames[maxIdx]}</div>
            <div className="r2-split-card-body">{dimensionNarratives[maxIdx][['Emerging', 'Developing', 'Strong', 'Exceptional'].indexOf(strongestTier)]}</div>
          </div>
          <div className="r2-split-card r2-growth-card hover-lift">
            <div className="r2-split-card-label">YOUR PRIMARY GROWTH EDGE · {growthTier}</div>
            <div className="r2-split-card-name">{dimFullNames[growthEdgeIndex]}</div>
            <div className="r2-split-card-body">{dimensionNarratives[growthEdgeIndex][['Emerging', 'Developing', 'Strong', 'Exceptional'].indexOf(growthTier)]}</div>
          </div>
        </div>
      </div>

      {position && (
        <div className="r2-section">
          <div className="r2-section-header">
            <div className="r2-section-title">YOUR POSITION</div>
            <div className="r2-section-sub">Inner Clarity: Values & What Matters + Direction & Opportunity · Outer Action: Strengths & Skills + Alignment & Confidence</div>
          </div>
          <div className="r2-position-card">
            <div className="r2-position-quadrant">{position.quadrant}</div>
            <div className="r2-position-detail">
              <span>Inner Clarity: {position.innerAxis.toFixed(1)} / 40</span>
              <span>Outer Action: {position.outerAxis.toFixed(1)} / 40</span>
            </div>
            <p className="r2-signal-narrative">{positionNarratives[position.quadrant]}</p>
          </div>
        </div>
      )}

      {frictionVector && (
        <div className="r2-section">
          <div className="r2-section-header">
            <div className="r2-section-title">YOUR FRICTION VECTOR</div>
            <div className="r2-section-sub">Your lower axis and the dimension within it that needs the most support</div>
          </div>
          <div className="r2-friction-card">
            <div className="r2-friction-archetype">{frictionVector.archetype}</div>
            <div className="r2-friction-detail">
              <span>Lagging axis: {frictionVector.lowerAxis === 'inner' ? 'Inner Clarity' : 'Outer Action'}</span>
              <span>Focus dimension: {frictionVector.weakerDimension}</span>
            </div>
            <p className="r2-signal-narrative">{frictionNarratives[frictionVector.archetype]}</p>
          </div>
        </div>
      )}

      {growthEdge && (
        <div className="r2-section">
          <div className="r2-section-header">
            <div className="r2-section-title">YOUR GROWTH EDGE</div>
            <div className="r2-section-sub">Lowest-scoring category — where the next chapter begins</div>
          </div>
          <div className="r2-growth-edge-card">
            <div className="r2-growth-edge-name">{dimFullNames[growthEdge.index]}</div>
            <div className="r2-growth-edge-score">{growthEdge.score} / 20 · {growthTier}</div>
            <p className="r2-signal-narrative">{dimensionNarratives[growthEdge.index][['Emerging', 'Developing', 'Strong', 'Exceptional'].indexOf(growthTier)]}</p>
          </div>
        </div>
      )}

      <div className="r2-direct-read">
        <div className="r2-dr-label">WHAT YOUR SCORES ARE ACTUALLY TELLING ME</div>
        <div className="r2-dr-sublabel">VETA'S DIRECT READ — BASED ON YOUR RESULTS</div>
        <div className="r2-dr-intro">Your scores reveal something most people in your position never get told.</div>
        <div className="r2-dr-body">{band?.directRead || 'Your results are ready for review with your coach.'}</div>
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
