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
import { vehicleSchema } from "@/lib/validation/request";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Vehicle } from "@/types";

type FieldErrors = Partial<Record<"make" | "model" | "year" | "plate" | "note", string>>;
const EMPTY = { make: "", model: "", year: "", plate: "", note: "" };

export default function VehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const [values, setValues] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "vehicles"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setVehicles(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Vehicle, "id">) })));
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

  function startEdit(v: Vehicle) {
    setEditingId(v.id ?? null);
    setValues({
      make: v.make,
      model: v.model,
      year: String(v.year),
      plate: v.plate ?? "",
      note: v.note ?? "",
    });
    setFieldErrors({});
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !user) return;
    setFormError("");
    const parsed = vehicleSchema.safeParse(values);
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        make: fe.make?.[0],
        model: fe.model?.[0],
        year: fe.year?.[0],
        plate: fe.plate?.[0],
        note: fe.note?.[0],
      });
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const payload = {
        make: parsed.data.make,
        model: parsed.data.model,
        year: parsed.data.year,
        plate: parsed.data.plate || null,
        note: parsed.data.note || null,
      };
      if (editingId) {
        await updateDoc(doc(db, "users", user.uid, "vehicles", editingId), payload);
      } else {
        await addDoc(collection(db, "users", user.uid, "vehicles"), {
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
      await deleteDoc(doc(db, "users", user.uid, "vehicles", toDelete.id));
      if (editingId === toDelete.id) resetForm();
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Moja vozila</h1>
        <p className="mt-1 text-sm text-text-dim">Sačuvana vozila ubrzavaju kreiranje zahteva.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">{editingId ? "Izmena vozila" : "Novo vozilo"}</h2>
          <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Marka" value={values.make} onChange={update("make")} error={fieldErrors.make} />
              <Input label="Model" value={values.model} onChange={update("model")} error={fieldErrors.model} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Godište" type="number" inputMode="numeric" value={values.year} onChange={update("year")} error={fieldErrors.year} />
              <Input label="Registracija (opciono)" value={values.plate} onChange={update("plate")} error={fieldErrors.plate} />
            </div>
            <Input label="Napomena (opciono)" placeholder="npr. boja, posebne napomene" value={values.note} onChange={update("note")} error={fieldErrors.note} />

            {formError ? (
              <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{formError}</p>
            ) : null}

            <div className="flex gap-2">
              <Button type="submit" loading={saving}>
                {editingId ? "Sačuvaj izmene" : "Dodaj vozilo"}
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
          <h2 className="text-lg font-semibold">Lista ({vehicles.length})</h2>
          <div className="mt-4 flex flex-col gap-2">
            {loading ? (
              <p className="text-sm text-text-dim">Učitavanje…</p>
            ) : vehicles.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border-soft px-3 py-6 text-center text-sm text-text-faint">
                Još nema sačuvanih vozila.
              </p>
            ) : (
              vehicles.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-lg border border-border-soft bg-bg-2 px-3 py-2.5">
                  <div>
                    <div className="text-sm font-medium">
                      {v.make} {v.model} · {v.year}
                    </div>
                    <div className="font-mono text-xs text-text-faint">
                      {v.plate || "bez registracije"}
                      {v.note ? ` · ${v.note}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(v)} className="text-sm text-text-dim hover:text-text">
                      Izmeni
                    </button>
                    <button onClick={() => setToDelete(v)} className="text-sm text-text-dim hover:text-danger">
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
        title="Obrisati vozilo?"
        description={toDelete ? `${toDelete.make} ${toDelete.model} · ${toDelete.year}` : ""}
        confirmLabel="Obriši"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
