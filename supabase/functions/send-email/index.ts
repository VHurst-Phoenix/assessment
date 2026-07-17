import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  text?: string;
  bcc?: string | string[];
  cc?: string | string[];
}

interface ResendResponse {
  id?: string;
  error?: string;
  message?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse incoming request body
    const emailPayload: EmailRequest = await req.json();

    // Validate required fields
    if (!emailPayload.to || !emailPayload.subject || !emailPayload.html) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: to, subject, html",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Retrieve Resend credentials from Supabase secrets
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({
          error:
            "Email service not configured. Set RESEND_API_KEY in Supabase Edge Function secrets.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const defaultFrom =
      Deno.env.get("RESEND_FROM_EMAIL") ||
      "Phoenix Clear Insight <onboarding@resend.dev>";

    // Prepare Resend API request payload
    const resendPayload = {
      from: emailPayload.from || defaultFrom,
      to: emailPayload.to,
      subject: emailPayload.subject,
      html: emailPayload.html,
      ...(emailPayload.text && { text: emailPayload.text }),
      ...(emailPayload.replyTo && { reply_to: emailPayload.replyTo }),
      ...(emailPayload.bcc && { bcc: emailPayload.bcc }),
      ...(emailPayload.cc && { cc: emailPayload.cc }),
    };

    // Make request to Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    // Parse Resend response
    const resendData: ResendResponse = await resendResponse.json();

    // Check for errors from Resend
    if (!resendResponse.ok) {
      console.error("Resend API error:", resendData);
      const rawMsg =
        resendData.message ||
        resendData.error ||
        "Failed to send email";
      const hint =
        resendResponse.status === 403 &&
        rawMsg.includes("verify a domain")
          ? " Verify phoenixclearinsight.com at https://resend.com/domains."
          : "";
      return new Response(
        JSON.stringify({
          error: rawMsg + hint,
        }),
        {
          status: resendResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        messageId: resendData.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});