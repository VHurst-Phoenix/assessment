import { useState, useMemo } from 'react'
import { createAssessment } from '../api/dbClient'

const dimensions = [
  'Strengths & Skills',
  'Resilience & Balance',
  'Clarity of Direction',
  'Ownership & Momentum',
  'Future Readiness'
]

const questionPrompts = [
  'I can clearly name the goal I want to move toward.',
  'I know the one thing I need most right now.',
  'I am aware of the strengths I can use to move forward.',
  'I feel grounded in what matters most this season.',
  'I have a sense of the first step I should take.',
  'I can manage stress without losing my momentum.',
  'I feel balanced between what I need and what I do.',
  'I recover quickly when a plan shifts unexpectedly.',
  'I give myself permission to rest without guilt.',
  'I can articulate what is draining my energy.',
  'I am confident in the direction I am headed.',
  'I know what success looks like for my next chapter.',
  'I can distinguish what to keep and what to release.',
  'I have a clear sense of the story I want to create.',
  'I feel ready to make a meaningful choice today.',
  'I hold myself accountable for making progress.',
  'I take ownership of the results I want to see.',
  'I follow through on what I say matters.',
  'I make decisions based on what truly aligns with me.',
  'I adapt without losing sight of the outcome.',
  'I am prepared for the next opportunity in front of me.',
  'I can name the habits that support my future success.',
  'I feel connected to the next version of myself.',
  'I can invite the right people into my next step.',
  'I trust that I can create the future I want.'
]

export default function Assessment() {
  const [step, setStep] = useState(0)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [source, setSource] = useState('')
  const [identity, setIdentity] = useState('')
  const [context, setContext] = useState('')
  const [answers, setAnswers] = useState(Array(questionPrompts.length).fill(''))
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const totalQuestions = questionPrompts.length
  const progressPercent = useMemo(
    () => Math.round((Math.max(0, step - 1) / totalQuestions) * 100),
    [step, totalQuestions]
  )
  const activeDimension = useMemo(
    () => (step > 0 && step <= totalQuestions ? dimensions[Math.floor((step - 1) / 5)] : ''),
    [step, totalQuestions]
  )

  function handleRating(value) {
    const updated = [...answers]
    updated[step - 1] = value
    setAnswers(updated)
    setError('')
  }

  function handleNext() {
    if (step === 0) {
      if (!firstName || !lastName || !email) {
        setError('Please complete your name and email before starting the assessment.')
        return
      }
      setError('')
      setStep(1)
      return
    }

    if (step <= totalQuestions) {
      if (!answers[step - 1]) {
        setError('Select a response to continue.')
        return
      }
      setError('')
      setStep((prev) => prev + 1)
    }
  }

  function handleBack() {
    setError('')
    setStep((prev) => Math.max(0, prev - 1))
  }

  function computeScore(items) {
    const sum = items.reduce((total, value) => total + Number(value || 0), 0)
    return Math.max(0, Math.min(100, sum - totalQuestions))
  }

  async function handleSubmit() {
    const score = computeScore(answers)
    await createAssessment({
      firstName,
      lastName,
      email,
      identity,
      source,
      context,
      responses: answers,
      score,
      archetype: null,
      createdAt: new Date().toISOString()
    })
    setSubmitted(true)
    setStep(totalQuestions + 1)
  }

  return (
    <section className="assessment">
      <div className="hero">
        <div className="hero-label">See It · Phase 1 of 3</div>
        <h1>The Phoenix <em>Clarity Assessment</em></h1>
        <p>
          The full 25-question Phoenix assessment helps you see where you are now, where you want to go,
          and what you need to move forward with confidence.
        </p>
        <div className="hero-meta">
          <span><span className="dot" />25 questions</span>
          <span><span className="dot" />Coach-ready results</span>
          <span><span className="dot" />Admin export available</span>
        </div>
      </div>

      <div className="container">
        {step === 0 && (
          <div className="intake-card">
            <h2>Intake</h2>
            <p>Tell us a little about yourself before you begin the assessment.</p>
            <div className="form-grid">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>How do you identify? (optional)</label>
                  <select value={identity} onChange={(e) => setIdentity(e.target.value)}>
                    <option value="">Prefer not to say</option>
                    <option>She/Her</option>
                    <option>He/Him</option>
                    <option>They/Them</option>
                    <option>Other / Self-describe</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>How did you hear about Phoenix?</label>
                <select value={source} onChange={(e) => setSource(e.target.value)}>
                  <option value="">Select one...</option>
                  <option>Referral</option>
                  <option>Social media</option>
                  <option>Website search</option>
                  <option>Discovery call</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>What brings you here today?</label>
                <textarea value={context} onChange={(e) => setContext(e.target.value)} rows="4" />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-primary" onClick={handleNext}>
                Start the Assessment
              </button>
            </div>
          </div>
        )}

        {step > 0 && step <= totalQuestions && (
          <div className="question-card">
            <div className="progress-wrap">
              <div className="progress-top">
                <span className="progress-label">Your Progress</span>
                <span className="progress-count">Question {step} of {totalQuestions}</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="dimension-label">{activeDimension}</div>
            </div>

            <div className="question-body">
              <div className="q-number">Question {step}</div>
              <p className="q-text">{questionPrompts[step - 1]}</p>
              <div className="scale-options">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`scale-button ${answers[step - 1] === String(value) ? 'active' : ''}`}
                    onClick={() => handleRating(String(value))}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="scale-ends">
                <span>1 = Rarely</span>
                <span>5 = Consistently</span>
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleBack}>
                ← Back
              </button>
              <button type="button" className="btn btn-primary" onClick={handleNext}>
                {step === totalQuestions ? 'Review & Submit' : 'Next →'}
              </button>
            </div>
          </div>
        )}

        {step === totalQuestions + 1 && (
          <div className="intake-card">
            <h2>Review & Submit</h2>
            <p>You're ready to save your full Phoenix assessment results.</p>
            <div className="review-row">
              <div><strong>Name:</strong> {firstName} {lastName}</div>
              <div><strong>Email:</strong> {email}</div>
              <div><strong>Estimated clarity score:</strong> {computeScore(answers)}</div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleBack}>
                ← Back
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSubmit}>
                Save My Results
              </button>
            </div>
            {submitted && (
              <div className="message-box">
                Your assessment has been saved. You can review submissions in the admin dashboard.
              </div>
            )}
          </div>
        )}

        <div className="section-card">
          <h3>Schedule a meeting</h3>
          <p>Use this email link to request a coaching conversation based on your clarity assessment.</p>
          <a
            href={`mailto:?subject=Meeting%20request%20-%20Clarity%20Assessment&body=Hi%2C%0A%0AI%20would%20like%20to%20schedule%20a%20meeting%20to%20discuss%20my%20assessment.%0A%0AThanks%2C%0A`}
            className="btn btn-secondary"
          >
            Email to schedule
          </a>
        </div>
      </div>
    </section>
  )
}
