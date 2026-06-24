"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { createDriverCallable } from "@/lib/auth/callables";
import { createUserSchema } from "@/lib/validation/auth";
import { mapAuthError } from "@/lib/auth/errors";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { UserProfile } from "@/types";

type FieldErrors = Partial<Record<"fullName" | "email" | "phone" | "password", string>>;
const EMPTY = { fullName: "", email: "", phone: "", password: "" };

export default function DispatcherDriversPage() {
  const [values, setValues] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const [drivers, setDrivers] = useState<UserProfile[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "driver"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<UserProfile, "uid">) }));
        rows.sort((a, b) => a.fullName.localeCompare(b.fullName, "sr"));
        setDrivers(rows);
        setLoadingDrivers(false);
      },
      () => setLoadingDrivers(false),
    );
    return () => unsub();
  }, []);

  function update(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError("");
    setTempPassword(null);

    const parsed = createUserSchema.safeParse(values);
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
      const res = await createDriverCallable({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        password: parsed.data.password || undefined,
      });
      setValues(EMPTY);
      setTempPassword(res.data.tempPassword ?? null);
    } catch (err) {
      setFormError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Vozači</h1>
        <p className="mt-1 text-sm text-text-dim">Kreirajte naloge vozača i pregledajte ekipu.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Novi vozač</h2>
          <p className="mt-1 text-sm text-text-dim">
            Ako lozinku ostavite praznu, generišemo privremenu koju prosleđujete vozaču.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
            <Input label="Ime i prezime" value={values.fullName} onChange={update("fullName")} error={fieldErrors.fullName} />
            <Input label="Email" type="email" value={values.email} onChange={update("email")} error={fieldErrors.email} />
            <Input label="Telefon" type="tel" placeholder="06x xxx xxxx" value={values.phone} onChange={update("phone")} error={fieldErrors.phone} />
            <Input
              label="Lozinka (opciono)"
              type="text"
              placeholder="ostavite prazno za automatsku"
              value={values.password}
              onChange={update("password")}
              error={fieldErrors.password}
            />

            {formError ? (
              <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                {formError}
              </p>
            ) : null}

            {tempPassword ? (
              <div className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
                Vozač kreiran. Privremena lozinka:{" "}
                <span className="font-mono font-semibold text-text">{tempPassword}</span>
              </div>
            ) : null}

            <Button type="submit" loading={submitting}>
              Kreiraj vozača
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Ekipa ({drivers.length})</h2>
          <div className="mt-4 flex flex-col gap-2">
            {loadingDrivers ? (
              <p className="text-sm text-text-dim">Učitavanje…</p>
            ) : drivers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border-soft px-3 py-6 text-center text-sm text-text-faint">
                Još nema vozača.
              </p>
            ) : (
              drivers.map((d) => (
                <div
                  key={d.uid}
                  className="flex items-center justify-between rounded-lg border border-border-soft bg-bg-2 px-3 py-2.5"
                >
                  <div>
                    <div className="text-sm font-medium">{d.fullName}</div>
                    <div className="font-mono text-xs text-text-faint">
                      {d.phone} · {d.email}
                    </div>
                  </div>
                  <button
                    onClick={() => updateDoc(doc(db, "users", d.uid), { isActive: d.isActive === false })}
                    title="Promeni status"
                  >
                    <Badge className={d.isActive === false ? "" : "text-mint"}>
                      {d.isActive === false ? "neaktivan" : "aktivan"}
                    </Badge>
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
