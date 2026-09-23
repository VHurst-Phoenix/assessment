import { createExecutionForm } from '../api/dbClient';
import ToolAssessment from '../components/assessment/ToolAssessment';
import { executionQuestions } from './assessmentQuestions';
import { getExecutionResults } from './toolScoring';
import { EXECUTION_CONSENT_VERSION } from '../lib/consent';

const ExecutionAssessment = () => (
  <ToolAssessment
    type="execution"
    questions={executionQuestions}
    calculateResults={getExecutionResults}
    onSave={createExecutionForm}
    consentVersion={EXECUTION_CONSENT_VERSION}
  />
);

export default ExecutionAssessment;
