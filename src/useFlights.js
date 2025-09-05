import { useQuery } from "@tanstack/react-query";
import * as z from "zod";
import flightsMock from "./mock/flights.json"; // ✅ direct import so no fetch/path issues

// --- schema (kept flexible for now) ---
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
  url = "mock",              // "mock" uses imported JSON; pass an https:// URL for real API
  refreshMs = 20000,
} = {}) {
  return useQuery({
    queryKey: ["flights", airport, url],
    queryFn: async () => {
      let data;
      if (url === "mock") {
        data = flightsMock;  // ← no fetch, guaranteed to work
      } else if (/^https?:\/\//i.test(url)) {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${url}`);
        data = await r.json();
      } else {
        throw new Error(`Invalid URL for flights: ${url}`);
      }

      const parsed = FlightsResponse.parse(data);

      // sort by est -> sched
      const toMs = (s) => (s ? new Date(s).getTime() : Number.POSITIVE_INFINITY);
      parsed.flights.sort((a, b) => (toMs(a.est ?? a.sched)) - (toMs(b.est ?? b.sched)));

      return parsed;
    },
    refetchInterval: url === "mock" ? false : refreshMs, // don't poll mock
    staleTime: url === "mock" ? Infinity : Math.floor(refreshMs * 0.75),
    retry: 1,
    onError: (e) => console.error("[useFlights] load error:", e),
  });
}