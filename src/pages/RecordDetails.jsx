import { lazy, Suspense, useEffect, useState } from 'react';
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
import { MAX_CATEGORY_SCORE, getCategoryScores, getClarityScore, getRawTotal, getScoringBand, getPosition, getFrictionVector, getGrowthEdge } from './scoringBands';
import { formatPercent, getExecutionResults, getReadinessResults } from './toolScoring';
import './RecordDetails.css';

const RecordPdfDownload = lazy(() => import('./RecordPdfDownload'));

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
  1: 'Strongly Disagree',
  2: 'Disagree',
  3: 'Neutral',
  4: 'Agree',
  5: 'Strongly Agree',
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

  // Recompute every complete Clarity record from its stored responses using
  // the current reverse-aware, normalized scoring model.
  const answers = getAnswerList(record);
  const toolResults = type === 'readiness' && answers.length === readinessQuestions.length
    ? getReadinessResults(answers)
    : type === 'execution' && answers.length === executionQuestions.length
      ? getExecutionResults(answers)
      : null;
  const hasCompleteClarityResponses = answers.length === clarityQuestions.length;
  const clarityScore = config.hasDimensions
    ? (hasCompleteClarityResponses ? getClarityScore(answers) : record.score ?? null)
    : null;
  const categoryScores = config.hasDimensions
    ? (hasCompleteClarityResponses ? getCategoryScores(answers) : record.dimScores)
    : null;
  const clarityRawScore = config.hasDimensions
    ? (hasCompleteClarityResponses ? getRawTotal(answers) : record.rawScore ?? null)
    : null;
  const band = config.hasBand ? getScoringBand(clarityScore) : null;
  const position = config.hasDimensions && categoryScores ? getPosition(categoryScores) : null;
  const frictionVector = config.hasDimensions && categoryScores && position ? getFrictionVector(categoryScores, position) : null;
  const growthEdge = config.hasDimensions && categoryScores ? getGrowthEdge(categoryScores) : null;
  const questions = questionSetByType[type] || [];

  return (
    <div className="record-detail-shell">
      <div className="record-detail-toolbar no-print">
        <Link to="/dashboard" className="btn btn-secondary">← Back to Dashboard</Link>
        <Suspense fallback={<span className="btn btn-gold">Preparing export…</span>}>
          <RecordPdfDownload config={config} record={record} type={type} summary={{ clarityScore, clarityRawScore, categoryScores, band, position, frictionVector, growthEdge, toolResults }} questions={questions} answers={answers} dimLabels={dimLabels} />
        </Suspense>
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
              <dt>Clarity Band</dt><dd>{record.band || record.stage || '—'}</dd>
              <dt>Band Source</dt><dd>{record.bandSource || 'self-reported'}</dd>
              <dt>Segment</dt><dd>{record.segment || '—'}</dd>
              <dt>Band Display Consent</dt><dd>{record.showBand ? 'Show band' : 'Do not show band'}</dd>
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
                  <strong>{clarityScore ?? '—'} / 100</strong>
                  {clarityRawScore !== null && <small>Adjusted response total: {clarityRawScore} / 125</small>}
                </div>
              ) : (
                <div className="record-score-card">
                  <span className="record-score-label">Score</span>
                  <strong>{record.score === null || record.score === undefined ? '—' : formatPercent(toolResults?.score ?? record.score)}</strong>
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

            {!config.hasDimensions && toolResults && (
              <div className="record-section">
                <h3>{type === 'readiness' ? 'Readiness' : 'Execution'} Profile</h3>
                <div className="record-kv">
                  <dt>Band</dt><dd>{toolResults.band?.label || '—'}</dd>
                  <dt>Gap</dt><dd>{toolResults.gap.archetype}</dd>
                  <dt>Lowest Category</dt><dd>{toolResults.gap.category} ({formatPercent(toolResults.gap.score)})</dd>
                </div>
              </div>
            )}

            {position && (
              <div className="record-section">
                <h3>Position</h3>
                <div className="record-kv">
                  <dt>Quadrant</dt><dd>{position.quadrant}</dd>
                  <dt>Inner Axis</dt><dd>{position.innerAxis.toFixed(1)} / 40</dd>
                  <dt>Outer Axis</dt><dd>{position.outerAxis.toFixed(1)} / 40</dd>
                  <dt>Threshold</dt><dd>{position.threshold}</dd>
                </div>
              </div>
            )}

            {frictionVector && (
              <div className="record-section">
                <h3>Friction Vector</h3>
                <div className="record-kv">
                  <dt>Archetype</dt><dd>{frictionVector.archetype}</dd>
                  <dt>Patterns & Blocks Score</dt><dd>{frictionVector.patternsBlocks} / 20</dd>
                  <dt>Lower Axis</dt><dd>{frictionVector.lowerAxis === 'inner' ? 'Inner (Strengths & Skills + Alignment & Confidence)' : 'Outer (Values & What Matters + Direction & Opportunity)'}</dd>
                </div>
              </div>
            )}

            {growthEdge && (
              <div className="record-section">
                <h3>Growth Edge</h3>
                <div className="record-kv">
                  <dt>Category</dt><dd>{dimLabels[growthEdge.index]}</dd>
                  <dt>Score</dt><dd>{growthEdge.score} / 20</dd>
                </div>
              </div>
            )}

            {config.hasDimensions && Array.isArray(record.dimScores) && (
              <div className="record-section">
                <h3>Five Dimensions</h3>
                <div className="record-dims">
                  {categoryScores.map((catScore, i) => {
                    return (
                      <div className="record-dim-row" key={dimLabels[i]}>
                        <span className="record-dim-name">{dimLabels[i]}</span>
                        <div className="record-dim-track">
                          <div
                            className="record-dim-fill"
                            style={{ width: `${Math.round((catScore / MAX_CATEGORY_SCORE) * 100)}%` }}
                          />
                        </div>
                        <span className="record-dim-num">{Number.isInteger(catScore) ? catScore : catScore.toFixed(1)} / 20</span>
                      </div>
                    );
                  })}
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
