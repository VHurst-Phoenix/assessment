# Share Your Story — build request v1.2: progress tracker (Section 7)

Every item is built and tested on branch `feature/testimonial-form-v1.2` as of 2026-11-16. It goes live once the database script has been run and the pull request merged. Six items carry a flag for Veta.

| Item | Status | Flag | Date completed | Notes |
|---|---|---|---|---|
| P1 Consent notice and checkbox | Done | None | 2026-11-16 | Section 5 wording, placed directly above Submit. The box starts empty, and submission is blocked until it's ticked. Stores `consent_timestamp` and `consent_version` = "Consent v3, 2026-11". The database also refuses any story without consent. |
| P2 Story prompts | Done | None | 2026-11-16 | Section 4 labels, helper text and placeholders, plus the required one-sentence quote (300 characters max). "Two to four sentences each is plenty." sits under the fields. |
| P3 Name display, uses, Band default | Done | None | 2026-11-16 | Three name options, default Anonymous. Five where-used checkboxes. "Show my Clarity Band" starts unticked. |
| M1 | Done | None | 2026-11-16 | One heading and one subtitle (the duplicate card heading was removed). |
| M2 | Done | None | 2026-11-16 | |
| M3 | Done | None | 2026-11-16 | |
| M4 | Done | None | 2026-11-16 | |
| M5 | Done | None | 2026-11-16 | Required dropdown; internal only (never on the public card). |
| M6 | Done | Question | 2026-11-16 | See question 1 below. |
| M7 | Done | None | 2026-11-16 | Kept for sorting; confirmed never on the public card. |
| M8 | Done | None | 2026-11-16 | |
| M9 | Done | None | 2026-11-16 | Sits next to the consent notice, unticked. |
| M10 | Done | None | 2026-11-16 | Radio buttons; default Anonymous. |
| M11 | Done | Question | 2026-11-16 | None of the boxes is required. See question 2 below. |
| M12 | Done | Question | 2026-11-16 | Required, with no default. See question 3 below. |
| M13 | Done | None | 2026-11-16 | |
| M14 | Done | Enhancement or improvement | 2026-11-16 | Saved with the story and shown to the coach as "Story call requested" (dashboard and CSV). No email alert to Veta yet. See enhancement 1 below. |
| M15 | Done | None | 2026-11-16 | |
| M16 | Done | None | 2026-11-16 | The button looks disabled until consent is ticked; clicking it explains why. |
| C1 | Done | Enhancement or improvement | 2026-11-16 | Build note removed. A "New" badge also still shows next to "Segment" on the Clarity form; I can remove it too. |
| C2 | Done | None | 2026-11-16 | Space kept between "Phoenix" and "Clarity" in the heading. |
| V1 | Done | None | 2026-11-16 | It wasn't running before: every Band was self-reported. The database now matches the email to Clarity results on every submission. A match is marked "verified", and Band movement is recorded only with 2+ Clarity results. |
| V2 | Done | None | 2026-11-16 | There was no protection before. Now: at most 3 stories per email per 24 hours (enforced in the database), plus a hidden honeypot field for bots. There's no CAPTCHA. |
| V3 | Done | None | 2026-11-16 | There was only Pending Review, Approved and Rejected, with no timestamps. Now: Pending Review, Approved, Rejected, Removal Requested and Removed, each change timestamped by the database. |
| V4 | Done | None | 2026-10-14 | Already in place: cells starting with `=`, `+`, `-` or `@` are neutralised. |
| V5 | Done | Issue | 2026-11-16 | Band movement was never on the card. But the Client Stories page couldn't show any story, and it would have loaded every field, email included. See issue 1 below. |
| CSV columns | Done | Question | 2026-11-16 | Added: Engagement Type, Story Type, Name Display, Permitted Uses (only the ticked ones), Edit Choice, Story-Call Request, consent fields and statuses. See question 4 below. |

## General questions, blockers or ideas

| Date | Question, blocker or idea | Veta's answer |
|---|---|---|
| 2026-11-16 | **Question 1 (M6).** Hiding the Band dropdowns when the server finds a match needs a lookup before submission. That would let anyone type an email and learn whether that person has taken the Clarity Assessment. I built it without that: the dropdowns always show, labelled "If you've taken the Clarity Assessment with this email, we'll use your actual results instead." The server replaces them with verified results when it finds a match. OK to keep? | |
| 2026-11-16 | **Question 2 (M11).** Should at least one placement be required? With none ticked, an approved story can't appear anywhere. | |
| 2026-11-16 | **Question 3 (M12).** Is it OK for the editing choice to be required with no default? | |
| 2026-11-16 | **Question 4 (CSV).** Please send the testimonial tracker's column order, and I'll match the CSV to it exactly so rows copy straight across. | |
| 2026-11-16 | **Question 5 (acceptance item 5).** "Assessment only" stories are flagged as Feedback and kept off the Client Stories page. Should they also be kept out of social media, sales and case-study use? | |
| 2026-11-16 | **Issue 1 (V5).** The Client Stories page couldn't show any story: visitors were never allowed to read the stories table, so it always said "No stories available yet". It now reads through a database function that returns only approved, consented stories cleared for the page, with only the public fields. | |
| 2026-11-16 | **Issue 2 (existing stories).** No story submitted before this build has consent on file, so none can be published, as the request notes. Do you want to email past submitters a link to resubmit with consent? | |
| 2026-11-16 | **Enhancement 1 (M14).** Email Veta automatically when someone asks to tell their story in a call. | |

## How it goes live

1. Run `supabase/migrations/20261117120000_testimonial_form_v1_2.sql` in the live Supabase SQL Editor. It adds the columns, matching, rate limit, statuses and the public-stories function, and changes no existing rows.
2. Merge the pull request (Vercel deploys it).
3. Veta tests against the Section 8 acceptance checklist.

Step 1 must come first. Without it, the new form's submissions are refused, and the Client Stories page shows an error instead of an empty list.
