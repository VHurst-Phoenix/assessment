const ProgressBar = ({ currentQuestion, questionCount, sectionLabel }) => {
  const progress = Math.round(((currentQuestion + 1) / questionCount) * 100);

  return (
    <div className="progress-wrap">
      <div className="progress-top">
        <span className="progress-label">Your Progress</span>
        <span className="progress-count">Question {currentQuestion + 1} of {questionCount}</span>
      </div>
      <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${progress}%` }} /></div>
      <div className="dimension-label">{sectionLabel}</div>
    </div>
  );
};

export default ProgressBar;
