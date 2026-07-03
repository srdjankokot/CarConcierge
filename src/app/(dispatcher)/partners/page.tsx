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
import { SERVICE_TYPE_LABEL, SERVICE_TYPE_OPTIONS } from "@/lib/constants";
import { VEHICLE_MAKES } from "@/lib/vehicles";
import { partnerSchema } from "@/lib/validation/dispatch";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";
import type { Partner, ServiceType } from "@/types";

type FieldErrors = Partial<Record<"name" | "address" | "phone" | "serviceTypes", string>>;
const EMPTY = { name: "", address: "", phone: "", note: "" };

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  const [values, setValues] = useState(EMPTY);
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Partner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<ServiceType | "all">("all");
  const [activeOnly, setActiveOnly] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "partners"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPartners(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Partner, "id">) })));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  function update(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  function toggleType(t: ServiceType) {
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function toggleMake(m: string) {
    setMakes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  function resetForm() {
    setValues(EMPTY);
    setTypes([]);
    setMakes([]);
    setIsActive(true);
    setEditingId(null);
    setFieldErrors({});
    setFormError("");
  }

  function startEdit(p: Partner) {
    setEditingId(p.id ?? null);
    setValues({ name: p.name, address: p.address, phone: p.phone, note: p.note ?? "" });
    setTypes(p.serviceTypes ?? []);
    setMakes(p.makes ?? []);
    setIsActive(p.isActive !== false);
    setFieldErrors({});
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setFormError("");
    const parsed = partnerSchema.safeParse({ ...values, serviceTypes: types, makes });
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        name: fe.name?.[0],
        address: fe.address?.[0],
        phone: fe.phone?.[0],
        serviceTypes: fe.serviceTypes?.[0],
      });
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const payload = {
        name: parsed.data.name,
        address: parsed.data.address,
        phone: parsed.data.phone,
        serviceTypes: parsed.data.serviceTypes,
        makes: parsed.data.serviceTypes.includes("service") ? (parsed.data.makes ?? []) : [],
        note: parsed.data.note || null,
        isActive,
      };
      if (editingId) {
        await updateDoc(doc(db, "partners", editingId), payload);
      } else {
        await addDoc(collection(db, "partners"), { ...payload, createdAt: serverTimestamp() });
      }
      resetForm();
    } catch {
      setFormError("Čuvanje nije uspelo. Pokušajte ponovo.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete?.id) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "partners", toDelete.id));
      if (editingId === toDelete.id) resetForm();
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = partners.filter((p) => {
    if (activeOnly && p.isActive === false) return false;
    if (filterType !== "all" && !(p.serviceTypes ?? []).includes(filterType)) return false;
    if (search.trim() && !`${p.name} ${p.address} ${p.phone}`.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Partneri</h1>
        <p className="mt-1 text-sm text-text-dim">Mreža servisera koju nudite klijentima u ponudi.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <Card className="lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">{editingId ? "Izmena partnera" : "Novi partner"}</h2>
          <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
            <Input label="Naziv" value={values.name} onChange={update("name")} error={fieldErrors.name} />
            <Input label="Adresa" value={values.address} onChange={update("address")} error={fieldErrors.address} />
            <Input label="Telefon" type="tel" value={values.phone} onChange={update("phone")} error={fieldErrors.phone} />

            <div>
              <span className="label">Tipovi usluga</span>
              <div className="flex flex-wrap gap-2">
                {SERVICE_TYPE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggleType(o.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                      types.includes(o.value)
                        ? "border-accent text-text"
                        : "border-border-soft text-text-dim hover:text-text",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {fieldErrors.serviceTypes ? <p className="field-error">{fieldErrors.serviceTypes}</p> : null}
            </div>

            {types.includes("service") ? (
              <div>
                <span className="label">
                  Marke koje servisira <span className="text-text-faint">(prazno = sve marke)</span>
                </span>
                <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg border border-border-soft p-2">
                  {VEHICLE_MAKES.map((m) => (
                    <button
                      key={m.make}
                      type="button"
                      onClick={() => toggleMake(m.make)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                        makes.includes(m.make) ? "border-accent text-text" : "border-border-soft text-text-dim hover:text-text",
                      )}
                    >
                      {m.make}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <Input label="Napomena (opciono)" value={values.note} onChange={update("note")} />

            <label className="flex items-center gap-2 text-sm text-text-dim">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Aktivan
            </label>

            {formError ? (
              <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{formError}</p>
            ) : null}

            <div className="flex gap-2">
              <Button type="submit" loading={saving}>
                {editingId ? "Sačuvaj izmene" : "Dodaj partnera"}
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
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Mreža</h2>
            <span className="font-mono text-xs text-text-faint">{filtered.length}/{partners.length}</span>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pretraga: naziv, adresa, telefon…"
              className="input"
            />
            <div className="flex flex-wrap gap-2">
              {[{ value: "all", label: "Sve" }, ...SERVICE_TYPE_OPTIONS].map((o) => {
                const on = filterType === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setFilterType(o.value as ServiceType | "all")}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                      on ? "border-accent text-text" : "border-border-soft text-text-dim hover:text-text",
                    )}
                  >
                    {o.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setActiveOnly((v) => !v)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                  activeOnly ? "border-mint text-mint" : "border-border-soft text-text-dim hover:text-text",
                )}
              >
                Samo aktivni
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 overflow-y-auto pr-1" style={{ maxHeight: "calc(100dvh - 300px)" }}>
            {loading ? (
              <p className="text-sm text-text-dim">Učitavanje…</p>
            ) : partners.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border-soft px-3 py-6 text-center text-sm text-text-faint">
                Još nema partnera.
              </p>
            ) : filtered.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border-soft px-3 py-6 text-center text-sm text-text-faint">
                Nema rezultata za ovaj filter.
              </p>
            ) : (
              filtered.map((p) => (
                <div key={p.id} className="rounded-lg border border-border-soft bg-bg-2 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="flex items-center gap-2">
                      <Badge className={p.isActive === false ? "" : "text-mint"}>
                        {p.isActive === false ? "neaktivan" : "aktivan"}
                      </Badge>
                      <button onClick={() => startEdit(p)} className="text-sm text-text-dim hover:text-text">
                        Izmeni
                      </button>
                      <button onClick={() => setToDelete(p)} className="text-sm text-text-dim hover:text-danger">
                        Obriši
                      </button>
                    </div>
                  </div>
                  <div className="mt-0.5 font-mono text-xs text-text-faint">
                    {p.address} · {p.phone}
                  </div>
                  <div className="mt-1 text-xs text-text-dim">
                    {(p.serviceTypes ?? []).map((t) => SERVICE_TYPE_LABEL[t]).join(", ")}
                  </div>
                  {p.makes && p.makes.length ? (
                    <div className="mt-1 text-xs text-text-faint">Servisira: {p.makes.join(", ")}</div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Obrisati partnera?"
        description={toDelete?.name ?? ""}
        confirmLabel="Obriši"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
