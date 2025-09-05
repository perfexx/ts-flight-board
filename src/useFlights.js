import { useQuery } from "@tanstack/react-query";
import * as z from "zod";
import flightsMock from "./mock/flights.json";
import { API_HEADERS, REFRESH_MS } from "./config.js";




//---------------------------------------------
// Simulated network delay
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Return a deep-cloned, slightly mutated copy of the flights for realism
function mutateFlights(base) {
  const cloned = JSON.parse(JSON.stringify(base));
  const now = Date.now();

  const statuses = ["ON TIME", "EARLY", "DELAYED", "CANCELLED", "BOARDING", "DEPARTED", "LANDED"];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  cloned.flights = cloned.flights.map((f, i) => {
    // small deterministic-ish jitter per row
    const jitterSeed = (now / 1000 + i) % 60;

    // Randomize EST by ± 0–15 minutes (or null sometimes)
    const sched = new Date(f.sched);
    let est = Math.random() < 0.15 ? null : new Date(sched);
    if (est) {
      const deltaMin = Math.floor((Math.sin(jitterSeed) + 1) * 7.5); // 0–15
      const sign = Math.random() < 0.5 ? -1 : 1;
      est.setMinutes(est.getMinutes() + sign * deltaMin);
    }

    // Randomize status with bias toward ON TIME/DELAYED/EARLY
    let status = f.status;
    const dice = Math.random();
    if (dice < 0.60) status = "ON TIME";
    else if (dice < 0.75) status = "DELAYED";
    else if (dice < 0.85) status = "EARLY";
    else status = pick(statuses);

    // Randomize gate a bit
    const gateStr = f.gate && /^[A-Z]?\d{1,2}$/i.test(f.gate)
      ? String(f.gate)
      : String(Math.max(1, Math.floor((i % 6) + 1)));
    const gateNum = parseInt(gateStr.replace(/\D/g, "") || "1", 10);
    const gateDelta = Math.random() < 0.2 ? (Math.random() < 0.5 ? -1 : 1) : 0;
    const gate = String(Math.max(1, gateNum + gateDelta));

    return {
      ...f,
      est: est ? est.toISOString() : null,
      status,
      gate,
    };
  });

  return cloned;
}

//---------------------------------------------









// --- schema (kept flexible) ---
const Flight = z.object({
  id: z.string(),
  airline: z.string(),
  flightNo: z.string(),
  origin: z.string().nullable().optional(),
  destination: z.string().nullable().optional(),
  sched: z.string(),
  est: z.string().nullable().optional(),
  gate: z.string().nullable().optional(),
  status: z.string(),
  dir: z.enum(["ARR", "DEP"]).optional(),
});

const FlightsResponse = z.object({
  airport: z.string(),
  flights: z.array(Flight),
});

export function useFlights({
  airport = "PSM",
  url = "mock",              // "mock" by default; pass https://... for real API
  refreshMs = REFRESH_MS,    // configurable via ?refresh_ms=...
} = {}) {
  return useQuery({
    queryKey: ["flights", airport, url],
    queryFn: async () => {
      let data;

      if (url === "mock") {
        // existing mock path
        await sleep(350);
        data = flightsMock;
      } else if (url === "mock-live") {
        // NEW: live-ish mock with random updates + latency
        await sleep(400 + Math.floor(Math.random() * 600)); // 400–1000ms
        data = mutateFlights(flightsMock);
      } else if (/^https?:\/\//i.test(url)) {
        const r = await fetch(url, { cache: "no-store", headers: API_HEADERS });
        if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${url}`);
        data = await r.json();
      } else {
        throw new Error(`Invalid URL: ${url}`);
      }

      const parsed = FlightsResponse.parse(data);

      // sort by estimated time (fallback to scheduled)
      const toMs = (s) => (s ? new Date(s).getTime() : Number.POSITIVE_INFINITY);
      parsed.flights.sort((a, b) => (toMs(a.est ?? a.sched)) - (toMs(b.est ?? b.sched)));

      return parsed;
    },
    // 🔁 always poll (so the pulse shows even on mock)
    refetchInterval: refreshMs,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: Math.floor(refreshMs * 0.75),
    retry: 1,
    onError: (e) => console.error("[useFlights] load error:", e),
    onSuccess: () => {
      console.log("[useFlights] refreshed at", new Date().toLocaleTimeString());
    },
  });
}