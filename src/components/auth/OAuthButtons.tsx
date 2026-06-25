"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { mapAuthError } from "@/lib/auth/errors";
import { Icon } from "@/components/ui/Icon";

export function OAuthButtons({ onError }: { onError?: (msg: string) => void }) {
  const [busy, setBusy] = useState(false);

  async function signInWithGoogle() {
    setBusy(true);
    onError?.("");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      onError?.(mapAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="rd-btn-ghost" style={{ width: "100%" }} disabled={busy} onClick={signInWithGoogle}>
      <Icon name="user" size={16} />
      {busy ? "Sačekajte…" : "Nastavi sa Google"}
    </button>
  );
}
