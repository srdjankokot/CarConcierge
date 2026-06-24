"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { registerSchema } from "@/lib/validation/auth";
import { completeClientRegistrationCallable } from "@/lib/auth/callables";
import { mapAuthError } from "@/lib/auth/errors";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

type FieldErrors = Partial<Record<"fullName" | "email" | "phone" | "password", string>>;

export default function RegisterPage() {
  const [values, setValues] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return; // idempotentnost
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
      // Deterministički postavi role:'client' + fullName/phone (vidi completeClientRegistration).
      await completeClientRegistrationCallable({
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
      });
      await cred.user.getIdToken(true); // osveži token sa novim claim-om
      // (auth)/layout preusmerava na /home čim AuthProvider učita profil.
    } catch (err) {
      setFormError(mapAuthError(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-7 flex items-center gap-3">
        <span className="brand-mark">A</span>
        <span className="font-display text-lg font-bold tracking-tight">Auto Concierge</span>
      </div>

      <Card>
        <h1 className="text-xl font-semibold">Otvorite nalog</h1>
        <p className="mt-1 text-sm text-text-dim">
          Zakažite preuzimanje i pratite status od početka do kraja.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
          <Input
            label="Ime i prezime"
            autoComplete="name"
            value={values.fullName}
            onChange={update("fullName")}
            error={fieldErrors.fullName}
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={update("email")}
            error={fieldErrors.email}
          />
          <Input
            label="Telefon"
            type="tel"
            inputMode="tel"
            placeholder="06x xxx xxxx"
            autoComplete="tel"
            value={values.phone}
            onChange={update("phone")}
            error={fieldErrors.phone}
          />
          <Input
            label="Lozinka"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={update("password")}
            error={fieldErrors.password}
          />

          {formError ? (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          ) : null}

          <Button type="submit" fullWidth loading={submitting}>
            Otvori nalog
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
        Već imate nalog?{" "}
        <Link href="/login" className="text-brass-soft hover:underline">
          Prijavite se
        </Link>
      </p>
    </div>
  );
}
