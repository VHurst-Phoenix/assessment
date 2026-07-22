import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  listAssessments,
  listReadiness,
  listExecutionForms,
  listTestimonials,
} from '../api/dbClient';
import {
  clarityQuestions,
  readinessQuestions,
  executionQuestions,
  dimLabels,
} from './assessmentQuestions';
import { getRawTotal, getScoringBand } from './scoringBands';
import './RecordDetails.css';

// Maps the :type route param to the right fetch function and display config.
// Reuses the exact same list functions Dashboard.jsx already calls — no new
// Supabase queries or dbClient changes required.
const typeConfig = {
  clarity: { fetchList: listAssessments, label: 'Clarity Assessment', hasDimensions: true, hasBand: true },
  readiness: { fetchList: listReadiness, label: 'Client Readiness', hasDimensions: false, hasBand: false },
  execution: { fetchList: listExecutionForms, label: 'Client Execution', hasDimensions: false, hasBand: false },
  testimonials: { fetchList: listTestimonials, label: 'Client Story', isTestimonial: true },
};

const questionSetByType = {
  clarity: clarityQuestions.map((q) => q.text),
  readiness: readinessQuestions,
  execution: executionQuestions,
};

const clarityChoiceLabels = {
  1: 'Rarely',
  2: 'Occasionally',
  3: 'Sometimes',
  4: 'Frequently',
  5: 'Consistently',
};

const getAnswerList = (record) => {
  if (Array.isArray(record?.answers)) return record.answers;
  if (Array.isArray(record?.responses)) return record.responses;
  return [];
};

const formatChoice = (type, value) => {
  if (value === null || value === undefined || value === '') return '—';

  const numericValue = Number(value);
  const score = Number.isFinite(numericValue) ? numericValue : value;

  if (type === 'clarity' && clarityChoiceLabels[numericValue]) {
    return `${score} / 5 - ${clarityChoiceLabels[numericValue]}`;
  }

  return `${score} / 5`;
};

const RecordDetail = () => {
  const { type, id } = useParams();
  const [record, setRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const config = typeConfig[type];

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!config) {
        setError(`Unknown record type "${type}".`);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const rows = await config.fetchList();
        const match = (rows || []).find((row) => String(row.id) === String(id));
        if (isMounted) {
          if (!match) {
            setError('This record could not be found. It may have been deleted.');
          }
          setRecord(match || null);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setError(err.message || 'Unable to load this record.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [type, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExportPdf = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="record-detail-shell">
        <div className="record-detail-loading">Loading record…</div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="record-detail-shell">
        <div className="record-detail-error">
          <p>{error || 'Record not found.'}</p>
          <Link to="/dashboard" className="btn btn-secondary">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  // Prefer recomputing from the saved answers array — this is robust even for
  // older clarity records saved before the scoring system changed from a
  // 0-100 percentage to a raw 25-125 sum. Falls back to the stored `score`
  // field only if answers weren't saved (very old / partial records).
  const rawTotal = config.hasDimensions
    ? (getRawTotal(getAnswerList(record)) ?? record.score ?? null)
    : null;
  const band = config.hasBand ? getScoringBand(rawTotal) : null;
  const questions = questionSetByType[type] || [];
  const answers = getAnswerList(record);

  return (
    <div className="record-detail-shell">
      <div className="record-detail-toolbar no-print">
        <Link to="/dashboard" className="btn btn-secondary">← Back to Dashboard</Link>
        <button onClick={handleExportPdf} className="btn btn-gold">📄 Export as PDF</button>
      </div>

      <div className="record-detail-print-area">
        <div className="record-header-card">
          <div className="record-header-label">{config.label}</div>
          <h2>{record.firstName} {record.lastName}</h2>
          <div className="record-header-meta">
            <span>{record.email}</span>
            <span>·</span>
            <span>{record.date ? new Date(record.date).toLocaleString() : '—'}</span>
          </div>
        </div>

        {config.isTestimonial ? (
          <div className="record-section">
            <h3>Story Submission</h3>
            <dl className="record-kv">
              <dt>Role / Profession</dt><dd>{record.role || '—'}</dd>
              <dt>Stage</dt><dd>{record.stage || '—'}</dd>
              <dt>Status</dt><dd>{record.status || '—'}</dd>
              <dt>Anonymous</dt><dd>{record.anonymous || 'No'}</dd>
            </dl>
            <div className="record-story-block">
              <h4>Before</h4>
              <p>{record.before}</p>
              <h4>The Shift</h4>
              <p>{record.shift}</p>
              <h4>After</h4>
              <p>{record.after}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="record-score-row">
              {config.hasDimensions ? (
                <div className="record-score-card">
                  <span className="record-score-label">Clarity Score</span>
                  <strong>{rawTotal ?? '—'} / 125</strong>
                </div>
              ) : (
                <div className="record-score-card">
                  <span className="record-score-label">Score</span>
                  <strong>{record.score}%</strong>
                </div>
              )}
              {config.hasBand && (
                <div className="record-score-card">
                  <span className="record-score-label">Scoring Band</span>
                  <strong>{band ? band.label : '—'}</strong>
                </div>
              )}
            </div>

            {config.hasBand && band && (
              <div className="record-section record-narrative">
                <h3>Scoring Band Narrative — {band.label}</h3>
                <p className="record-narrative-body">{band.intro}</p>
                <p className="record-narrative-body">{band.directRead}</p>
              </div>
            )}

            {config.hasDimensions && Array.isArray(record.dimScores) && (
              <div className="record-section">
                <h3>Five Dimensions</h3>
                <div className="record-dims">
                  {record.dimScores.map((score, i) => (
                    <div className="record-dim-row" key={dimLabels[i]}>
                      <span className="record-dim-name">{dimLabels[i]}</span>
                      <div className="record-dim-track">
                        <div
                          className="record-dim-fill"
                          style={{ width: `${Math.round((score / 25) * 100)}%` }}
                        />
                      </div>
                      <span className="record-dim-num">{score} / 25</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {answers.length > 0 && questions.length > 0 ? (
              <div className="record-section">
                <h3>Question-by-Question Responses</h3>
                <ol className="record-qa-list">
                  {questions.map((qText, i) => (
                    <li key={i} className="record-qa-item">
                      <div className="record-qa-question">{qText}</div>
                      <div className="record-qa-answer">
                        User's choice: <strong>{formatChoice(type, answers[i])}</strong>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <div className="record-section">
                <p className="record-no-data">
                  Individual question responses are not available for this record.
                  This can happen for records saved before detailed answers were stored.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RecordDetail;
