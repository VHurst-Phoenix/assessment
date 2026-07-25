import { useState, useCallback } from "react";
import { env } from "../config/env.js";
import { sendEmail as sendEmailWithFallback } from "../lib/resendClient.js";

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  bcc?: string | string[];
  cc?: string | string[];
  text?: string;
}

interface EmailResponse {
  success?: boolean;
  messageId?: string;
  error?: string;
}

interface UseResendEmailReturn {
  loading: boolean;
  success: boolean;
  error: string | null;
  sendEmail: (payload: EmailPayload) => Promise<EmailResponse | null>;
  reset: () => void;
}

export const useResendEmail = (): UseResendEmailReturn => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = useCallback(async (payload: EmailPayload) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await sendEmailWithFallback({
        ...payload,
        from: payload.from || env.resendFromEmail || undefined,
      });

      if (result.error) {
        console.error("Email delivery failed:", result.error);
        setError(result.error);
        return null;
      }

      setSuccess(true);
      return (result.data || null) as EmailResponse | null;
    } catch (err) {
      console.error("Email delivery exception:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to send email";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setSuccess(false);
    setError(null);
  }, []);

  return {
    loading,
    success,
    error,
    sendEmail,
    reset,
  };
};
