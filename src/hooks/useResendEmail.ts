import { useState, useCallback } from "react";
import { getSupabaseClient } from "../lib/supabaseClient";
import { env } from "../config/env";

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
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

    const { client, error: clientError } = getSupabaseClient();
    if (!client) {
      const message = clientError || "Supabase is not configured.";
      setError(message);
      return null;
    }

    try {
      const { data, error: invokeError } = await client.functions.invoke<EmailResponse>(
        "send-email",
        {
          body: {
            ...payload,
            from: payload.from || env.resendFromEmail || undefined,
          },
        }
      );

      if (invokeError) {
        console.error("Supabase send-email function invocation error details:", invokeError);
        throw new Error(invokeError.message);
      }

      if (data?.error) {
        console.error("Supabase send-email function returned error:", data.error);
        throw new Error(data.error);
      }

      setSuccess(true);
      return data || null;
    } catch (err) {
      console.error("Supabase send-email function invocation exception:", err);
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
