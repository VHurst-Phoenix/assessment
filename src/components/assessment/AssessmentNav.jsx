const AssessmentNav = ({ isFirstQuestion, isLastQuestion, isSubmitting, onBack, onNext }) => (
  <div className="nav-row">
    <button type="button" className="btn btn-secondary" disabled={isFirstQuestion || isSubmitting} onClick={onBack}>← Back</button>
    <button type="button" className="btn btn-primary" disabled={isSubmitting} onClick={onNext}>
      {isSubmitting ? 'Saving…' : isLastQuestion ? 'Submit Assessment →' : 'Next →'}
    </button>
  </div>
);

export default AssessmentNav;
