"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { loginSchema } from "@/lib/validation/auth";
import { mapAuthError } from "@/lib/auth/errors";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return; // idempotentnost: nema dvostrukog slanja
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
      // Preusmeravanje radi (auth)/layout kad AuthProvider učita ulogu.
    } catch (err) {
      setFormError(mapAuthError(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-7 flex items-center gap-3">
        <span className="brand-mark">A</span>
        <span className="font-display text-lg font-bold tracking-tight">Auto Concierge</span>
      </div>

      <Card>
        <h1 className="text-xl font-semibold">Prijava</h1>
        <p className="mt-1 text-sm text-text-dim">Dobrodošli nazad.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
          />
          <Input
            label="Lozinka"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />

          {formError ? (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          ) : null}

          <Button type="submit" fullWidth loading={submitting}>
            Prijavi se
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-text-faint">
          <span className="h-px flex-1 bg-border-soft" />
          ili
          <span className="h-px flex-1 bg-border-soft" />
        </div>

        <OAuthButtons onError={setFormError} />
      </Card>

      <p className="mt-5 text-center text-sm text-text-dim">
        Nemate nalog?{" "}
        <Link href="/register" className="text-brass-soft hover:underline">
          Registrujte se
        </Link>
      </p>
    </div>
  );
}
