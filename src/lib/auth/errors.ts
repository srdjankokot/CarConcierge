import { FirebaseError } from "firebase/app";

// Mapira Firebase Auth/Functions greške u jasne poruke na srpskom (sekcija 11B:
// nikad „tiha" greška — korisnik uvek vidi razumljivu poruku).
export function mapAuthError(e: unknown): string {
  if (e instanceof FirebaseError) {
    switch (e.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Pogrešan email ili lozinka.";
      case "auth/email-already-in-use":
        return "Nalog sa ovim email-om već postoji.";
      case "auth/invalid-email":
        return "Email nije ispravan.";
      case "auth/weak-password":
        return "Lozinka je preslaba (minimum 8 karaktera).";
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return "Prijava je otkazana.";
      case "auth/popup-blocked":
        return "Browser je blokirao prozor za prijavu. Dozvolite popup i pokušajte ponovo.";
      case "auth/unauthorized-domain":
        return "Ovaj domen nije autorizovan za Google prijavu (Firebase → Authentication → Settings → Authorized domains).";
      case "auth/operation-not-allowed":
        return "Google prijava nije uključena (Firebase → Authentication → Sign-in method → Google).";
      case "auth/network-request-failed":
      case "functions/unavailable":
        return "Problem sa mrežom. Pokušajte ponovo.";
      case "auth/too-many-requests":
        return "Previše pokušaja. Sačekajte malo pa probajte ponovo.";
      case "functions/permission-denied":
        return "Nemate ovlašćenje za ovu akciju.";
      default:
        return "Došlo je do greške. Pokušajte ponovo.";
    }
  }
  return "Došlo je do greške. Pokušajte ponovo.";
}

// Za callable Cloud Functions: HttpsError poruka sa servera je već na srpskom,
// pa je prikazujemo direktno (osim INTERNAL, gde dajemo generičku).
export function mapError(e: unknown): string {
  if (e instanceof FirebaseError) {
    if (e.code.startsWith("functions/") && e.message && e.message !== "INTERNAL") {
      return e.message;
    }
    return mapAuthError(e);
  }
  return "Došlo je do greške. Pokušajte ponovo.";
}
