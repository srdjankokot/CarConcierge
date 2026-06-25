"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { registerSchema } from "@/lib/validation/auth";
import { completeClientRegistrationCallable } from "@/lib/auth/callables";
import { mapAuthError } from "@/lib/auth/errors";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

type FieldErrors = Partial<Record<"fullName" | "email" | "phone" | "password", string>>;

export default function RegisterPage() {
  const [values, setValues] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError("");
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        fullName: fe.fullName?.[0],
        email: fe.email?.[0],
        phone: fe.phone?.[0],
        password: fe.password?.[0],
      });
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, parsed.data.email, parsed.data.password);
      await updateProfile(cred.user, { displayName: parsed.data.fullName });
      await completeClientRegistrationCallable({ fullName: parsed.data.fullName, phone: parsed.data.phone });
      await cred.user.getIdToken(true);
    } catch (err) {
      setFormError(mapAuthError(err));
      setSubmitting(false);
    }
  }

  const FIELDS: { key: keyof typeof values; label: string; type?: string; autoComplete?: string; placeholder?: string }[] = [
    { key: "fullName", label: "Ime i prezime", autoComplete: "name" },
    { key: "email", label: "Email", type: "email", autoComplete: "email" },
    { key: "phone", label: "Telefon", type: "tel", autoComplete: "tel", placeholder: "06x xxx xxxx" },
    { key: "password", label: "Lozinka", type: "password", autoComplete: "new-password" },
  ];

  return (
    <div className="rd-rise" style={{ width: "100%", maxWidth: 420 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 24 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/vale-mark.png" alt="Valé" style={{ width: 140, maxWidth: "60%", height: "auto", display: "block" }} />
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 30, letterSpacing: "-1px", lineHeight: 1 }}>
          Valé
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "3px", color: "var(--text-faint)" }}>
          PREMIUM CAR CONCIERGE
        </div>
      </div>

      <div className="glass" style={{ padding: 30 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 25, fontWeight: 700, letterSpacing: "-.6px", margin: "0 0 4px" }}>
          Otvorite nalog
        </h1>
        <p style={{ color: "var(--text-dim)", fontSize: 14, margin: "0 0 22px" }}>
          Zakažite preuzimanje i pratite status od početka do kraja.
        </p>

        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {FIELDS.map((f) => (
            <div key={f.key}>
              <span className="rd-label">{f.label}</span>
              <input
                className={`rd-in${fieldErrors[f.key] ? " rd-in-error" : ""}`}
                type={f.type ?? "text"}
                autoComplete={f.autoComplete}
                placeholder={f.placeholder}
                value={values[f.key]}
                onChange={update(f.key)}
              />
              {fieldErrors[f.key] ? <p className="field-error">{fieldErrors[f.key]}</p> : null}
            </div>
          ))}

          {formError ? <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{formError}</p> : null}

          <button type="submit" className="rd-btn rd-shimmer" style={{ width: "100%", marginTop: 4 }} disabled={submitting}>
            {submitting ? "Kreiranje…" : "Otvori nalog"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text-faint)", fontSize: 12, margin: "2px 0" }}>
            <span style={{ flex: 1, height: 1, background: "var(--glass-line)" }} /> ili
            <span style={{ flex: 1, height: 1, background: "var(--glass-line)" }} />
          </div>

          <OAuthButtons onError={setFormError} />
        </form>
      </div>

      <p style={{ textAlign: "center", color: "var(--text-faint)", fontSize: 13, marginTop: 18 }}>
        Već imate nalog?{" "}
        <Link href="/login" style={{ color: "var(--brass-soft)" }}>
          Prijavite se
        </Link>
      </p>
    </div>
  );
}
