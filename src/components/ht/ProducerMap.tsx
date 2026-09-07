import { useEffect, useRef } from "react";
import type { Producer } from "@/lib/data";
import { DEFAULT_LOCATION } from "@/lib/data";

type Props = {
  producers: Producer[];
  onSelect: (producer: Producer) => void;
  center?: { lat: number; lng: number };
};

/**
 * Client-only Leaflet map with terracotta pins. Leaflet is imported
 * dynamically so it never runs during server rendering.
 */
export default function ProducerMap({ producers, onSelect, center }: Props) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !nodeRef.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(nodeRef.current, { zoomControl: true, scrollWheelZoom: true }).setView(
        [center?.lat ?? DEFAULT_LOCATION.lat, center?.lng ?? DEFAULT_LOCATION.lng],
        6,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      renderPins();
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderPins() {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();
    const points: [number, number][] = [];
    producers.forEach((p) => {
      if (p.lat == null || p.lng == null) return;
      const lat = Number(p.lat);
      const lng = Number(p.lng);
      points.push([lat, lng]);
      const icon = L.divIcon({
        className: "",
        html: `<div style="display:flex;flex-direction:column;align-items:center">
            <div style="background:#C4704B;color:#fff;border-radius:999px;padding:4px 10px;font:600 11px Inter,sans-serif;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.18)">${p.business_name}</div>
            <div style="width:12px;height:12px;background:#C4704B;transform:rotate(45deg);margin-top:-4px;border-radius:2px"></div>
          </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker([lat, lng], { icon })
        .addTo(layer)
        .on("click", () => selectRef.current(p));
    });
    if (points.length) map.fitBounds(points, { padding: [48, 48], maxZoom: 11 });
  }

  useEffect(() => {
    renderPins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producers]);

  return <div ref={nodeRef} className="ht-map min-h-[320px]" />;
}
