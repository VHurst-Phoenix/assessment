import { createReadiness } from '../api/dbClient';
import ToolAssessment from '../components/assessment/ToolAssessment';
import { readinessQuestions } from './assessmentQuestions';
import { getReadinessResults } from './toolScoring';
import { READINESS_CONSENT_VERSION } from '../lib/consent';

const ReadinessAssessment = () => (
  <ToolAssessment
    type="readiness"
    questions={readinessQuestions}
    calculateResults={getReadinessResults}
    onSave={createReadiness}
    consentVersion={READINESS_CONSENT_VERSION}
  />
);

export default ReadinessAssessment;
