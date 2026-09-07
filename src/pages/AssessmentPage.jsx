import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { createAssessment, createReadiness, createExecutionForm, createTestimonial } from '../api/dbClient';
import {
  clarityDimensions,
  clarityQuestions,
  readinessQuestions,
  executionQuestions,
} from './assessmentQuestions';
import { getCategoryScores, getClarityScore, getRawTotal, getScoringBand } from './scoringBands';
import { getExecutionResults, getReadinessResults } from './toolScoring';
import { getAssessmentPath, getAssessmentTab } from './assessmentRoutes';
import { hasConsented, CLARITY_CONSENT_VERSION } from '../lib/consent';
import { useAuth } from '../hooks/useAuth';
import './AssessmentPage.css';

const AssessmentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const activeTab = getAssessmentTab(location);

  // Only the public Clarity assessment uses the digital consent screen.
  if (activeTab === 'clarity' && !hasConsented()) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/consent?next=${next}`} replace />;
  }

  const currentAssessmentType = activeTab === 'execution' ? 'execution' : 'readiness';

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/assessment');
  };

  const handleTabChange = (tab) => {
    navigate(getAssessmentPath(tab), { replace: true });
  };


  const getLockContent = (type) => {
    if (type === 'execution') {
      return {
        icon: '📈',
        title: 'Locked Review',
        subtitle: 'Week 3+ · Coach Only',
        description: 'This form tracks client action consistency, homework completion, and milestone alignment. Reserved for active program coaches.',
        btnLabel: 'Sign in as Coach',
      };
    }
    return {
      icon: '🔑',
      title: 'Locked Access',
      subtitle: 'Pre-Intake · Coach Only',
      description: 'This form evaluates a prospective client\'s emotional readiness and bandwidth before enrolling them into the program.',
      btnLabel: 'Sign in as Coach',
    };
  };

  if (activeTab === 'readiness' || activeTab === 'execution') {
    if (isAuthLoading) {
      return <div className="container"><div className="card"><p>Checking coach access…</p></div></div>;
    }

    const isCoach = isAuthenticated && user?.app_metadata?.role === 'admin';
    if (isCoach) {
      return (
        <div className="animate-fade-slide">
          <GenericAssessment
            title={activeTab === 'readiness' ? 'Client Readiness' : 'Client Execution'}
            type={activeTab}
            questions={activeTab === 'readiness' ? readinessQuestions : executionQuestions}
          />
        </div>
      );
    }

    const lock = getLockContent(currentAssessmentType);
    return (
      <div className="coach-lock-overlay">
        <div className="coach-lock-card hover-glow">
          <button
            type="button"
            className="coach-lock-close"
            onClick={handleBack}
            aria-label="Cancel and go back"
          >
            ×
          </button>
          <div className="coach-lock-icon">{lock.icon}</div>
          <div className="coach-lock-subtitle">{lock.subtitle}</div>
          <h3>{lock.title}</h3>
          <p>{lock.description}</p>
          <div className="coach-lock-actions">
            <button type="button" className="coach-lock-cancel-btn" onClick={handleBack}>
              Cancel
            </button>
            <button type="button" onClick={() => navigate('/login', { state: { from: location } })} className="btn btn-primary scale-on-hover" style={{ width: '100%' }}>{lock.btnLabel}</button>
          </div>
          <div className="coach-lock-footer">
            <p>Don't have an account?</p>
            <div className="coach-lock-footer-links">
              <Link to="/assessment">Take a free assessment</Link>
              <span>or</span>
              <Link to="/login">Request Access</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }


  const getHeroContent = () => {
    switch (activeTab) {
      case 'clarity':
        return {
          label: "See It · Phase 1 of 3",
          title: <>Clarity <em>Assessment</em></>,
          desc: "Our 25-question assessment measures your score across 5 key dimensions of clarity and readiness."
        };
      case 'testimonial':
        return {
          label: "Client Stories",
          title: <>Share Your <em>Story</em></>,
          desc: "We want to hear about your transition, shift, and breakthroughs."
        };
      case 'readiness':
        return {
          label: "Coach Evaluation",
          title: <>Client <em>Readiness</em></>,
          desc: "Evaluate the client's capacity, emotional baseline, and commitment to the coaching journey."
        };
      case 'execution':
        return {
          label: "Coach Evaluation",
          title: <>Client <em>Execution</em></>,
          desc: "Assess the client's progress, homework completion, and action alignment."
        };
      default:
        return {
          label: "Assessment Portal",
          title: <>Phoenix <em>Assessment</em></>,
          desc: "Discover where you stand and map your next transition."
        };
    }
  };

  const heroContent = getHeroContent();

  return (
    <div className="animate-fade-slide">
      <div className="tab-nav">
        <button 
          className={`tab-btn ${activeTab === 'clarity' ? 'active' : ''}`} 
          onClick={() => handleTabChange('clarity')}
        >
          Clarity assessment <span className="tab-badge">Free</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'testimonial' ? 'active' : ''}`} 
          onClick={() => handleTabChange('testimonial')}
        >
          Testimonials
        </button>
        <button 
          className={`tab-btn ${activeTab === 'readiness' ? 'active' : ''}`} 
          onClick={() => handleTabChange('readiness')}
        >
          Readiness assessment <span className="tab-badge">Coach</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'execution' ? 'active' : ''}`} 
          onClick={() => handleTabChange('execution')}
        >
          Execution assessment <span className="tab-badge">Week 3</span>
        </button>
      </div>

      <div className="hero">
        <div className="hero-label">{heroContent.label}</div>
        <h1>{heroContent.title}</h1>
        <p>{heroContent.desc}</p>
      </div>

      <div className="container">
        {/* Keep tab components mounted so forms aren't removed when switching tabs */}
        <div style={{ display: activeTab === 'clarity' ? 'block' : 'none' }}>
          <ClarityAssessment navigate={navigate} />
        </div>
        <div style={{ display: activeTab === 'testimonial' ? 'block' : 'none' }}>
          <TestimonialForm navigate={navigate} />
        </div>
        <div style={{ display: activeTab === 'readiness' ? 'block' : 'none' }}>
          <GenericAssessment title="Client Readiness" type="readiness" questions={readinessQuestions} />
        </div>
        <div style={{ display: activeTab === 'execution' ? 'block' : 'none' }}>
          <GenericAssessment title="Client Execution" type="execution" questions={executionQuestions} />
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Sub-components
// ----------------------------------------------------

const ClarityAssessment = ({ navigate }) => {
  const [step, setStep] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', company: '', segment: '', gender: '', source: '', context: '' });
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [consentTimestamp, setConsentTimestamp] = useState(null);
  const [answers, setAnswers] = useState(Array(clarityQuestions.length).fill(null));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleIntakeSubmit = (e) => {
    e.preventDefault();
    if (formData.firstName && formData.lastName && formData.email && consentAgreed) setStep(2);
  };

  const calculateScore = () => getClarityScore(answers);

  const calculateDimensionScores = () => getCategoryScores(answers);

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (answers.includes(null)) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const score = calculateScore();
    const rawScore = getRawTotal(answers);
    const dimScores = calculateDimensionScores();
    const band = getScoringBand(score);
    const assessmentData = {
      ...formData,
      date: new Date().toISOString(),
      answers,
      score,
      rawScore,
      dimScores,
      archetype: band?.key || null,
      archetypeName: band?.label || null,
      consentTimestamp,
      consentVersion: CLARITY_CONSENT_VERSION,
    };

    try {
      const savedAssessment = await createAssessment(assessmentData, { signal: controller.signal });
      clearTimeout(timeoutId);
      navigate('/assessment-complete', {
        state: {
          ...assessmentData,
          id: savedAssessment?.id,
          assessmentId: savedAssessment?.id,
          savedAssessment,
        },
      });
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Failed to persist clarity assessment to Supabase:", err);
      setSubmitError(err.message || 'Your assessment could not be saved to Supabase. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (isSubmitting) {
      return;
    }

    if (!answers[currentQuestion]) {
      alert('Please select a response before continuing.');
      return;
    }
    if (currentQuestion < clarityQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      return;
    }
    handleSubmit();
  };

  const activeQuestion = clarityQuestions[currentQuestion];
  const progress = Math.round(((currentQuestion + 1) / clarityQuestions.length) * 100);
  const labels = ['', 'Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

  return (
    <>
      <div className="hero assessment-hero">
        <div className="hero-label">See It · Phase 1 of 3</div>
        <h1>The Phoenix<br /><em>Clarity Assessment</em></h1>
        <p>25 questions. 7 minutes. A clear picture of where you are—and what your next chapter actually requires.</p>
        <div className="hero-meta">
          <span><span className="dot"></span>25 Questions. </span>
          <span><span className="dot"></span> 5 Dimensions. </span>
          <span><span className="dot"></span> Free · No obligation</span>
        </div>
      </div>

      {step === 1 && (
        <div className="card intake-card animate-intake-card">
          <h3>Before we begin</h3>
          <p>A few quick details, then a short consent notice — required before Question 1.</p>

          <form onSubmit={handleIntakeSubmit} className="unified-form">
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  required
                  type="text"
                  placeholder="Your first name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Last Name *</label>
                <input
                  required
                  type="text"
                  placeholder="Your last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                required
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Company / Agency Affiliation <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="text"
                  placeholder="Organization name"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Segment <span className="tab-badge" style={{ marginLeft: 6, fontSize: '0.65rem' }}>New</span></label>
                <select value={formData.segment} onChange={(e) => setFormData({ ...formData, segment: e.target.value })}>
                  <option value="">Select segment...</option>
                  <option value="Individual">Individual</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Federal">Federal</option>
                </select>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '-4px' }}>Added alongside Affiliation, per the Dashboard Build Spec.</span>
              </div>
            </div>

            <div className="form-group">
              <label>How do you identify? <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
              <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                <option value="">Prefer not to say</option>
                <option>She/Her</option>
                <option>He/Him</option>
                <option>They/Them</option>
                <option>Other / Self-describe</option>
              </select>
            </div>

            <div className="form-group">
              <label>How did you hear about us? <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
              <input
                type="text"
                placeholder="LinkedIn, referral, search..."
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>What brings you here today? <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
              <textarea
                rows="3"
                placeholder="Anything you'd like to share before starting."
                value={formData.context}
                onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              />
            </div>

            {/* ── Participation & Data Use Notice ── */}
            <div className="consent-notice-block">
              <div className="consent-notice-heading">Participation &amp; Data Use Notice</div>
              <div className="consent-notice-body">
                <p>
                  <strong>What we collect:</strong> your name, your email address, your organization or agency affiliation (if applicable), your Segment (Individual, Corporate, or Federal), how you identify (if you choose to share it), how you heard about Phoenix Clear Insight, your responses to the 25 assessment questions, anything you choose to share in the optional "what brings you here today" field, and any follow-up survey responses you choose to provide.
                </p>
                <p>
                  <strong>How it's used:</strong> Your responses generate your Clarity Score, Band, Position, Friction Vector, and Growth Edge — sent to you by email and used, with your permission, to inform coaching conversations should you choose to work with us.
                </p>
                <p>
                  <strong>Where it's stored:</strong> Stored securely, accessible only to Phoenix Clear Insight Consulting LLC.
                </p>
              </div>
              <label className="consent-inline-checkbox" htmlFor="consent-intake">
                <input
                  id="consent-intake"
                  type="checkbox"
                  checked={consentAgreed}
                  onChange={(event) => {
                    setConsentAgreed(event.target.checked);
                    setConsentTimestamp(event.target.checked ? new Date().toISOString() : null);
                  }}
                />
                <span className="consent-inline-checkmark" />
                <span>I have read and agree to the Participation &amp; Data Use Notice above.</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 16, opacity: consentAgreed ? 1 : 0.45, pointerEvents: consentAgreed ? 'auto' : 'none' }}
              disabled={!consentAgreed}
            >
              Begin My Clarity Assessment →
            </button>
          </form>
        </div>
      )}



      {step === 2 && (
        <div className="assessment-questions">
          <div className="progress-wrap">
            <div className="progress-top">
              <span className="progress-label">Your Progress</span>
              <span className="progress-count">Question {currentQuestion + 1} of 25</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="dimension-label">{clarityDimensions[activeQuestion.dim]}</div>
          </div>

          <div key={currentQuestion} className="card question-card animate-question-card">
            <div className="q-number">Question {currentQuestion + 1}</div>
            <div className="q-text">{activeQuestion.text}</div>
            <div className="scale-options">
              {[1, 2, 3, 4, 5].map(num => (
                <button key={num} className={`scale-btn ${answers[currentQuestion] === num ? 'selected' : ''}`} onClick={() => {
                  const newAnswers = [...answers];
                  newAnswers[currentQuestion] = num;
                  setAnswers(newAnswers);
                }}>
                  <span className="scale-num">{num}</span>
                  <span className="scale-label">{labels[num]}</span>
                </button>
              ))}
            </div>
              <div className="scale-ends">
                <span>1 = Strongly Disagree</span>
                <span>5 = Strongly Agree</span>
              </div>
          </div>
          <div className="nav-row">
            <button className="btn btn-secondary" disabled={currentQuestion === 0} onClick={() => setCurrentQuestion(currentQuestion - 1)}>← Back</button>
            <button className="btn btn-primary" onClick={handleNext} disabled={isSubmitting}>
              {isSubmitting ? 'Saving Results...' : currentQuestion === clarityQuestions.length - 1 ? 'View My Results →' : 'Next →'}
            </button>
          </div>
          {submitError && (
            <div className="assessment-submit-error" role="alert">
              {submitError}
            </div>
          )}
        </div>
      )}
    </>
  );
};

const GenericAssessment = ({ title, type, questions }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    segment: '',
    sessionType: 'clarity-intensive',
    sessionDate: '',
    programCheckpoint: '',
  });
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const fieldPrefix = `${type}-client`;
  const isReadiness = type === 'readiness';
  const scaleLabels = isReadiness
    ? ['', 'Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely']
    : ['', 'Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

  const calculateResults = () => isReadiness ? getReadinessResults(answers) : getExecutionResults(answers);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (answers.includes(null)) {
      alert("Please answer all questions before submitting.");
      return;
    }
    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert("Please complete client details.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      alert("Please enter a valid client email.");
      return;
    }
    if (!consentAgreed) {
      alert('Please confirm the Participation & Data Use Notice.');
      return;
    }
    if (!isReadiness && !formData.programCheckpoint) {
      alert('Please select the required program checkpoint.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    const results = calculateResults();
    const data = {
      ...formData,
      date: new Date().toISOString(),
      answers,
      score: results.score,
      categoryScores: results.categoryScores,
      band: results.band?.label || null,
      gap: results.gap?.archetype || null,
    };

    try {
      if (type === 'readiness') {
        await createReadiness(data);
      }
      if (type === 'execution') {
        await createExecutionForm(data);
      }

      setSubmitSuccess(`${title} was saved successfully.`);
      setAnswers(Array(questions.length).fill(null));
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        segment: '',
        sessionType: 'clarity-intensive',
        sessionDate: '',
        programCheckpoint: '',
      });
    } catch (err) {
      console.error(`Failed to persist ${type} assessment to Supabase:`, err);
      setSubmitError(err.message || `Failed to save ${type} assessment. Your responses are still on this page.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <div className="card intake-card">
          <h3>{title}</h3>

          <div className="unified-form unified-client-details">
            <div className="form-row" style={{ marginTop: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor={`${fieldPrefix}-first-name`}>Client First Name *</label>
                <input
                  id={`${fieldPrefix}-first-name`}
                  type="text"
                  placeholder="Client First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor={`${fieldPrefix}-last-name`}>Client Last Name *</label>
                <input
                  id={`${fieldPrefix}-last-name`}
                  type="text"
                  placeholder="Client Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label htmlFor={`${fieldPrefix}-email`}>Client Email *</label>
              <input
                id={`${fieldPrefix}-email`}
                type="email"
                placeholder="client@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-row" style={{ marginTop: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor={`${fieldPrefix}-company`}>Company / Agency Affiliation <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  id={`${fieldPrefix}-company`}
                  type="text"
                  placeholder="Organization name"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor={`${fieldPrefix}-segment`}>Segment <span className="tab-badge" style={{ marginLeft: 6, fontSize: '0.65rem' }}>New</span></label>
                <select 
                  id={`${fieldPrefix}-segment`}
                  value={formData.segment} 
                  onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                >
                  <option value="">Select segment...</option>
                  <option value="Individual">Individual</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Federal">Federal</option>
                </select>
              </div>
            </div>

            {isReadiness && (
              <>
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label htmlFor={`${fieldPrefix}-session-type`}>Session Type</label>
                  <select
                    id={`${fieldPrefix}-session-type`}
                    value={formData.sessionType}
                    onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
                  >
                    <option value="clarity-intensive">Clarity Intensive ($497) - screening use</option>
                    <option value="week1">Week 1 of Program - deepening use</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginTop: 12 }}>
                  <label htmlFor={`${fieldPrefix}-session-date`}>Session Date</label>
                  <input
                    id={`${fieldPrefix}-session-date`}
                    type="date"
                    value={formData.sessionDate}
                    onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                  />
                </div>
              </>
            )}

            {!isReadiness && (
              <div className="form-group" style={{ marginTop: 12 }}>
                <label htmlFor={`${fieldPrefix}-checkpoint`}>Program Checkpoint *</label>
                <select
                  id={`${fieldPrefix}-checkpoint`}
                  value={formData.programCheckpoint}
                  onChange={(e) => setFormData({ ...formData, programCheckpoint: e.target.value })}
                  required
                >
                  <option value="">Select checkpoint...</option>
                  <option value="Week 3">Week 3</option>
                  <option value="Week 6">Week 6</option>
                  <option value="Week 9">Week 9</option>
                  <option value="Week 12">Week 12</option>
                  <option value="Program Completion">Program Completion</option>
                </select>
              </div>
            )}

            {/* ── Participation & Data Use Notice ── */}
            <div className="consent-notice-block">
              <div className="consent-notice-heading">Participation &amp; Data Use Notice</div>
              <div className="consent-notice-body">
                <p>
                  <strong>What we collect:</strong> your name, your email address, your organization or agency affiliation (if applicable), your Segment (Individual, Corporate, or Federal), how you identify (if you choose to share it), how you heard about Phoenix Clear Insight, your responses to the assessment questions, anything you choose to share, and any follow-up survey responses you choose to provide.
                </p>
                <p>
                  <strong>How it's used:</strong> Your responses generate your scores and profile — sent to you by email and used, with your permission, to inform coaching conversations should you choose to work with us.
                </p>
                <p>
                  <strong>Where it's stored:</strong> Stored securely, accessible only to Phoenix Clear Insight Consulting LLC.
                </p>
              </div>
              <label className="consent-inline-checkbox" htmlFor={`${fieldPrefix}-consent`}>
                <input
                  id={`${fieldPrefix}-consent`}
                  type="checkbox"
                  checked={consentAgreed}
                  onChange={() => setConsentAgreed(!consentAgreed)}
                />
                <span className="consent-inline-checkmark" />
                <span>I have read and agree to the Participation &amp; Data Use Notice above.</span>
              </label>
            </div>
          </div>
        </div>

        <div className="assessment-questions">
          {questions.map((q, i) => (
            <div key={i} className="card question-card">
              <div className="q-number">Question {i + 1}</div>
              <div className="q-text">{q}</div>
              <div className="scale-options">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`scale-btn ${answers[i] === num ? 'selected' : ''}`}
                    onClick={() => {
                      const newAnswers = [...answers];
                      newAnswers[i] = num;
                      setAnswers(newAnswers);
                    }}
                    aria-label={`Select ${num} for Question ${i + 1}`}
                  >
                    <span className="scale-num">{num}</span>
                    <span className="scale-label">{scaleLabels[num]}</span>
                  </button>
                ))}
              </div>

              <div className="scale-ends">
                <span>1 = {scaleLabels[1]}</span>
                <span>5 = {scaleLabels[5]}</span>
              </div>
            </div>
          ))}

          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving…' : `Submit ${title}`}
          </button>
          {submitError && <div className="assessment-submit-error" role="alert">{submitError}</div>}
          {submitSuccess && <div className="assessment-submit-success" role="status">{submitSuccess}</div>}
        </div>
      </form>
    </>
  );
};

const TestimonialForm = ({ navigate }) => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', role: '', segment: '', band: '',
    before: '', shift: '', after: '', anonymous: 'No', showBand: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError('');
    const testimonialData = { ...formData, status: 'Pending Review', date: new Date().toISOString() };
    try {
      await createTestimonial(testimonialData);
      alert('Thank you for sharing your story! It is now pending review.');
      navigate('/client-stories');
    } catch (err) {
      console.error("Failed to persist testimonial to Supabase:", err);
      setSubmitError(err.message || 'Your story could not be saved. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card intake-card">
      <h3>Share Your Story</h3>
      <p style={{ marginBottom: '20px', color: 'var(--muted)' }}>We want to hear about your transformation.</p>
      <form onSubmit={handleSubmit}>
        <div className="unified-form unified-testimonial-details">
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label>Email (For follow-up and private Clarity Band matching, never displayed)</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <small style={{ color: 'var(--muted)', display: 'block', marginTop: 6 }}>
              We use your email privately to match your prior Clarity Assessment results. It is never shown with your story.
            </small>
          </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Role / Profession (Optional)</label>
                  <input type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Clarity Band <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(only if we cannot verify it)</span></label>
                  <select value={formData.band} onChange={e => setFormData({...formData, band: e.target.value})}>
                    <option value="">Select Band...</option>
                    <option value="Transitioner">Transitioner</option>
                    <option value="Strategist">Strategist</option>
                    <option value="Executor">Executor</option>
                    <option value="Phoenix">Phoenix</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Segment</label>
                <select value={formData.segment} onChange={e => setFormData({...formData, segment: e.target.value})}>
                  <option value="">Select segment...</option>
                  <option value="Individual">Individual</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Federal">Federal</option>
                </select>
              </div>

          <div className="form-group">
            <label>Before (Where were you when you started?)</label>
            <textarea required rows="3" value={formData.before} onChange={e => setFormData({...formData, before: e.target.value})}></textarea>
          </div>

          <label className="consent-inline-checkbox" style={{ marginTop: 8 }}>
            <input type="checkbox" checked={formData.showBand} onChange={e => setFormData({ ...formData, showBand: e.target.checked })} />
            <span className="consent-inline-checkmark" />
            <span>Show my Clarity Band with this story if it is published.</span>
          </label>

          <div className="form-group">
            <label>The Shift (What changed during the work?)</label>
            <textarea required rows="3" value={formData.shift} onChange={e => setFormData({...formData, shift: e.target.value})}></textarea>
          </div>

          <div className="form-group">
            <label>After (What are you doing now?)</label>
            <textarea required rows="3" value={formData.after} onChange={e => setFormData({...formData, after: e.target.value})}></textarea>
          </div>

          <div className="form-group">
            <label>Display as Anonymous?</label>
            <select value={formData.anonymous} onChange={e => setFormData({...formData, anonymous: e.target.value})}>
              <option value="No">No, use my name</option>
              <option value="Yes">Yes, keep it anonymous</option>
            </select>
          </div>
        </div>


        <button type="submit" className="btn btn-gold" style={{ width: '100%', marginTop: 16 }} disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Submit Story'}
        </button>
        {submitError && <div className="assessment-submit-error" role="alert">{submitError}</div>}
      </form>

    </div>
  );
};

export default AssessmentPage;
