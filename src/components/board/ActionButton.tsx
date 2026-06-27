"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { dispatcherNextStep, type BoardDriver, type BoardRequest } from "@/lib/board/model";
import { primaryBtn, ghostBtn } from "./ui";
import { DriverPicker } from "./DriverPicker";

export function ActionButton({
  r,
  drivers,
  onCompose,
  onAssign,
  onClose,
  busy,
}: {
  r: BoardRequest;
  drivers: BoardDriver[];
  onCompose: (id: string) => void;
  onAssign: (id: string, uid: string) => void;
  onClose: (id: string) => void;
  busy?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const step = dispatcherNextStep(r.status);
  if (!step) return null;

  const disabledStyle = busy ? { opacity: 0.6, cursor: "wait" as const } : null;

  if (step.kind === "assign") {
    return (
      <span style={{ position: "relative" }}>
        <button disabled={busy} onClick={() => setOpen((o) => !o)} style={{ ...primaryBtn, ...disabledStyle }}>
          <Icon name="user" size={15} />
          {step.label}
        </button>
        {open ? (
          <DriverPicker drivers={drivers} onClose={() => setOpen(false)} onPick={(uid) => { setOpen(false); onAssign(r.id, uid); }} />
        ) : null}
      </span>
    );
  }

  const handle = () => (step.kind === "compose" ? onCompose(r.id) : onClose(r.id));
  return (
    <button disabled={busy} onClick={handle} style={{ ...(step.primary ? primaryBtn : ghostBtn), ...disabledStyle }}>
      <Icon name={step.icon} size={15} />
      {step.label}
    </button>
  );
}
