"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/useAuth";
import { formatDateTime } from "@/lib/constants";
import { BellIcon } from "@/components/ui/icons";
import { PUSH_CONFIGURED, enablePush, isPushSupported } from "@/lib/notifications/push";
import { cn } from "@/lib/utils";
import type { AppNotification, Role } from "@/types";

function requestPath(role: Role, id: string): string {
  if (role === "client") return `/request/${id}`;
  if (role === "dispatcher") return `/board/${id}`;
  return `/jobs/${id}`;
}

export function NotificationsBell() {
  const { user, role } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [canOfferPush, setCanOfferPush] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(20),
    );
    const unsub = onSnapshot(
      q,
      (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AppNotification, "id">) }))),
      () => {},
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!PUSH_CONFIGURED) return;
    void isPushSupported().then((ok) => {
      if (ok && typeof Notification !== "undefined" && Notification.permission !== "granted") {
        setCanOfferPush(true);
      }
    });
  }, []);

  const unread = items.filter((n) => !n.read).length;

  function markRead(n: AppNotification) {
    if (user && n.id && !n.read) {
      void updateDoc(doc(db, "users", user.uid, "notifications", n.id), { read: true }).catch(() => {});
    }
  }

  function openNotif(n: AppNotification) {
    markRead(n);
    setOpen(false);
    if (role && n.requestId) router.push(requestPath(role, n.requestId));
  }

  async function markAll() {
    if (!user) return;
    await Promise.all(
      items
        .filter((n) => !n.read && n.id)
        .map((n) => updateDoc(doc(db, "users", user.uid, "notifications", n.id!), { read: true }).catch(() => {})),
    );
  }

  async function onEnablePush() {
    if (!user) return;
    setPushBusy(true);
    setPushMsg("");
    const res = await enablePush(user.uid);
    setPushBusy(false);
    if (res.ok) {
      setCanOfferPush(false);
      setPushMsg("Obaveštenja uključena ✓");
    } else {
      setPushMsg(res.reason ?? "Neuspešno.");
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative text-text-dim transition-colors hover:text-text"
        aria-label="Obaveštenja"
      >
        <BellIcon className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-[#11150f]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-card border border-border bg-surface shadow-soft">
            <div className="flex items-center justify-between border-b border-border-soft px-4 py-2.5">
              <span className="text-sm font-semibold">Obaveštenja</span>
              {unread > 0 ? (
                <button onClick={markAll} className="text-xs text-text-dim hover:text-text">
                  Označi sve
                </button>
              ) : null}
            </div>

            {canOfferPush ? (
              <div className="border-b border-border-soft px-4 py-2.5">
                <button onClick={onEnablePush} disabled={pushBusy} className="text-sm text-accent disabled:opacity-50">
                  {pushBusy ? "Uključujem…" : "Uključi push obaveštenja"}
                </button>
                {pushMsg ? <p className="mt-1 text-xs text-text-faint">{pushMsg}</p> : null}
              </div>
            ) : pushMsg ? (
              <div className="border-b border-border-soft px-4 py-2 text-xs text-text-faint">{pushMsg}</div>
            ) : null}

            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-text-faint">Nema obaveštenja.</p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openNotif(n)}
                    className={cn(
                      "block w-full border-b border-border-soft px-4 py-3 text-left transition-colors hover:bg-bg-2",
                      !n.read && "bg-bg-2/50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{n.title}</span>
                      {!n.read ? <span className="h-2 w-2 shrink-0 rounded-full bg-accent" /> : null}
                    </div>
                    <p className="mt-0.5 text-xs text-text-dim">{n.body}</p>
                    <p className="mt-1 font-mono text-[10px] text-text-faint">{formatDateTime(n.createdAt)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
