"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { loginSchema } from "@/lib/validation/auth";
import { mapAuthError } from "@/lib/auth/errors";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError("");
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setFieldErrors({ email: fe.email?.[0], password: fe.password?.[0] });
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, parsed.data.email, parsed.data.password);
    } catch (err) {
      setFormError(mapAuthError(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="rd-rise" style={{ width: "100%", maxWidth: 400 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 26 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/vale-mark.png" alt="Valé" style={{ width: 168, maxWidth: "70%", height: "auto", display: "block" }} />
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34, letterSpacing: "-1px", lineHeight: 1 }}>
          Valé
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "3px", color: "var(--text-faint)" }}>
          PREMIUM CAR CONCIERGE
        </div>
      </div>

      <div className="glass" style={{ padding: 30 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 25, fontWeight: 700, letterSpacing: "-.6px", margin: "0 0 4px" }}>
          Dobro došli nazad
        </h1>
        <p style={{ color: "var(--text-dim)", fontSize: 14, margin: "0 0 22px" }}>
          Pristupite svojim zahtevima i poslovima.
        </p>

        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <span className="rd-label">Email</span>
            <input
              className={`rd-in${fieldErrors.email ? " rd-in-error" : ""}`}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {fieldErrors.email ? <p className="field-error">{fieldErrors.email}</p> : null}
          </div>
          <div>
            <span className="rd-label">Lozinka</span>
            <input
              className={`rd-in${fieldErrors.password ? " rd-in-error" : ""}`}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {fieldErrors.password ? <p className="field-error">{fieldErrors.password}</p> : null}
          </div>

          {formError ? (
            <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{formError}</p>
          ) : null}

          <button type="submit" className="rd-btn rd-shimmer" style={{ width: "100%", marginTop: 4 }} disabled={submitting}>
            {submitting ? "Prijavljivanje…" : "Prijavi se"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text-faint)", fontSize: 12, margin: "2px 0" }}>
            <span style={{ flex: 1, height: 1, background: "var(--glass-line)" }} /> ili
            <span style={{ flex: 1, height: 1, background: "var(--glass-line)" }} />
          </div>

          <OAuthButtons onError={setFormError} />
        </form>
      </div>

      <p style={{ textAlign: "center", color: "var(--text-faint)", fontSize: 13, marginTop: 18 }}>
        Nemate nalog?{" "}
        <Link href="/register" style={{ color: "var(--brass-soft)" }}>
          Registracija
        </Link>
      </p>
    </div>
  );
}
