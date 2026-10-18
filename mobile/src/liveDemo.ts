import { useEffect, useState } from "react";
import { Platform } from "react-native";

// Live simulation mode. On the web, dashboard/demo.html embeds this app in an iframe and posts a
// simulated January 2026 (map geometry once, then the current risk map). The app only replies
// with a "ready" signal. Native builds and the stand-alone web app never enter this mode.
export type LiveSetup = {
  map: string;
  areaSize: number;
  cellSize: number;
  zoneSize: number;
  cells: { x: number[]; y: number[] };
  zones: { id: number[]; x: number[]; y: number[] };
  place: string;
  area: string;
};
export type LiveFrame = {
  when: string;
  weather: string;
  thaw: boolean;
  risk: number[]; // estimated slips per 1,000 passes, one value per cell
  gritted: number[]; // zone ids gritted now
  streets: { name: string; level: string }[];
  gritting: { street: string; until: string }[];
};
export type Live = { setup: LiveSetup; frame: LiveFrame };

const local = (origin: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

export function useLiveDemo(): Live | null {
  const [setup, setSetup] = useState<LiveSetup | null>(null);
  const [frame, setFrame] = useState<LiveFrame | null>(null);
  useEffect(() => {
    if (
      Platform.OS !== "web" ||
      typeof window === "undefined" ||
      window.parent === window
    )
      return;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== window.parent) return;
      if (e.origin !== window.location.origin && !local(e.origin)) return;
      const m = e.data;
      if (!m || m.source !== "pito-demo") return;
      if (m.type === "setup") setSetup(m.setup);
      if (m.type === "frame") setFrame(m.frame);
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ source: "pito-app", type: "ready" }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);
  return setup && frame ? { setup, frame } : null;
}

// Slips per 1,000 passes → colour; the same scale as the demo page.
export function riskColor(v: number) {
  if (v < 0.4) return null;
  const q = Math.min(1, v / 12);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * q);
  return `rgba(${mix(246, 214)}, ${mix(205, 38)}, ${mix(70, 61)}, ${(0.22 + 0.6 * q).toFixed(2)})`;
}
