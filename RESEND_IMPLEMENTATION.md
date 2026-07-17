# Resend Email + Supabase Edge Function Implementation Guide

## Step 1: Install/Link Supabase CLI

```bash
# Install Supabase CLI globally (if not already installed)
npm install -g supabase

# Link your project to Supabase
supabase link --project-ref YOUR_PROJECT_REF

# You'll be prompted to enter your Supabase database password
```

**Get PROJECT_REF:** Visit [Supabase Dashboard](https://app.supabase.com) → Select project → Settings → General → Project Ref

---

## Step 2: Verify Edge Function Files

Check that the following files exist in your project:

```
supabase/
├── functions/
│   ├── send-email/
│   │   └── index.ts
│   └── _shared/
│       └── cors.ts
```

These were already created by the implementation.

---

## Step 3: Set the RESEND_API_KEY Secret (Local Development)

For **local testing**, create a `.env.local` file in your `supabase/` directory:

```bash
# Create the secrets file
echo "RESEND_API_KEY=YOUR_RESEND_API_KEY" > supabase/.env.local
```

Get your Resend API key from [Resend Dashboard](https://resend.com/api-keys)

---

## Step 4: Set the RESEND_API_KEY Secret (Production)

For **production deployment**, set the secret in Supabase:

```bash
# Set the secret in your online Supabase environment
supabase secrets set RESEND_API_KEY=YOUR_RESEND_API_KEY
```

This will be encrypted and stored securely in your Supabase project.

---

## Step 5: Deploy the Edge Function

```bash
# Deploy the send-email function to production
supabase functions deploy send-email
```

**Output example:**
```
✓ Function "send-email" deployed successfully to version: 12345
REST API URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email
```

Save the REST API URL for reference.

---

## Step 6: Test Locally (Optional)

```bash
# Start local Supabase environment
supabase start

# In another terminal, test the function
curl -X POST http://localhost:54321/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello World</h1>"
  }'
```

---

## Step 7: Use in React Component

Import and use the `useResendEmail` hook:

```tsx
import { useResendEmail } from "./hooks/useResendEmail";

export function EmailForm() {
  const { loading, success, error, sendEmail, reset } = useResendEmail();

  const handleSend = async () => {
    const response = await sendEmail({
      to: "recipient@example.com",
      subject: "Welcome",
      html: "<h1>Welcome to our app!</h1>",
    });

    if (response?.success) {
      console.log("Email sent!", response.messageId);
    }
  };

  return (
    <div>
      <button onClick={handleSend} disabled={loading}>
        {loading ? "Sending..." : "Send Email"}
      </button>
      {success && <p>✓ Email sent successfully!</p>}
      {error && <p style={{ color: "red" }}>✗ Error: {error}</p>}
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

---

## Summary of Components

| File                                    | Purpose                          |
| --------------------------------------- | -------------------------------- |
| `supabase/functions/send-email/index.ts` | Deno/TypeScript Edge Function    |
| `supabase/functions/_shared/cors.ts`     | CORS headers utility             |
| `src/hooks/useResendEmail.ts`            | React custom hook                |

---

## Troubleshooting

**Issue: "RESEND_API_KEY not configured"**
- Ensure you've set the secret via `supabase secrets set`
- For local development, check `.env.local` exists in `supabase/` folder

**Issue: CORS errors from browser**
- The edge function automatically handles CORS
- Verify the function is deployed with `supabase functions list`

**Issue: Function returns 404**
- Ensure deployment succeeded: `supabase functions deploy send-email`
- Check function name matches exactly: `send-email`

**Issue: "Missing required fields"**
- Ensure your payload includes `to`, `subject`, and `html`
- Optional fields: `from`, `replyTo`, `text`

---

## Production Checklist

- [ ] RESEND_API_KEY secret set in Supabase
- [ ] Edge function deployed: `supabase functions deploy send-email`
- [ ] Supabase environment variables in `.env.production.local`
- [ ] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in `.env.production.local`
- [ ] Tested email sending from React component
- [ ] Error handling tested in UI
- [ ] From email address validated with Resend

---

## Email Payload Reference

```typescript
interface EmailPayload {
  to: string | string[];              // Required: recipient email(s)
  subject: string;                    // Required: email subject
  html: string;                       // Required: HTML body
  from?: string;                      // Optional: sender (defaults to noreply@yourdomain.com)
  replyTo?: string;                   // Optional: reply-to address
  text?: string;                      // Optional: plain text fallback
}
```

**Example:**
```tsx
await sendEmail({
  to: ["user@example.com", "admin@example.com"],
  subject: "New User Registration",
  html: "<h1>Welcome!</h1><p>Thanks for signing up.</p>",
  replyTo: "support@example.com",
});
```
