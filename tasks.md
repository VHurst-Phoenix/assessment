# Phoenix Assessment — Tasks Status

Generated from `context/agent.md` (Master Developer Build Instructions) and current codebase state.

---

## Completed Tasks

### P0 — Fix Before Anything Else

- **Response scale corrected** — All 25 Clarity items now use the locked 1–5 agreement scale (`Strongly Disagree` → `Strongly Agree`) instead of the previous frequency wording. (`src/pages/AssessmentPage.jsx:303`)
- **Scoring model Option A is final** — Restored ×0.8 category normalization, 20–100 total range, and the correct band names (`Transitioner`, `Strategist`, `Executor`, `Phoenix`). Old names (`Rebuilding`, `Transitioning`, `Awakening`, `Rising`) are fully retired. (`src/pages/scoringBands.js:78-135`)
- **Consent/data-use notice implemented** — Pre-intake consent screen with `consent_timestamp` and `consent_version` fields is present before Q1. (`src/pages/ConsentPage.jsx`, `src/pages/AssessmentPage.jsx:413-440`)
- **Supabase insert timeout + AbortController** — 30-second abort guard added on Clarity submit and results-page email send. (`src/pages/AssessmentPage.jsx:245-247`, `src/pages/AssessmentCompletePage.jsx:93-94`)
- **Outbound email corrected and live** — `buildEmailHTML()` and `buildEmailText()` rebuilt for the corrected 20–100 model; delivery confirmed via Resend. (`src/utils/emailService.js:32-170`)
- **Dead legacy admin code deleted** — `Admin.jsx` removed. (`src/pages/Admin.jsx` no longer exists)
- **CSV formula-injection protection** — Cells prefixed with `=`, `+`, `-`, or `@` are escaped with a leading apostrophe. (`src/utils/csvExport.js:15-17`)
- **Readiness/Execution gating moved to auth** — Replaced hardcoded client-side strings with real `app_metadata.role === 'admin'` check. (`src/pages/AssessmentPage.jsx:69`)
- **Segment field on pre-intake forms** — `Individual` / `Corporate` / `Federal` captured on Clarity, Readiness, and Execution intake. (`src/pages/AssessmentPage.jsx:371-378`, `src/pages/AssessmentPage.jsx:644-657`)
- **Program Checkpoint field** — Required on Execution intake (`Week 3` → `Program Completion`). (`src/pages/AssessmentPage.jsx:685-702`)
- **Position, Friction Vector, Growth Edge implemented** — All three are computed in `scoringBands.js` and surfaced on the results page and record detail view. (`src/pages/scoringBands.js:37-76`, `src/pages/AssessmentCompletePage.jsx:33-35`, `src/pages/RecordDetails.jsx:146-148`)
- **Vercel SPA catch-all rewrite** — `vercel.json` added at repo root so `/assessment/execution` and `/assessment/readiness` no longer 404. (`vercel.json`)
- **Consent notice covers extra intake fields** — Documents `gender identity`, `referral source`, and free-text context field. (`src/pages/AssessmentPage.jsx:416-418`)

### P1 — Fix Before Public Relaunch

- **Readiness/Execution scoring uses true percentages** — `((raw − 5) / 20) × 100` with correct bands (`Friction-Bound` 0–24, `Emergent Traction` 25–49, `Operational Cadence` 50–74, `Strategic Velocity` 75–100; `Guarded` 0–24, `Developing` 25–49, `Willing` 50–74, `All In` 75–100). (`src/pages/toolScoring.js:36-62`)
- **Execution Gap archetypes implemented** — `The Stop-Starter`, `The Autopilot`, `The Stall-Out`. (`src/pages/toolScoring.js:48`)
- **Readiness Gap archetypes implemented** — `The Uncertain Mirror`, `The Overloaded`, `The Hesitant Investor`. (`src/pages/toolScoring.js:61`)
- **Dashboard 4-tab console exists** — `Clarity`, `Readiness`, `Execution`, `Testimonials` tabs with per-tab data loading, stats, and record list. (`src/pages/Dashboard.jsx`)
- **Record detail / Full Response Record** — Coach View (every question numbered, grouped by category) and score breakdown available per record. (`src/pages/RecordDetails.jsx`)
- **PDF export (window.print)** — Available from Record Details toolbar. (`src/pages/RecordDetails.jsx:104-106`)

---

## Uncompleted Tasks

### P0 — Fix Before Anything Else

| # | Tool | Issue | Status |
|---|------|-------|--------|
| 1 | Clarity | Reverse-scoring not implemented — 5 of 25 question slots need reverse flag + text swaps | **Not started** — No `reverse` flag or reverse-adjusted calculation exists. (`src/pages/assessmentQuestions.js` has no reverse metadata; `src/pages/scoringBands.js:24-31` sums raw values only.) |
| 2 | Clarity | Narrative lookup uses stale 3-key object in `AssessmentCompletePage.jsx` / `emailService.js` | **Partially addressed** — Code now uses `getScoringBandByKey(data.archetype)` and the 4-key band map, but email `buildEmailHTML` still reads `data.dimScores` as a flat array rather than a keyed `{transitioner, strategist, executor, phoenix}` object. |
| 3 | Security | Row Level Security cannot be confirmed from repo — no RLS policies in `create_tables.sql` | **Not started** — Must be verified directly in the Supabase dashboard. |
| 4 | Security | Admin credential rotation — exposed credential still referenced in `scripts/setup-admin-user.mjs` | **Not started** — Need to inspect and rotate. |

### P1 — Fix Before Public Relaunch

| # | Tool | Issue | Status |
|---|------|-------|--------|
| 5 | Clarity | Position and Friction Vector spec files (`positionCalc.js`, `frictionVectorCalc.js`) do not exist as separate modules | **Complete** — Named modules now own the locked Position and Friction Vector calculations; `scoringBands.js` re-exports them for existing consumers. |
| 6 | Readiness/Execution | Silent data loss on failed submission — `GenericAssessment.handleSubmit()` shows `alert('Assessment Submitted')` and resets form inside the `try` block | **Complete** — The form only clears after a successful database write, keeps all draft answers on errors, exposes a retryable inline error, and now gives inline success confirmation. |
| 7 | Dashboard | Live Dashboard table has zero Position / Friction Vector / Growth Edge visibility | **Complete** — The Clarity table now includes Position, Friction Vector, and Growth Edge columns. |
| 8 | Dashboard | CSV export has no segmentation support | **Complete** — Dashboard Segment filter constrains both the record list and CSV export. |
| 9 | Testimonials | No Band/archetype auto-matching — purely self-reported retired 3-tier Stage dropdown | **Complete pending deployment** — Server-side `submit-testimonial` matches historical Clarity records by email, records verified/self-reported source, and records movement when two results exist. |
| 10 | Testimonials | Email field purpose doesn't disclose it will also match against Clarity records | **Complete** — The client form explicitly discloses private email matching and that the email is never displayed. |
| 11 | Dashboard | Segment field and Testimonial Matching Engine have no UI in Dashboard | **Complete** — All dashboard tabs can filter by Segment; Clarity records show Tier 1/2/3 approved-story recommendations. |

### P2 — Fix Opportunistically

| # | Tool | Issue | Status |
|---|------|-------|--------|
| 12 | Clarity | Growth Edge tie-break order not formally locked | **Complete** — Exported `GROWTH_EDGE_TIE_BREAK_ORDER` documents first-listed-category precedence; the results page consumes `getGrowthEdge()` directly. |
| 13 | Clarity | Placeholder Band intro/directRead copy becomes client-facing | **Complete** — All four bands now use concise, participant-facing narrative copy. |
| 14 | Security | `src/db/index.js` is dead legacy code and still exists | **Complete** — Removed the unused legacy stub. |
| 15 | Dashboard | `@react-pdf/renderer` board-ready export not implemented | **Complete** — Record Details now provides a generated, board-ready PDF with summary and question-response pages. The PDF renderer is loaded only when needed. |

---

## Notes

- `src/pages/assessmentQuestions.js` contains all 25 Clarity questions, 15 Readiness questions, and 15 Execution questions with `dim` mapping for Clarity categories.
- `src/pages/scoringBands.js` contains `getPosition`, `getFrictionVector`, and `getGrowthEdge` as inline exports rather than separate spec files.
- The spec's **Recommended Build Sequence** is still relevant; steps 1–4 are largely complete, step 5 (Testimonials matching engine) and step 6–9 (Dashboard data layer + UI modules + segmentation + matching UI) remain.
