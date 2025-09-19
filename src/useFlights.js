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









// ---------------------------------------------
// Real API adapter (PSM)
function normalizeStatus(s) {
  const up = String(s || "").toUpperCase().replace(/\s+/g, "");
  switch (up) {
    case "ONTIME": return "ON TIME";
    case "DEPARTED": return "DEPARTED";
    case "ARRIVED": return "LANDED"; // map to board-friendly term
    default: return (s || "ON TIME").toUpperCase();
  }
}

function toIsoMaybe(str) {
  if (!str) return null;
  // First try native parsing
  let d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString();

  // Handle "YYYY-MM-DD HH:MM:SS.mmm"
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
    const s = str.replace(" ", "T"); // treat as local time
    d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // Handle "Mon DD YYYY h:mmAM" (e.g., "Sep 18 2025 2:00PM")
  const m = /^([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})\s+(\d{1,2}):(\d{2})\s*([AP]M)$/i.exec(str);
  if (m) {
    const [, monStr, ddStr, yyyyStr, hhStr, mmStr, ap] = m;
    const months = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
    const mon = months[monStr.slice(0,3)] ?? null;
    const dd = parseInt(ddStr, 10);
    const yyyy = parseInt(yyyyStr, 10);
    let hh = parseInt(hhStr, 10) % 12; // 12-hour to 24-hour
    if (/pm/i.test(ap)) hh += 12;
    const mm = parseInt(mmStr, 10);
    if (mon != null) {
      const local = new Date(yyyy, mon, dd, hh, mm, 0, 0); // local time
      if (!isNaN(local.getTime())) return local.toISOString();
    }
  }

  return null;
}

function adaptPSM(api) {
  const flightsRaw = Array.isArray(api?.Flights) ? api.Flights : [];

  const flights = flightsRaw.map((f, i) => {
    const dir = (f.ArrDep || "").toUpperCase() === "A" ? "ARR" : "DEP";
    const cityIata = (f.CityCode || f.Cities || "").toString().toUpperCase() || null;
    const airline = f.CarrierName || f.CarrierCode || "UNKNOWN";

    // Build a time-stamped id to avoid duplicates across multiple entries of the same flight
    const stamp = toIsoMaybe(f.RevisedTime) || toIsoMaybe(f.SchedTime) || toIsoMaybe(f.FlightDate);
    const stampKey = stamp ? stamp.replace(/[-:TZ.]/g, "").slice(0, 12) : String(i);
    return {
      id: `${f.Flight || i}-${dir}-${stampKey}`,
      airline: String(airline),
      flightNo: String(f.Flight || ""),
      origin: dir === "ARR" ? (f.CityName || cityIata) : null,
      destination: dir === "DEP" ? (f.CityName || cityIata) : null,
      sched: toIsoMaybe(f.SchedTime) || f.SchedTime || null,
      est: toIsoMaybe(f.RevisedTime) || f.RevisedTime || null,
      gate: f.Gate || null,
      status: normalizeStatus(f.Status),
      dir,
    };
  });

  // Ensure unique ids even if upstream data contains duplicates
  const seen = new Map();
  for (const fl of flights) {
    const n = (seen.get(fl.id) || 0) + 1;
    seen.set(fl.id, n);
    if (n > 1) {
      fl.id = `${fl.id}#${n}`;
    }
  }

  return { airport: "PSM", flights };
}
// ---------------------------------------------
 
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
        data = adaptPSM(data);
      } else {
        throw new Error(`Invalid URL: ${url}`);
      }

      const parsed = FlightsResponse.parse(data);

      // ---- Airport-style behavior: filter to today's window & collapse duplicates ----
      const nowLocal = new Date();
      const startOfToday = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate(), 0, 0, 0, 0);
      const endWindow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000); // today only (no next-day buffer)

      const ms = (s) => (s ? new Date(s).getTime() : NaN);
      const inWindow = (f) => {
        const t = ms(f.est) || ms(f.sched);
        return !isNaN(t) && t >= startOfToday.getTime() && t < endWindow.getTime();
      };

      // keep only flights within window
      const windowed = parsed.flights.filter(inWindow);

      // collapse to latest per (dir + flightNo + local-date)
      const latestByKey = new Map();
      for (const f of windowed) {
        const t = ms(f.est) || ms(f.sched) || 0;
        const d = new Date(t);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const key = `${f.dir}|${f.flightNo}|${dateKey}`;
        const prev = latestByKey.get(key);
        if (!prev) {
          latestByKey.set(key, f);
        } else {
          const tp = ms(prev.est) || ms(prev.sched) || 0;
          // Pick the record with the newer est/sched timestamp;
          // tie-breaker: prefer a record that has a gate if previous didn't
          if (t > tp || (t === tp && f.gate && !prev.gate)) {
            latestByKey.set(key, f);
          }
        }
      }

      parsed.flights = Array.from(latestByKey.values());
      // ---- end airport-style behavior ----

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