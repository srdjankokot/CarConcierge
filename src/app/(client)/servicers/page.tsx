"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/useAuth";
import { servicerSchema } from "@/lib/validation/request";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Servicer } from "@/types";

type FieldErrors = Partial<Record<"name" | "address" | "phone", string>>;
const EMPTY = { name: "", address: "", phone: "" };

export default function ServicersPage() {
  const { user } = useAuth();
  const [servicers, setServicers] = useState<Servicer[]>([]);
  const [loading, setLoading] = useState(true);

  const [values, setValues] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Servicer | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "servicers"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setServicers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Servicer, "id">) })));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [user]);

  function update(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  function resetForm() {
    setValues(EMPTY);
    setEditingId(null);
    setFieldErrors({});
    setFormError("");
  }

  function startEdit(s: Servicer) {
    setEditingId(s.id ?? null);
    setValues({ name: s.name, address: s.address, phone: s.phone ?? "" });
    setFieldErrors({});
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !user) return;
    setFormError("");
    const parsed = servicerSchema.safeParse(values);
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setFieldErrors({ name: fe.name?.[0], address: fe.address?.[0], phone: fe.phone?.[0] });
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const payload = {
        name: parsed.data.name,
        address: parsed.data.address,
        phone: parsed.data.phone || null,
      };
      if (editingId) {
        await updateDoc(doc(db, "users", user.uid, "servicers", editingId), payload);
      } else {
        await addDoc(collection(db, "users", user.uid, "servicers"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      resetForm();
    } catch {
      setFormError("Čuvanje nije uspelo. Pokušajte ponovo.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!user || !toDelete?.id) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "users", user.uid, "servicers", toDelete.id));
      if (editingId === toDelete.id) resetForm();
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Moji serviseri</h1>
        <p className="mt-1 text-sm text-text-dim">Sačuvani serviseri se brzo biraju pri kreiranju zahteva.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">{editingId ? "Izmena servisera" : "Novi serviser"}</h2>
          <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
            <Input label="Naziv" value={values.name} onChange={update("name")} error={fieldErrors.name} />
            <Input label="Adresa" value={values.address} onChange={update("address")} error={fieldErrors.address} />
            <Input label="Telefon (opciono)" type="tel" value={values.phone} onChange={update("phone")} error={fieldErrors.phone} />

            {formError ? (
              <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{formError}</p>
            ) : null}

            <div className="flex gap-2">
              <Button type="submit" loading={saving}>
                {editingId ? "Sačuvaj izmene" : "Dodaj servisera"}
              </Button>
              {editingId ? (
                <Button type="button" variant="ghost" onClick={resetForm} disabled={saving}>
                  Otkaži
                </Button>
              ) : null}
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Lista ({servicers.length})</h2>
          <div className="mt-4 flex flex-col gap-2">
            {loading ? (
              <p className="text-sm text-text-dim">Učitavanje…</p>
            ) : servicers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border-soft px-3 py-6 text-center text-sm text-text-faint">
                Još nema sačuvanih servisera.
              </p>
            ) : (
              servicers.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-border-soft bg-bg-2 px-3 py-2.5">
                  <div>
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="font-mono text-xs text-text-faint">
                      {s.address}
                      {s.phone ? ` · ${s.phone}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(s)} className="text-sm text-text-dim hover:text-text">
                      Izmeni
                    </button>
                    <button onClick={() => setToDelete(s)} className="text-sm text-text-dim hover:text-danger">
                      Obriši
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Obrisati servisera?"
        description={toDelete?.name ?? ""}
        confirmLabel="Obriši"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
