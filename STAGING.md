# Test (staging) environment

This setup gives a private, online copy of the platform for testing the home page, the Clarity assessment, the summary email, the coach dashboard and the full-report PDF. It does not touch live client data or the live site.

| Service | Live | Test |
|---|---|---|
| Supabase | current project | **new project** "phoenix-staging" (free tier) |
| Vercel | Production deployment | **Preview deployment** of a `staging` branch |
| Resend | same account | same account, test recipients only |

## 1. Supabase — new staging project

1. supabase.com → **New project** → name it `phoenix-staging` → set a database password → create.
2. **SQL Editor → New query** → paste all of `supabase/staging_setup.sql` → **Run**. This creates the four tables, every security policy and the private `clarity-reports` storage bucket.
3. **Authentication → Users → Add user**: create a test coach login (e.g. `coach-test@yourdomain.com`) with a new password. Tick *Auto confirm*.
4. Back in the SQL Editor, run the last statement of `staging_setup.sql` (uncommented, with that email) to make the user an admin.
5. **Edge Functions → Secrets** — add:
   - `RESEND_API_KEY` — a Resend API key (see step 3 below)
   - `RESEND_FROM_EMAIL` — e.g. `Phoenix Clear Insight <noreply@your-verified-domain>` (omit until a domain is verified)
6. **Edge Functions → Deploy a new function → Via editor**, once per function, pasting the file contents:
   - `send-email` ← `supabase/functions/send-email/index.ts` — then in its settings turn **off** "Verify JWT" (the public assessment calls it).
   - `release-clarity-report` ← `supabase/functions/release-clarity-report/index.ts` — keep **Verify JWT on**.
7. **Project Settings → API**: copy the **Project URL** and the **anon public** key for step 2.

## 2. Vercel — preview deployment

1. Get this code onto a `staging` branch of `VHurst-Phoenix/assessment` (needs Git, or GitHub's web upload).
2. Vercel → the existing project → **Settings → Environment Variables**. Add these with **only "Preview" ticked** so production is unaffected:
   - `VITE_SUPABASE_URL` = staging Project URL
   - `VITE_SUPABASE_ANON_KEY` = staging anon key
   - `VITE_RESEND_FROM_EMAIL` = same value as `RESEND_FROM_EMAIL` (optional)
   - **Do not** set `VITE_RESEND_API_KEY` — anything prefixed `VITE_` is visible in the browser.
3. Push to `staging`; Vercel builds a preview URL (shown on the deployment and in GitHub). Preview URLs are protected by Vercel login by default — use **Share** on the deployment to give Veta a link.

## 3. Resend

- Create an API key (resend.com → API Keys) for the staging secret above.
- Without a verified domain, Resend only delivers to **the Resend account owner's own email**. Either take the assessment with that address, or verify a domain/subdomain (resend.com → Domains) and set `RESEND_FROM_EMAIL`.

## 4. What to test on the preview URL

- [ ] Home page loads; `/assessment/clarity` loads directly (refresh works — `vercel.json` rewrite).
- [ ] Consent notice must be ticked before Question 1; all 25 questions use Strongly Disagree → Strongly Agree.
- [ ] Results page shows score, Band, Band intro and only the *names* of Position / Friction Vector / Growth Edge, plus Intensive and Discovery buttons.
- [ ] Summary email arrives (subject "Your Phoenix Clarity Assessment Summary"); booking links open the right Acuity pages.
- [ ] `/login` with the test coach → dashboard shows the record with Band, Position, Friction Vector, Growth Edge, Position matrix, matched stories and full response record.
- [ ] **Download full report (PDF)** from the side panel and from the record page.
- [ ] Record page: **Generate & store PDF → Open stored PDF → Release to client** — the report email arrives with the PDF attached and the status shows "Released".
- [ ] Dashboard CSV export has the Build Spec §9 columns.

## Promoting to live (later)

Apply the new migrations to the live Supabase project in order (`20261014120000…`, `20261014130000…`) **before** merging to the production branch, and deploy `release-clarity-report` there too. Otherwise live Clarity submissions will be rejected by the consent-version check.
