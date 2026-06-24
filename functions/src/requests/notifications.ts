import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { REGION } from "../lib/admin";
import { notifyDispatchers, notifyUser } from "../lib/notify";

function vehicleLabel(data: FirebaseFirestore.DocumentData): string {
  return `${data.vehicle?.make ?? ""} ${data.vehicle?.model ?? ""}`.trim();
}

// Nov zahtev → dispečeri.
export const onRequestCreated = onDocumentCreated(
  { region: REGION, document: "requests/{requestId}" },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    await notifyDispatchers({
      type: "new_request",
      requestId: event.params.requestId,
      title: "Novi zahtev",
      body: `${data.clientName || "Klijent"} — ${vehicleLabel(data)}`,
    });
  },
);

// Promena statusa → odgovarajući primaoci (sekcija 9).
export const onRequestStatusChange = onDocumentUpdated(
  { region: REGION, document: "requests/{requestId}" },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after || before.status === after.status) return;

    const requestId = event.params.requestId;
    const v = vehicleLabel(after);
    const client = after.clientName || "Klijent";
    const toClient = (title: string, body: string) =>
      notifyUser(after.clientId, { type: "status_changed", requestId, title, body });

    switch (after.status) {
      case "OFFER_SENT":
        await toClient("Stigla je ponuda", `${v}: pregledajte termin i cenu prevoza.`);
        break;
      case "CONFIRMED":
        await notifyDispatchers({ type: "offer_responded", requestId, title: "Ponuda prihvaćena", body: `${client} — ${v}` });
        break;
      case "REJECTED":
        await notifyDispatchers({ type: "offer_responded", requestId, title: "Ponuda odbijena", body: `${client} — ${v}` });
        break;
      case "CREATED":
        if (before.status === "OFFER_SENT") {
          await notifyDispatchers({ type: "offer_responded", requestId, title: "Klijent traži izmenu", body: `${client} — ${v}` });
        }
        break;
      case "DRIVER_ASSIGNED":
        await toClient("Vozač dodeljen", `${v}: vozač je na putu prema vama.`);
        if (after.assignedDriverId) {
          await notifyUser(after.assignedDriverId, {
            type: "driver_assigned",
            requestId,
            title: "Novi posao",
            body: `${v} — ${after.pickup?.address ?? ""}`,
          });
        }
        break;
      case "PICKED_UP":
        await toClient("Vozilo preuzeto", `${v}: vozilo je preuzeto.`);
        break;
      case "AT_SERVICE":
        await toClient("Na usluzi", `${v}: vozilo je kod servisera.`);
        break;
      case "SERVICE_DONE":
        await toClient("Usluga gotova", `${v}: usluga je završena.`);
        break;
      case "RETURNING":
        await toClient("Vraćanje", `${v}: vozilo se vraća.`);
        break;
      case "DELIVERED":
        await toClient("Isporučeno", `${v}: vozilo je vraćeno.`);
        break;
      case "CLOSED":
        await toClient("Posao zatvoren", `${v}: posao je završen.`);
        break;
      case "CANCELLED":
        if (after.cancelledBy === "client") {
          await notifyDispatchers({ type: "status_changed", requestId, title: "Zahtev otkazan", body: `${client} — ${v}` });
        } else {
          await toClient("Zahtev otkazan", `${v}: zahtev je otkazan.`);
        }
        break;
    }
  },
);
