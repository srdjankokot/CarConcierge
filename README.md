# Auto Concierge

Concierge servis za vozila (Novi Sad) — Next.js 15 + Firebase. Jedna aplikacija, tri
uloge razdvojene kroz UI (`client`, `dispatcher`, `driver`). Vizuelni identitet i
tokeni nasleđeni sa landing stranice; razlika po ulozi je samo akcentna boja
(`--role-accent`).

## Faze

- **F1 — Temelj** ✓ Auth (email/lozinka + Google), role custom claims, routing/guardovi, bootstrap dispečera, `createDriver`.
- **F2 — Klijent** ✓ vozila/serviseri, višekorakno kreiranje zahteva, lista/istorija/detalj.
- **F3 — Dispečer** ✓ kanban tabla, ponuda, izbor partnera, dodela vozača, partneri.
- **F4 — Vozač** ✓ poslovi, prelazi statusa, foto PRE/POSLE (Storage).
- **F5 — Notifikacije + PWA** ✓ in-app `notifications` + FCM push wiring, manifest/ikonice.
- **F6 — Sigurnost + poliranje** ✓ audit pravila, validacija prelaza u Functions, dispečersko otkazivanje, responsive.

Sve izmene statusa idu kroz callable Cloud Functions (validacija prelaza); `requests` su read-only za klijent SDK.

## Pokretanje (F1)

1. Instaliraj zavisnosti:
   ```bash
   npm install
   npm --prefix functions install
   ```
2. Konfiguriši okruženje — kopiraj `.env.local.example` u `.env.local` i popuni
   `NEXT_PUBLIC_FIREBASE_*` vrednostima iz Firebase Console (Project settings → Web app).
3. Postavi project ID u `.firebaserc` (zameni `REPLACE_WITH_YOUR_PROJECT_ID`).
4. U Firebase Console uključi: Authentication → Email/Password i Google;
   Firestore Database; (Storage i Functions se koriste od kasnijih faza).
5. Pokreni dev server:
   ```bash
   npm run dev
   ```

## Bootstrap prvog dispečera

Custom claim `role` postavlja isključivo Cloud Function / Admin SDK — niko se ne
može sam učiniti dispečerom. Prvi dispečer:

1. Registruj se kroz aplikaciju (`/register`) — dobićeš `role: client`.
2. Iskopiraj `uid` iz Firebase Console → Authentication.
3. Postavi `GOOGLE_APPLICATION_CREDENTIALS` na putanju service account ključa
   (Project settings → Service accounts), pa pokreni:
   ```bash
   npm run seed:admin -- <uid> dispatcher
   ```
4. Odjavi se i ponovo prijavi (da novi claim uđe u token).

Dalje vozače/dispečere dispečer kreira iz aplikacije (`/drivers`), što poziva
callable `createDriver` / `createDispatcher`.

## Cloud Functions

```bash
npm --prefix functions run build      # kompajliraj
firebase deploy --only functions      # deploy (region: europe-west1)
```

Funkcije (F1): `onUserCreate` (default `client` + profil), `completeClientRegistration`
(deterministički provisioning posle registracije), `createDriver`, `createDispatcher`.

## Deploy (produkcija)

```bash
# pravila, indeksi, storage, funkcije
firebase deploy --only firestore:rules,firestore:indexes,storage,functions
```
Pre deploy-a popuni `.env.local` pravim vrednostima (`NEXT_PUBLIC_FIREBASE_*`) i, za web push,
`NEXT_PUBLIC_FIREBASE_VAPID_KEY` (Console → Cloud Messaging → Web Push certificates). Bez VAPID
ključa push je isključen, ali in-app notifikacije rade. Region funkcija: `europe-west1`.

## Emulatori (opciono)

> Emulatorima treba JDK 21+. Ako default `java` nije 21+, pokreni sa
> `JAVA_HOME="$(/usr/libexec/java_home -v 21)" PATH="$JAVA_HOME/bin:$PATH" firebase emulators:start …`


Postavi `NEXT_PUBLIC_USE_EMULATORS=true` u `.env.local`, pa:
```bash
npm --prefix functions run build
npm run emulators
```

## Struktura

```
src/app/(auth)        login / register (javno)
src/app/(client)      role==client  · akcenat zlatna  #c9a86a
src/app/(dispatcher)  role==dispatcher · akcenat mint #6fd3a3
src/app/(driver)      role==driver  · akcenat amber   #e0954a
src/lib/firebase      inicijalizacija client SDK-a
src/lib/auth          AuthProvider, guardovi, callables, mapiranje grešaka
src/lib/validation    zod šeme (sekcija 11A)
functions/            Cloud Functions (auth bootstrap)
scripts/seed-admin.ts bootstrap dispečera
```
