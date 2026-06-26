// Lagani lazy-loader za Google Maps JS SDK (+ Places). Učitava skriptu jednom.
declare global {
  interface Window {
    google?: any;
  }
}

export const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
export const NS_CENTER = { lat: 45.2671, lng: 19.8335 }; // Novi Sad

let loaderPromise: Promise<any> | null = null;

export function loadGoogleMaps(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (!MAPS_KEY) return Promise.reject(new Error("no-key"));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const cbName = "__gmapsInit__";
    // Google poziva callback tek kad je google.maps potpuno spreman (uklj. places).
    (window as any)[cbName] = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("maps-init-failed"));
    };
    // Auth greška (nevažeći ključ / nedozvoljen referrer / API nije uključen).
    (window as any).gm_authFailure = () => {
      loaderPromise = null;
      reject(new Error("maps-auth-failed"));
    };
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&language=sr&region=RS&loading=async&callback=${cbName}`;
    s.async = true;
    s.onerror = () => {
      loaderPromise = null;
      reject(new Error("maps-load-failed"));
    };
    document.head.appendChild(s);
  });
  return loaderPromise;
}
