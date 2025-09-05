import { useQuery } from "@tanstack/react-query";
import * as z from "zod";
import flightsMock from "./mock/flights.json";
import { API_HEADERS, REFRESH_MS } from "./config.js";

// small helper so mock loads aren't "instant"
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
        // Simulate a bit of latency so isFetching is visible
        await sleep(350);
        data = flightsMock;
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