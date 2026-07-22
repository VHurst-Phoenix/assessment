import { useState } from "react";
import { useResendEmail } from "../hooks/useResendEmail";

export function EmailDemo() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");

  const { loading, success, error, sendEmail, reset } = useResendEmail();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await sendEmail({
      to,
      subject,
      html,
    });

    if (response?.success) {
      // Clear form on success
      setTo("");
      setSubject("");
      setHtml("");
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px" }}>
      <h2>Send Email</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="to">To:</label>
          <input
            id="to"
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com"
            required
            disabled={loading}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="subject">Subject:</label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            required
            disabled={loading}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="html">HTML Content:</label>
          <textarea
            id="html"
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder="<h1>Hello</h1><p>Your email content here</p>"
            required
            disabled={loading}
            rows={6}
            style={{ width: "100%", padding: "8px", fontFamily: "monospace" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !to || !subject || !html}
          style={{
            padding: "10px 20px",
            backgroundColor: loading ? "#ccc" : "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Sending..." : "Send Email"}
        </button>
      </form>

      {success && (
        <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#d4edda", borderRadius: "4px" }}>
          ✓ Email sent successfully!
          <button
            onClick={reset}
            style={{
              marginLeft: "10px",
              padding: "4px 8px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Send Another
          </button>
        </div>
      )}

      {error && (
        <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f8d7da", borderRadius: "4px", color: "#721c24" }}>
          ✗ Error: {error}
          <button
            onClick={reset}
            style={{
              marginLeft: "10px",
              padding: "4px 8px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
