// Auth bootstrap (F1).
export { onUserCreate } from "./auth/onUserCreate";
export { completeClientRegistration } from "./auth/completeClientRegistration";
export { createDriver } from "./auth/createDriver";
export { createDispatcher } from "./auth/createDispatcher";
export { resyncMyRole } from "./auth/resyncMyRole";

// Zahtevi — klijent (F2).
export { createRequest } from "./requests/createRequest";
export { cancelRequest } from "./requests/cancelRequest";
export { respondToOffer } from "./requests/respondToOffer";

// Zahtevi — dispečer (F3).
export { sendOffer } from "./requests/sendOffer";
export { assignDriver } from "./requests/assignDriver";
export { closeRequest } from "./requests/closeRequest";
export { setItemStatus } from "./requests/setItemStatus";
export { dispatcherCancelRequest } from "./requests/dispatcherCancelRequest";

// Zahtevi — vozač (F4).
export { advanceJobStatus } from "./requests/advanceJobStatus";
export { addJobPhoto } from "./requests/addJobPhoto";
export { revertJobStatus } from "./requests/revertJobStatus";

// Notifikacije — Firestore trigeri (F5).
export { onRequestCreated, onRequestStatusChange } from "./requests/notifications";
