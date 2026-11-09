"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "40px", textAlign: "center" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "12px" }}>Something went wrong!</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>Please try again, or go back to the homepage.</p>
        <button
          onClick={() => reset()}
          style={{ background: "#000", color: "#fff", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", marginRight: "10px" }}
        >
          Try again
        </button>
        <a href="/" style={{ color: "#000", textDecoration: "underline" }}>Go home</a>
      </body>
    </html>
  );
}
