const QuestionCard = ({ question, questionNumber, answer, onAnswer, labels }) => (
  <div key={questionNumber} className="card question-card animate-question-card">
    <div className="q-number">Question {questionNumber}</div>
    <div className="q-text">{question}</div>
    <div className="scale-options">
      {[1, 2, 3, 4, 5].map((number) => (
        <button key={number} type="button" className={`scale-btn ${answer === number ? 'selected' : ''}`} onClick={() => onAnswer(number)} aria-label={`Select ${number} for Question ${questionNumber}`}>
          <span className="scale-num">{number}</span>
          <span className="scale-label">{labels[number]}</span>
        </button>
      ))}
    </div>
    <div className="scale-ends"><span>1 = {labels[1]}</span><span>5 = {labels[5]}</span></div>
  </div>
);

export default QuestionCard;
