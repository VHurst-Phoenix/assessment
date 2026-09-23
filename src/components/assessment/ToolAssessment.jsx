import { useState } from 'react';
import IntakeForm from './IntakeForm';
import ProgressBar from './ProgressBar';
import QuestionCard from './QuestionCard';
import AssessmentNav from './AssessmentNav';

const emptyForm = (type) => ({
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  segment: '',
  sessionType: type === 'readiness' ? 'clarity-intensive' : '',
  sessionDate: '',
  programCheckpoint: '',
});

const ToolAssessment = ({ type, questions, calculateResults, onSave, consentVersion }) => {
  const [step, setStep] = useState('intake');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [formData, setFormData] = useState(() => emptyForm(type));
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [consentTimestamp, setConsentTimestamp] = useState(null);
  const [answers, setAnswers] = useState(() => Array(questions.length).fill(null));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const isReadiness = type === 'readiness';
  const scaleLabels = isReadiness
    ? ['', 'Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely']
    : ['', 'Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

  const beginAssessment = (event) => {
    event.preventDefault();
    if (!consentAgreed) return;
    setSubmitError('');
    setStep('questions');
  };

  const saveAssessment = async () => {
    if (isSubmitting) return;
    if (answers.includes(null)) {
      setSubmitError('Please answer every question before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    const results = calculateResults(answers);
    const data = {
      ...formData,
      date: new Date().toISOString(),
      answers,
      score: results.score,
      categoryScores: results.categoryScores,
      band: results.band?.label || null,
      gap: results.gap?.archetype || null,
      consentTimestamp,
      consentVersion,
    };

    try {
      await onSave(data);
      setSubmitSuccess(`${isReadiness ? 'Client Readiness' : 'Client Execution'} was saved successfully.`);
      setStep('intake');
      setCurrentQuestion(0);
      setAnswers(Array(questions.length).fill(null));
      setFormData(emptyForm(type));
      setConsentAgreed(false);
      setConsentTimestamp(null);
    } catch (error) {
      console.error(`Failed to persist ${type} assessment to Supabase:`, error);
      setSubmitError(error.message || `Failed to save ${type} assessment. Your responses are still on this page.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextQuestion = () => {
    if (answers[currentQuestion] === null) {
      setSubmitError('Please select a response before continuing.');
      return;
    }
    setSubmitError('');
    if (currentQuestion === questions.length - 1) {
      saveAssessment();
      return;
    }
    setCurrentQuestion((current) => current + 1);
  };

  const setAnswer = (answer) => {
    setAnswers((current) => current.map((value, index) => index === currentQuestion ? answer : value));
    setSubmitError('');
  };

  if (step === 'intake') {
    return (
      <>
        <IntakeForm
          type={type}
          formData={formData}
          onChange={setFormData}
          consentAgreed={consentAgreed}
          onConsentChange={(checked) => {
            setConsentAgreed(checked);
            setConsentTimestamp(checked ? new Date().toISOString() : null);
          }}
          onSubmit={beginAssessment}
        />
        {submitSuccess && <div className="assessment-submit-success" role="status">{submitSuccess}</div>}
      </>
    );
  }

  const sectionLabel = isReadiness
    ? ['Self-Awareness & Capability', 'Emotional Stability & Capacity', 'Commitment & Investment'][Math.floor(currentQuestion / 5)]
    : ['Consistency', 'Alignment & Authenticity', 'Resilience'][Math.floor(currentQuestion / 5)];

  return (
    <div className="assessment-questions">
      <ProgressBar currentQuestion={currentQuestion} questionCount={questions.length} sectionLabel={sectionLabel} />
      <QuestionCard
        question={questions[currentQuestion]}
        questionNumber={currentQuestion + 1}
        answer={answers[currentQuestion]}
        onAnswer={setAnswer}
        labels={scaleLabels}
      />
      <AssessmentNav
        isFirstQuestion={currentQuestion === 0}
        isLastQuestion={currentQuestion === questions.length - 1}
        isSubmitting={isSubmitting}
        onBack={() => { setCurrentQuestion((current) => current - 1); setSubmitError(''); }}
        onNext={nextQuestion}
      />
      {submitError && <div className="assessment-submit-error" role="alert">{submitError}</div>}
    </div>
  );
};

export default ToolAssessment;
