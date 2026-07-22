import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createAssessment, createReadiness, createExecutionForm, createTestimonial } from '../api/dbClient';
import {
  clarityDimensions,
  clarityQuestions,
  readinessQuestions,
  executionQuestions,
} from './assessmentQuestions';
import { getScoringBand } from './scoringBands';
import './AssessmentPage.css';

const AssessmentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const share = searchParams.get('share');
  const assessmentType = searchParams.get('assessment') || 'readiness';

  const [activeTab, setActiveTab] = useState(() => {
    if (mode === 'coach') return assessmentType === 'execution' ? 'execution' : 'readiness';
    if (share === 'story') return 'testimonial';
    return 'clarity';
  });
  const [unlockedTypes, setUnlockedTypes] = useState({
    readiness: false,
    execution: false
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const currentAssessmentType = activeTab === 'execution' ? 'execution' : 'readiness';
  const isCurrentTabUnlocked = unlockedTypes[currentAssessmentType];
  const isUnlocked = unlockedTypes.readiness || unlockedTypes.execution;

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const expectedPassword = currentAssessmentType === 'execution' ? 'execution2027' : 'readiness2027';
    if (passwordInput === expectedPassword) {
      setUnlockedTypes(prev => ({ ...prev, [currentAssessmentType]: true }));
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPasswordInput('');
    }
  };

  const getLockContent = (type) => {
    if (type === 'execution') {
      return {
        icon: '📈',
        title: 'Locked Review',
        subtitle: 'Week 3+ · Coach Only',
        description: 'This form tracks client action consistency, homework completion, and milestone alignment. Reserved for active program coaches.',
        placeholder: 'Enter execution access code',
        btnLabel: 'Unlock Execution Review',
      };
    }
    return {
      icon: '🔑',
      title: 'Locked Access',
      subtitle: 'Pre-Intake · Coach Only',
      description: 'This form evaluates a prospective client\'s emotional readiness and bandwidth before enrolling them into the program.',
      placeholder: 'Enter readiness access code',
      btnLabel: 'Unlock Readiness Screening',
    };
  };

  if ((activeTab === 'readiness' || activeTab === 'execution') && !isCurrentTabUnlocked) {
    const lock = getLockContent(currentAssessmentType);
    return (
      <div className="coach-lock-overlay">
        <form onSubmit={handlePasswordSubmit} className="coach-lock-card hover-glow">
          <div className="coach-lock-icon">{lock.icon}</div>
          <div className="coach-lock-subtitle">{lock.subtitle}</div>
          <h3>{lock.title}</h3>
          <p>{lock.description}</p>

          <div className="form-group">
            <input 
              type="password" 
              placeholder={lock.placeholder}
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              required
            />
          </div>
          {passwordError && <div className="coach-lock-error">Incorrect code. Try again.</div>}
          <button type="submit" className="btn btn-primary scale-on-hover" style={{ width: '100%' }}>{lock.btnLabel}</button>
          <div className="coach-lock-footer">
            <p>Don't have an access code?</p>
            <div className="coach-lock-footer-links">
              <Link to="/assessment">Take a free assessment</Link>
              <span>or</span>
              <Link to="/login">GET ACCESS</Link>
            </div>
          </div>
        </form>
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
          onClick={() => setActiveTab('clarity')}
        >
          Clarity assessment <span className="tab-badge">Free</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'testimonial' ? 'active' : ''}`} 
          onClick={() => setActiveTab('testimonial')}
        >
          Testimonials
        </button>
        <button 
          className={`tab-btn ${activeTab === 'readiness' ? 'active' : ''}`} 
          onClick={() => setActiveTab('readiness')}
        >
          Readiness assessment <span className="tab-badge">Coach</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'execution' ? 'active' : ''}`} 
          onClick={() => setActiveTab('execution')}
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
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', gender: '', source: '', context: '' });
  const [answers, setAnswers] = useState(Array(clarityQuestions.length).fill(null));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleIntakeSubmit = (e) => {
    e.preventDefault();
    if (formData.firstName && formData.lastName && formData.email) setStep(2);
  };

  const calculateScore = () => {
    // Raw sum of all 25 questions (each scored 1-5) — score/125, no percentage conversion.
    return answers.reduce((acc, val) => acc + (val || 0), 0);
  };

  const calculateDimensionScores = () => {
    const dimScores = [0, 0, 0, 0, 0];
    clarityQuestions.forEach((question, index) => {
      dimScores[question.dim] += answers[index] || 0;
    });
    return dimScores;
  };

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

    const score = calculateScore();
    const dimScores = calculateDimensionScores();
    const band = getScoringBand(score);
    const assessmentData = {
      ...formData,
      date: new Date().toISOString(),
      answers,
      score,
      dimScores,
      archetype: band?.key || null,
      archetypeName: band?.label || null,
    };

    try {
      const savedAssessment = await createAssessment(assessmentData);
      navigate('/assessment-complete', {
        state: {
          ...assessmentData,
          id: savedAssessment?.id,
          assessmentId: savedAssessment?.id,
          savedAssessment,
        },
      });
    } catch (err) {
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
  const labels = ['', 'Rarely', 'Occasionally', 'Sometimes', 'Frequently', 'Consistently'];

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
          <h3>Before We Begin</h3>
          <p>Tell us a little about yourself. This helps us personalize your results and ensures your clarity score is saved securely.</p>

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
              <label>Email Address *</label>
              <input
                required
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>How do you identify? (optional)</label>
              <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                <option value="">Prefer not to say</option>
                <option>She/Her</option>
                <option>He/Him</option>
                <option>They/Them</option>
                <option>Other / Self-describe</option>
              </select>
            </div>

            <div className="form-group">
              <label>How did you hear about Phoenix?</label>
              <select value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })}>
                <option value="">Select one...</option>
                <option>EPIC Live Stream</option>
                <option>Referral from friend or colleague</option>
                <option>Social media (TikTok, Instagram, LinkedIn)</option>
                <option>Website search</option>
                <option>Discovery call</option>
                <option>Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>What brings you here today? (optional)</label>
              <textarea
                rows="3"
                placeholder="A few words about what's bringing you to this moment..."
                value={formData.context}
                onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>
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
              <span>1 = Rarely</span>
              <span>5 = Consistently</span>
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
    sessionType: 'clarity-intensive',
    sessionDate: '',
  });
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const fieldPrefix = `${type}-client`;
  const isReadiness = type === 'readiness';

  const calculateScore = () => {
    const total = answers.reduce((acc, val) => acc + (val || 0), 0);
    return Math.round((total / (questions.length * 5)) * 100);
  };

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

    const score = calculateScore();
    const data = {
      ...formData,
      date: new Date().toISOString(),
      answers,
      score,
    };

    if (type === 'readiness') {
      try {
        await createReadiness(data);
      } catch (err) {
        console.error("Failed to persist readiness assessment to Supabase:", err);
      }
    }
    if (type === 'execution') {
      try {
        await createExecutionForm(data);
      } catch (err) {
        console.error("Failed to persist execution assessment to Supabase:", err);
      }
    }

    alert('Assessment Submitted');
    setAnswers(Array(questions.length).fill(null));
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      sessionType: 'clarity-intensive',
      sessionDate: '',
    });
  };  return (
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
                  </button>
                ))}
              </div>

              <div className="scale-ends">
                <span>1</span>
                <span>5</span>
              </div>
            </div>
          ))}

          <button className="btn btn-primary" style={{ width: '100%' }} type="submit">
            Submit {title}
          </button>
        </div>
      </form>
    </>
  );
};

const TestimonialForm = ({ navigate }) => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', role: '', stage: '',
    before: '', shift: '', after: '', anonymous: 'No'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const testimonialData = { ...formData, status: 'Pending Review', date: new Date().toISOString() };
    try {
      await createTestimonial(testimonialData);
    } catch (err) {
      console.error("Failed to persist testimonial to Supabase:", err);
    }
    alert('Thank you for sharing your story! It is now pending review.');
    navigate('/client-stories');
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
            <label>Email (For follow-up, won't be displayed)</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Role / Profession (Optional)</label>
              <input type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Stage</label>
              <select value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
                <option value="">Select Stage...</option>
                <option value="Awakening">Awakening</option>
                <option value="Dreaming">Dreaming</option>
                <option value="Phoenix Momentum">Phoenix Momentum</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Before (Where were you when you started?)</label>
            <textarea required rows="3" value={formData.before} onChange={e => setFormData({...formData, before: e.target.value})}></textarea>
          </div>

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


        <button type="submit" className="btn btn-gold" style={{ width: '100%', marginTop: 16 }}>Submit Story</button>
      </form>

    </div>
  );
};

export default AssessmentPage;