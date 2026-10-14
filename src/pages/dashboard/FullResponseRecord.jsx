import { useMemo, useState } from 'react';
import { clarityDimensions, clarityQuestions, executionQuestions, readinessQuestions } from '../assessmentQuestions.js';
import { executionCategories, readinessCategories } from '../toolScoring.js';
import { buildEmailHTML, SUMMARY_EMAIL_SUBJECT } from '../../utils/emailService';

// Full Response Record (Build Spec Addendum 1, §3): every question numbered and
// grouped by its real category, with a Coach View / Client Email View toggle.

const AGREEMENT = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
const READINESS = ['Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely'];

function getQuestionSet(type) {
  if (type === 'clarity') {
    return {
      scale: AGREEMENT,
      categories: clarityDimensions.map((name, dim) => ({
        name,
        items: clarityQuestions
          .map((question, index) => ({ number: index + 1, text: question.text, reverse: Boolean(question.reverse), dim: question.dim }))
          .filter((item) => item.dim === dim),
      })),
    };
  }
  const questions = type === 'readiness' ? readinessQuestions : executionQuestions;
  const names = type === 'readiness' ? readinessCategories : executionCategories;
  return {
    scale: type === 'readiness' ? READINESS : AGREEMENT,
    categories: names.map((name, categoryIndex) => ({
      name,
      items: questions.slice(categoryIndex * 5, categoryIndex * 5 + 5).map((text, offset) => ({ number: categoryIndex * 5 + offset + 1, text })),
    })),
  };
}

export default function FullResponseRecord({ type, record }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('coach');
  const questionSet = useMemo(() => getQuestionSet(type), [type]);
  const answers = Array.isArray(record?.answers) ? record.answers : [];
  const total = questionSet.categories.reduce((sum, category) => sum + category.items.length, 0);
  const emailHtml = useMemo(() => (open && view === 'email' && type === 'clarity' ? buildEmailHTML(record) : ''), [open, view, type, record]);

  return (
    <section className="frr">
      <button type="button" className="frr-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true">{open ? '▾' : '▸'}</span> {open ? 'Hide' : 'Show'} question-by-question responses ({total} questions, grouped by {type === 'clarity' ? 'dimension' : 'category'})
      </button>
      {open && (
        <div className="frr-panel">
          <div className="frr-subtabs" role="tablist">
            <button type="button" role="tab" aria-selected={view === 'coach'} className={view === 'coach' ? 'is-active' : ''} onClick={() => setView('coach')}>Coach View</button>
            <button type="button" role="tab" aria-selected={view === 'email'} className={view === 'email' ? 'is-active' : ''} onClick={() => setView('email')}>Client Email View</button>
          </div>
          <div className="frr-body">
            {view === 'coach' ? (
              answers.length === 0 ? <p className="frr-empty">No responses are stored for this record.</p> : questionSet.categories.map((category) => (
                <div className="frr-category" key={category.name}>
                  <div className="frr-category-name">{category.name} (Q{category.items[0].number}–Q{category.items.at(-1).number})</div>
                  {category.items.map((item) => {
                    const answer = Number(answers[item.number - 1]);
                    return (
                      <div className="frr-qa" key={item.number}>
                        <span className="frr-qnum">Q{item.number}</span>
                        <div>
                          <div className="frr-qtext">{item.text}{item.reverse && <span className="frr-reverse">reverse-scored</span>}</div>
                          <div className="frr-answer">Client's choice: <b>{answer ? `${answer} / 5 — ${questionSet.scale[answer - 1]}` : '—'}</b></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            ) : type === 'clarity' ? (
              <div className="frr-email">
                <div className="frr-email-meta"><b>Subject:</b> {SUMMARY_EMAIL_SUBJECT} · <b>To:</b> {record.email}</div>
                <iframe title="Client summary email" srcDoc={emailHtml} />
                <p className="frr-email-note">This is the summary email sent at submission. The complete report is the PDF released separately from this record.</p>
              </div>
            ) : (
              <p className="frr-empty">No outbound client email exists for {type === 'readiness' ? 'Readiness' : 'Execution'} yet — this is the current, documented state (Build Spec Addendum 1, §3.2), not an error.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
