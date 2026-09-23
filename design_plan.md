# Design Plan: Readiness & Execution Assessment Pages

## Overview
Redesign the Readiness and Execution assessment pages to match the Clarity Assessment flow exactly:
1. **Consent form** (digital consent screen)
2. **User info + agreement checkbox** (intake form)
3. **One question per page** with progress tracking

---

## Current State Analysis

### Clarity Assessment (Target Pattern)
- **File**: `src/pages/AssessmentPage.jsx` → `ClarityAssessment` component
- **Flow**:
  1. Step 1: Intake form with consent checkbox (inline)
  2. Step 2: Single question per page with Next/Back navigation
  3. Progress bar + dimension label
  4. Submit → `/assessment-complete`

### Readiness/Execution (Current - GenericAssessment)
- **File**: `src/pages/AssessmentPage.jsx` → `GenericAssessment` component
- **Flow**: All questions rendered at once in a single form
- **No**: Consent screen, progress bar, one-question-per-page navigation

---

## Target Flow for Readiness & Execution

### Phase 1: Consent Screen (New)
- **Route**: `/consent?next=/assessment/readiness` or `/assessment/execution`
- **Component**: Reuse existing consent logic from `src/lib/consent.js`
- **Behavior**: Redirect to consent if not consented, then return to assessment

### Phase 2: Intake Form (Modified GenericAssessment → New Component)
- **Fields**:
  - Client First Name * (required)
  - Client Last Name * (required)
  - Client Email * (required, validated)
  - Company/Agency Affiliation (optional)
  - Segment: Individual / Corporate / Federal (required)
  - **Readiness only**: Session Type (Clarity Intensive / Week 1)
  - **Readiness only**: Session Date
  - **Execution only**: Program Checkpoint * (Week 3/6/9/12/Completion)
- **Consent**: Inline "Participation & Data Use Notice" with checkbox (required)
- **Action**: "Begin Assessment →" button (disabled until consent checked)

### Phase 3: Question Pages (New Component)
- **One question per page** with:
  - Progress bar (Question X of N)
  - Question text
  - 5-point scale buttons (1-5)
  - Scale labels (readiness: Not at all → Extremely; execution: Strongly Disagree → Strongly Agree)
  - Back / Next navigation
  - Submit on last question
- **State**: Track answers array, current question index
- **Validation**: Require answer before Next

### Phase 4: Submit & Results
- **Readiness**: Call `createReadiness()` → show success message, reset form
- **Execution**: Call `createExecutionForm()` → show success message, reset form
- **No redirect** to complete page (coach tools stay on same page)

---

## Component Architecture

### New Components to Create

```
src/pages/
├── ReadinessAssessment.jsx      # New - mirrors ClarityAssessment
├── ExecutionAssessment.jsx      # New - mirrors ClarityAssessment
└── assessmentQuestions.js       # Already has readinessQuestions, executionQuestions
```

### Reusable Components (Extract from ClarityAssessment)
```
src/components/assessment/
├── ConsentNotice.jsx            # Inline consent block
├── IntakeForm.jsx               # User info + consent checkbox
├── QuestionCard.jsx             # Single question with scale
├── ProgressBar.jsx              # Progress indicator
└── AssessmentNav.jsx            # Back/Next/Submit buttons
```

---

## Routing & Navigation

### Updated `assessmentRoutes.js`
```javascript
export function getAssessmentPath(tab) {
  switch (tab) {
    case 'readiness': return '/assessment/readiness';
    case 'execution': return '/assessment/execution';
    // ...
  }
}
```

### Consent Integration
```javascript
// In AssessmentPage.jsx - add for readiness/execution
const READINESS_CONSENT_VERSION = '1.0';
const EXECUTION_CONSENT_VERSION = '1.0';

// Check consent before showing intake
if ((activeTab === 'readiness' || activeTab === 'execution') && !hasToolConsented(activeTab)) {
  const next = encodeURIComponent(location.pathname + location.search);
  return <Navigate to={`/consent?next=${next}&tool=${activeTab}`} replace />;
}
```

---

## Data Models

### Readiness Assessment Submission
```javascript
{
  firstName: string,
  lastName: string,
  email: string,
  company: string,
  segment: 'Individual' | 'Corporate' | 'Federal',
  sessionType: 'clarity-intensive' | 'week1',
  sessionDate: string (ISO),
  answers: number[14],  // 14 questions
  score: number,        // calculated
  categoryScores: object,
  band: string,
  gap: string,
  date: string (ISO),
  consentTimestamp: string (ISO),
  consentVersion: string
}
```

### Execution Assessment Submission
```javascript
{
  firstName: string,
  lastName: string,
  email: string,
  company: string,
  segment: 'Individual' | 'Corporate' | 'Federal',
  programCheckpoint: 'Week 3' | 'Week 6' | 'Week 9' | 'Week 12' | 'Program Completion',
  answers: number[16],  // 16 questions
  score: number,
  categoryScores: object,
  band: string,
  gap: string,
  date: string (ISO),
  consentTimestamp: string (ISO),
  consentVersion: string
}
```

---

## Scoring (Already Exists in `toolScoring.js`)

- `getReadinessResults(answers)` → `{ score, categoryScores, band, gap }`
- `getExecutionResults(answers)` → `{ score, categoryScores, band, gap }`

---

## CSS Classes to Reuse

From `AssessmentPage.css`:
- `.progress-wrap`, `.progress-bar-track`, `.progress-bar-fill`
- `.dimension-label` (use section label instead)
- `.q-number`, `.q-text`
- `.scale-options`, `.scale-btn`, `.scale-btn.selected`
- `.scale-num`, `.scale-label`, `.scale-ends`
- `.nav-row`, `.btn-primary`, `.btn-secondary`
- `.consent-notice-block`, `.consent-inline-checkbox`
- `.animate-intake-card`, `.animate-question-card`
- `.assessment-submit-error`, `.assessment-submit-success`

---

## Implementation Steps

### Step 1: Create Consent Versions & Check Functions
- Add `READINESS_CONSENT_VERSION`, `EXECUTION_CONSENT_VERSION` to `src/lib/consent.js`
- Add `hasReadinessConsented()`, `hasExecutionConsented()`

### Step 2: Create Shared Components
- `src/components/assessment/ConsentNotice.jsx`
- `src/components/assessment/IntakeForm.jsx`
- `src/components/assessment/QuestionCard.jsx`
- `src/components/assessment/ProgressBar.jsx`
- `src/components/assessment/AssessmentNav.jsx`

### Step 3: Create ReadinessAssessment Component
- Mirror `ClarityAssessment` structure
- Use `readinessQuestions` (14 questions)
- Readiness-specific intake fields
- Readiness scale labels
- Submit → `createReadiness()`

### Step 4: Create ExecutionAssessment Component
- Mirror `ClarityAssessment` structure
- Use `executionQuestions` (16 questions)
- Execution-specific intake fields
- Execution scale labels
- Submit → `createExecutionForm()`

### Step 5: Update AssessmentPage.jsx
- Replace `GenericAssessment` with new components
- Add consent checks for readiness/execution
- Wire up routing

### Step 6: Update Consent Page
- Handle `tool` parameter (readiness/execution)
- Store tool-specific consent

---

## Testing Checklist

- [ ] Consent screen appears for new users
- [ ] Intake form validates required fields
- [ ] Consent checkbox enables "Begin Assessment" button
- [ ] One question per page with progress bar
- [ ] Back/Next navigation works
- [ ] Scale selection updates state
- [ ] Submit validates all questions answered
- [ ] Readiness submits to `createReadiness()`
- [ ] Execution submits to `createExecutionForm()`
- [ ] Success message shows, form resets
- [ ] Mobile responsive (uses existing CSS media queries)
- [ ] Passcode protection still works

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/lib/consent.js` | Add tool consent versions & checks |
| `src/components/assessment/*.jsx` | New shared components (5 files) |
| `src/pages/ReadinessAssessment.jsx` | New component |
| `src/pages/ExecutionAssessment.jsx` | New component |
| `src/pages/AssessmentPage.jsx` | Replace GenericAssessment, add consent checks |
| `src/pages/assessmentRoutes.js` | No change (routes already exist) |
| `src/pages/assessmentQuestions.js` | No change (questions already defined) |
| `src/pages/toolScoring.js` | No change (scoring already exists) |

---

## Notes

- **No results page** for coach tools - they stay on the assessment page with success message
- **Passcode protection** remains unchanged (handled in AssessmentPage.jsx)
- **Segment field** is now required (per Dashboard Build Spec)
- **Consent version** allows future updates to notice text
- **Animation classes** from CSS reuse for consistent feel