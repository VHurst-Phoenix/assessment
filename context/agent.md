# Phoenix — Master Developer Build Instructions

## Governing Rule

Each tool's scoring model, band names, and outputs are **separately locked and must never be blended** into another tool's. Clarity has a Position 2×2 and a Friction Vector; Execution and Readiness each have a single consolidated Gap archetype; Testimonials carries a real Clarity Band. The Dashboard displays each tool's own outputs on its own tab — never a shared band vocabulary, never a Position view forced onto a tool that doesn't have one.

## Master Priority Punch List

### P0 — Fix Before Anything Else

| Tool | Issue | Fix Location |
|------|-------|--------------|
| Clarity | Client-facing results show wrong narrative for 3 of 4 outcomes — AssessmentCompletePage.jsx/emailService.js use stale 3-key object; keys must be transitioner/strategist/executor/phoenix | AssessmentCompletePage.jsx:28; emailService.js:52,170; scoringBands.js |
| Clarity | Results/submission page can hang indefinitely — add timeout/AbortController on Supabase insert and results-page email send | AssessmentPage.jsx handleSubmit(); AssessmentCompletePage.jsx send() |
| Clarity | Response scale shows frequency wording (Rarely…Consistently) instead of locked 1–5 agreement scale on all 25 items | AssessmentPage.jsx — scale labels |
| Clarity | No consent/data-use notice shown before assessment begins — legal-exposure gap | Pre-intake flow before Q1; add consent_timestamp + consent_version fields |
| Clarity | Reverse-scoring not implemented — 5 of 25 question slots need reverse flag + text swaps | assessmentQuestions.js; scoringBands.js |
| Clarity | Scoring model Option A is final — restore ×0.8 category normalization, 20–100 total range, Transitioner/Strategist/Executor/Phoenix band names; retire Rebuilding/Transitioning/Awakening/Rising names everywhere | scoringBands.js |
| Clarity | Response-scale + reverse-scoring text changes should be two focused passes (4 cosmetic swaps, then 5 reverse-score replacements), not 25 ad hoc edits | assessmentQuestions.js |
| Dashboard | Live Dashboard.jsx still runs retired 25–125 model with zero Position/Friction Vector/Growth Edge visibility | Dashboard.jsx, RecordDetails.jsx — see Dashboard Build Spec |
| Dashboard | Outbound emailed report (buildEmailHTML/buildEmailText) is on retired model — reaches real clients; confirmed Resend-based | emailService.js — see Build Spec Addendum 1, §2 |
| Security | Live admin credential (phoenix@gmail.com / phoenix2026) committed in plaintext in public repo — rotate now | scripts/setup-admin-user.mjs; Admin.jsx (COACH_CODE) |
| Security | Readiness/Execution intake gated by hardcoded plaintext client-side strings ("readiness2027"/"execution2027") — extractable from JS bundle | AssessmentPage.jsx handlePasswordSubmit() |
| Security | Row Level Security cannot be confirmed from repo — no RLS policies in create_tables.sql for any of 4 tables; all client-side calls use public anon key | Confirm directly in Supabase dashboard |

### P1 — Fix Before Public Relaunch

| Tool | Issue | Fix Location |
|------|-------|--------------|
| Clarity | Position and Friction Vector exist nowhere — now fully specified with 26.5 threshold constant | New positionCalc.js/frictionVectorCalc.js |
| Clarity | Consent documentation doesn't cover extra intake fields (gender identity, referral source, free-text field) | Build Spec Section 9 — documentation only |
| Clarity | Two assessment URLs 404 on direct navigation (/assessment/execution, /assessment/readiness) — Vercel doesn't honor Netlify-style _redirects | New vercel.json at repo root — SPA catch-all rewrite |
| Readiness/Execution | Silent data loss on failed submission — errors only logged to console; UI shows "Assessment Submitted" and resets form, discarding coach ratings | AssessmentPage.jsx GenericAssessment.handleSubmit() |
| Readiness/Execution | Scores mislabeled as percentages — both reuse raw 1–5 sum (range 15–75) but UI appends "%" | Dashboard.jsx admin-statcard & score-badge; RecordDetails.jsx |
| Testimonials | Live code has no Band/archetype auto-matching — purely self-reported retired 3-tier Stage dropdown | Testimonials Build Spec Sections 2–3 |
| Testimonials | Email field purpose doesn't disclose it will also match against Clarity records for Band auto-matching | Testimonials Build Spec Section 7 — consent notice |
| Dashboard | CSV export has no segmentation support | csvExport.js — see Dashboard Build Spec Module 4 |
| Dashboard | Segment field and Testimonial Matching Engine are new client-facing/coach-facing scope with no existing UI | Dashboard Build Spec Sections 5, 7 |

### P2 — Fix Opportunistically

| Tool | Issue | Fix Location |
|------|-------|--------------|
| Clarity | Growth Edge card exists but isn't formally tied to spec definition (lowest of 5 category scores, fixed tie-break order) | AssessmentCompletePage.jsx |
| Clarity | Placeholder Band intro/directRead copy in scoringBands.js becomes client-facing once P0 narrative-lookup fix ships | scoringBands.js |
| Security | Dead legacy admin code (Admin.jsx, db.js, db/index.js) is unrouted, would crash if rendered, and still carries leaked password — delete outright | src/pages/Admin.jsx; src/db.js; src/db/index.js |
| Security | CSV export has no formula-injection protection for user-supplied free text (=, +, -, @ prefixes) | src/utils/csvExport.js |

## Corrected Architecture — Per Tool

### Clarity

- **Questions**: 25 items, 5 categories of 5 (Strengths & Skills, Values & What Matters, Patterns & Blocks, Direction & Opportunity, Alignment & Confidence). Field keys q01–q25, zero-padded, stored as keyed object.
- **Response scale**: 1 = Strongly Disagree … 5 = Strongly Agree. 5 reverse-scored items (one per category), reverse-adjusted at calculation time only — always store raw response.
- **Category score**: (raw category sum) × 0.8 → range 4–20 per category.
- **Band Total**: Sum of 5 category scores → range 20–100. Bands: Transitioner 20–39, Strategist 40–59, Executor 60–79, Phoenix 80–100.
- **Position (2×2)**: Inner axis = Strengths & Skills + Alignment & Confidence. Outer axis = Values & What Matters + Direction & Opportunity. Patterns & Blocks held out — narrative-only, feeds Friction Vector. Threshold = 26.5 (single named constant, of 40 max per axis). Quadrants: Low/Low = System Evaluator, High Inner/Low Outer = Strategic Planner, Low Inner/High Outer = Kinetic Operator, High/High = Momentum Builder.
- **Friction Vector**: 4 archetypes drawn from Patterns & Blocks + lower of the two Position axes: Self-Discounter, Vision Staller, Imposter Protector, The Magnifier.
- **Growth Edge**: Single lowest-scoring of 5 categories. Tie-break: first-listed category in fixed order wins.
- **Outbound email**: buildEmailHTML()/buildEmailText() (emailService.js) via Resend — corrected per Build Spec Addendum 1, §2.

### Execution

- **Questions**: 15 items, 3 categories of 5 (Consistency, Alignment & Authenticity, Resilience). Reuses Clarity's 1–5 agreement scale — first-person statements.
- **Category score**: ((raw category sum − 5) / 20) × 100 → true percentage, 0–100 per category.
- **Execution Score**: Average of 3 category scores. Bands: Friction-Bound 0–24, Emergent Traction 25–49, Operational Cadence 50–74, Strategic Velocity 75–100.
- **Execution Gap**: Single consolidated signal — lowest of 3 categories, named archetype (The Stop-Starter / The Autopilot / The Stall-Out). No 2×2 Position.
- **New field**: Program Checkpoint (required): Week 3 / Week 6 / Week 9 / Week 12 / Program Completion.
- **Outbound email**: None exists today — confirmed absent; new scope if ever needed.

### Readiness

- **Questions**: 15 items, 3 categories of 5 (Self-Awareness & Capability, Emotional Stability & Capacity, Commitment & Investment). Coach-entered, third-person data about the client.
- **Response scale**: 1 = Not at all … 5 = Extremely (Clarity's agreement scale doesn't fit third-person phrasing).
- **Category score**: ((raw category sum − 5) / 20) × 100 → true percentage.
- **Readiness Score**: Average of 3 category scores. Bands: Guarded 0–24, [25–49 unnamed mid band], Willing 50–74, All In 75–100.
- **Readiness Gap**: Single consolidated signal, same rationale as Execution Gap. Archetypes: The Uncertain Mirror / The Overloaded / The Hesitant Investor.
- **Consent mechanism**: Folded into existing coaching-engagement paperwork, not a digital consent screen.

### Testimonials

- **Story structure**: Before / Shift / After open narrative fields — no fixed-choice question set, no category scoring.
- **Band replacement**: Stage (retired 3-tier: Awakening/Dreaming/Phoenix Momentum) replaced by client's real Clarity Band — never a new Friction Vector tag, and not both.
- **Matching engine**: Hybrid — auto-matched from client's own historical Clarity submissions by email where found; falls back to self-reported dropdown where not. Every Band tagged bandSource: "verified" or "self-reported".
- **Band movement (before/after)**: Shown only when bandSource is "verified" for both points — 2+ matching Clarity submissions on file, earliest vs. most recent.
- **Show My Band**: Opt-out, checked by default alongside Consent to Publish — client can suppress public display even with verified match; data still stored internally.
- **Consent notice**: Updated to disclose email field is also used server-side for Clarity-record Band matching — never displayed publicly.

### Dashboard

- **Architecture rule**: One console, 4 tabs (Clarity/Readiness/Execution/Testimonials), each showing that tool's own outputs in its own terms — never blended.
- **Data layer**: Corrected scoring/Band/Position/Friction Vector/Growth Edge read from each tool's own corrected data layer — Phase 1 of the build.
- **Client Segmentation**: Federal / Corporate / Individual Executive. Captured on pre-intake form of all 4 tools.
- **Testimonial Matching Engine**: Tier 1 = same Segment + exact Band. Tier 2 = exact Band, any Segment. Tier 3 = adjacent Band, any Segment. Zero-match empty state. bandSource always shown on matched cards.
- **Full Response Record (NEW)**: Client Detail dropdown, per record: Coach View (every question numbered, grouped by real category) and Client Email View (renders corrected outbound email — Clarity only; Execution/Readiness show "not yet built" state).
- **Third-party integrations**: Kit and Acuity are real current operations; Stan Store is potential/future. This build only ships a static "View Booking" convenience-link placeholder.
- **PDF export**: @react-pdf/renderer recommended over window.print() for Module 3's board-ready export (polish-tier, not blocking).

## Cross-Cutting: Security & Data Handling

1. **Rotate the exposed admin credential** (phoenix@gmail.com / phoenix2026) in Supabase now — independent of all other sequencing.
2. **Confirm Row Level Security** is enabled on all 4 Supabase tables with policies matching who should read/write each one — must be checked directly in Supabase dashboard.
3. **Move Readiness/Execution access gating server-side** (reuse real Supabase Auth session behind /dashboard, or short-lived server-issued token) instead of current hardcoded client-side strings.
4. **Add formula-injection protection** to every CSV export (Clarity, Readiness, Execution, Testimonials, Dashboard segmented exports) — prefix any cell value starting with =, +, -, or @ with a leading apostrophe.
5. **Delete dead legacy files** (Admin.jsx, db.js, db/index.js) — unrouted, would crash if rendered, and still carry the leaked password.
6. **Confirm repo is set back to private** once credential rotation is complete.

## Recommended Build Sequence

1. Security P0s first, independent of everything else — rotate the admin credential, confirm RLS, move access gating server-side.
2. Clarity data-layer corrections (scoring model, reverse-scoring, response scale, consent notice, narrative-lookup fix) — everything downstream depends on this being right first.
3. Position, Friction Vector, Growth Edge implementation, using the now-corrected data layer.
4. Readiness and Execution corrections (percentage mislabel, silent-failure handling) — can run in parallel with step 3.
5. Testimonials Band-matching engine — depends on Clarity's corrected Band data existing to match against.
6. Dashboard data layer — read from now-corrected outputs of steps 2–5.
7. Dashboard UI modules — Cohort Intelligence Bar, Record List, Client Detail Inspection Panel (including Full Response Record dropdown), Export & Segmentation.
8. Client Segmentation field on all 4 pre-intake forms + corresponding consent notice updates.
9. Testimonial Matching Engine UI — depends on step 5's Band data and step 8's Segment data both existing.
10. Outbound email correction — corrected buildEmailHTML()/buildEmailText() so future Clarity clients receive the corrected report. Can run any time after step 3.
11. Polish tier: @react-pdf/renderer board-ready export, CSV formula-injection protection, dead-code deletion, placeholder-copy replacement.
12. Third-party integrations (Kit/Acuity/Stan Store) — explicitly a separate project, sequenced to start only after this entire build is complete.

## Appendix A: Source Documents

Every locked spec, PRD, diagram, and audit this project produced. Go to these for anything this summary compressed.

**Clarity**
- Master Developer Fix List — authoritative source for every Clarity + security/Readiness/Execution/Admin fix, including full implementation-ready pseudocode for scoring, Position, and Friction Vector.
- Clarity Final Build Specification — locked architecture: bands, categories, Position, Friction Vector, Growth Edge, CSV schema.
- Clarity PRD — personas, success metrics, release phasing.

**Execution**
- Execution Final Build Spec — locked architecture, category scoring, Execution Gap, Program Checkpoint field, CSV schema.
- Execution PRD, Developer Workflow diagram, Coach/Client Journey guide.

**Readiness**
- Readiness Final Build Spec — locked architecture, category scoring, Readiness Gap, coach-entered consent mechanism, CSV schema.
- Readiness PRD, Developer Workflow diagram, Coach/Client Journey guide.

**Testimonials**
- Testimonials Final Build Spec — locked Band-matching engine, Show My Band opt-out, Band movement tracking, consent notice.
- Testimonials PRD.

**Dashboard**
- Phoenix Dashboard System Audit & Gap Analysis — 11 findings comparing original Gemini technical draft against every locked spec.
- Phoenix Dashboard Final Build Spec (Locked v2) — full architecture: data layer, Segmentation, Testimonial Matching Engine, UI modules, integrations.
- Build Spec Addendum 1 — Kit-vs-Resend clarification, outbound-email finding, Full Response Record module spec.
- Interactive Dashboard.jsx mockup — high-fidelity browser-tested reference for corrected UI, including Full Response Record dropdown.
- Consent Notice Addendum — exact before/insert/after consent-copy changes for Segment, across all 4 tools.
- Dashboard PRD, Developer Workflow diagram, Coach/Admin Guide.
