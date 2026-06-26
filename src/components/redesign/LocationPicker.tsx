"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps, MAPS_KEY, NS_CENTER } from "@/lib/maps";

export interface LocationValue {
  address: string;
  lat?: number;
  lng?: number;
}

export function LocationPicker({
  value,
  onChange,
  placeholder = "Pretražite adresu…",
}: {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!MAPS_KEY);

  useEffect(() => {
    if (!MAPS_KEY) return;
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapDivRef.current || !inputRef.current) return;
        const v = valueRef.current;
        const start = typeof v.lat === "number" && typeof v.lng === "number" ? { lat: v.lat, lng: v.lng } : NS_CENTER;

        const map = new maps.Map(mapDivRef.current, {
          center: start,
          zoom: typeof v.lat === "number" ? 16 : 13,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        });
        const marker = new maps.Marker({ map, position: start, draggable: true });
        const geocoder = new maps.Geocoder();
        mapRef.current = map;
        markerRef.current = marker;

        const setFromLatLng = (lat: number, lng: number) => {
          marker.setPosition({ lat, lng });
          geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
            const address = status === "OK" && results?.[0] ? results[0].formatted_address : valueRef.current.address;
            if (inputRef.current) inputRef.current.value = address;
            onChangeRef.current({ address, lat, lng });
          });
        };

        const ac = new maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry"],
          componentRestrictions: { country: "rs" },
        });
        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          if (!place.geometry?.location) return;
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          map.setCenter({ lat, lng });
          map.setZoom(16);
          marker.setPosition({ lat, lng });
          onChangeRef.current({ address: place.formatted_address || inputRef.current!.value, lat, lng });
        });

        marker.addListener("dragend", () => {
          const p = marker.getPosition();
          setFromLatLng(p.lat(), p.lng());
        });
        map.addListener("click", (e: any) => setFromLatLng(e.latLng.lat(), e.latLng.lng()));

        setReady(true);
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
    };
  }, []);

  // Spoljna promena value → osveži marker/mapu i input (kad polje nije fokusirano)
  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current && inputRef.current.value !== value.address) {
      inputRef.current.value = value.address;
    }
    if (ready && markerRef.current && mapRef.current && typeof value.lat === "number" && typeof value.lng === "number") {
      const cur = markerRef.current.getPosition();
      if (!cur || Math.abs(cur.lat() - value.lat) > 1e-6 || Math.abs(cur.lng() - value.lng) > 1e-6) {
        const p = { lat: value.lat, lng: value.lng };
        markerRef.current.setPosition(p);
        mapRef.current.setCenter(p);
      }
    }
  }, [value.address, value.lat, value.lng, ready]);

  // Fallback: nema ključa / učitavanje palo → obično tekst polje (app i dalje radi)
  if (failed) {
    return (
      <input className="rd-in" placeholder={placeholder} value={value.address} onChange={(e) => onChange({ ...value, address: e.target.value })} />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        ref={inputRef}
        className="rd-in"
        placeholder={placeholder}
        defaultValue={value.address}
        onChange={(e) => onChange({ ...valueRef.current, address: e.target.value })}
      />
      <div ref={mapDivRef} style={{ width: "100%", height: 170, borderRadius: 12, overflow: "hidden", border: "1px solid var(--glass-line)", background: "rgba(255,255,255,0.03)" }} />
    </div>
  );
}
