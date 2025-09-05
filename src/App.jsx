import React from "react";
import { useFlights } from "./useFlights.js";
import { FLIGHTS_URL } from "./config.js";
import SplitFlapWord from "./components/SplitFlatWord.jsx";
import SplitFlapNumber from "./components/SplitFlatNumber.jsx";
import SplitFlapGate from "./components/SplitFlatGate.jsx";
import SplitFlapStatus from "./components/SplitFlapStatus.jsx";
import SplitFlapTime from "./components/SplitFlapTime.jsx";
import SplitFlapPlace from "./components/SplitFlapPlace.jsx";

export default function App() {
  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    dataUpdatedAt,
  } = useFlights({ url: FLIGHTS_URL });

  // Keep the pulsing dot visible briefly so it’s noticeable
  const [showPulse, setShowPulse] = React.useState(false);
  React.useEffect(() => {
    if (isFetching) {
      setShowPulse(true);
      return;
    }
    // when fetch ends, keep the indicator ~1.2s
    const t = setTimeout(() => setShowPulse(false), 1200);
    return () => clearTimeout(t);
  }, [isFetching]);

  return (
    <div className="w-full max-w-screen-3xl mx-auto p-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-wide">
            {(data?.airport || "PSM")} • Arrivals &amp; Departures
          </h1>
          {/* <p className="text-slate-400 text-sm">
            Source: {FLIGHTS_URL === "mock" ? "Mock JSON" : FLIGHTS_URL}
          </p> */}
        </div>

        <span className="text-xs border-stone-300/60 tabular-nums flex items-center gap-2">
          Last updated: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "--:--:--"}
          {showPulse && (
            <span
              className="inline-block w-2.5 h-2.5 rounded-full bg-sky-400 ring-2 ring-sky-400/30 animate-pulse"
              title="Refreshing"
            />
          )}
        </span>
      </header>

      <div className="relative bg-stone-800/60 rounded-xl overflow-hidden ring-1 ring-stone-300/60">
        {isError && (
          <div className="p-6 text-rose-400">
            Error loading flights.
            <pre className="mt-2 text-xs text-rose-300 whitespace-pre-wrap">
              {String(error?.message || error)}
            </pre>
          </div>
        )}

        {/* Show cached table if present; only show loader before first data */}
        {data ? (
          <FlightTable flights={data.flights} />
        ) : (
          <div className="p-6">Loading flights…</div>
        )}

        {/* Optional: subtle badge while background refreshing */}
        {/* {isFetching && (
          <div className="absolute top-2 right-2 text-[11px] px-2 py-0.5 rounded bg-stone-700/70 text-stone-300 animate-pulse">
            Refreshing…
          </div>
        )} */}
      </div>
    </div>
  );
}

function FlightTable({ flights }) {
  return (
    <div className="w-full">
      {/* desktop/tablet */}
      <table className="hidden md:table w-full border-collapse table-fixed">
        <thead className="bg-[#333333]">
          <tr className="text-left text-stone-300">
            {/* <Th>Dir</Th> */}
            <Th>Airline</Th>
            <Th>Flight</Th>
            <Th>From/To</Th>
            <Th>Sched → Est</Th>
            <Th>Gate</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {flights.map((f) => (
            <tr key={f.id} className="border-t border-stone-300/60 bg-[#333333]">
              {/* <Td>{f.dir || (f.origin ? "ARR" : "DEP")}</Td> */}
              <Td className="leading-none text-left">
                <div className="min-w-[12ch]">
                  <SplitFlapWord value={f.airline} min={12} size="M" />
                </div>
              </Td>
              <Td className="leading-none">
                <div className="min-w-[6ch]">
                  <SplitFlapNumber value={f.flightNo} min={6} size="M" />
                </div>
              </Td>
              <Td className="leading-none">
                <div className="min-w-[4ch]">
                  <SplitFlapPlace value={f.origin || f.destination || "—"} min={3} size="M" />
                </div>
              </Td>
              <Td className="leading-none">
                <div className="flex items-center gap-2">
                  <SplitFlapTime value={f.sched} size="M" />
                  {f.est && (
                    <>
                      <span className="border-stone-300/60">→</span>
                      <SplitFlapTime value={f.est} size="M" />
                    </>
                  )}
                </div>
              </Td>
              <Td className="leading-none">
                <div className="min-w-[3ch]">
                  <SplitFlapGate value={f.gate ?? "—"} min={2} size="M" />
                </div>
              </Td>
              <Td className="leading-none text-left">
                <div className="min-w-[12ch]">
                  <SplitFlapStatus value={f.status} size="M" />
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* mobile cards */}
      <ul className="md:hidden divide-y divide-slate-700/60">
        {flights.map((f) => (
          <li key={f.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-slate-700/70">
                  {f.dir || (f.origin ? "ARR" : "DEP")}
                </span>
                <span className="font-semibold">{f.flightNo}</span>
              </div>
              <StatusBadge status={f.status} />
            </div>
            <div className="mt-1 text-slate-300">{f.airline}</div>
            <div className="mt-2 text-sm">
              <span className="text-slate-400">{f.origin ? "From" : "To"}:</span>{" "}
              <span className="font-medium">{f.origin || f.destination || "—"}</span>
            </div>
            <div className="mt-1 text-sm">
              <span className="text-slate-400">Time:</span>{" "}
              {fmtTime(f.sched)}
              {f.est ? (
                <>
                  {" "}
                  <span className="text-slate-400">→</span>{" "}
                  <strong>{fmtTime(f.est)}</strong>
                </>
              ) : null}
            </div>
            <div className="mt-1 text-sm">
              <span className="text-slate-400">Gate:</span> {f.gate ?? "—"}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Th({ children }) {
  return <th className="py-3 px-4 text-2xl font-semibold tracking-wide">{children}</th>;
}
function Td({ children }) {
  return <td className="py-3 px-4 text-sm">{children}</td>;
}

function StatusBadge({ status = "" }) {
  const s = String(status).toUpperCase();
  const map = {
    ON_TIME: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
    LANDED: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
    EARLY: "bg-lime-500/15 text-lime-200 ring-1 ring-lime-500/30",
    DELAYED: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
    CANCELLED: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
    BOARDING: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
    DEPARTED: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30",
    DIVERTED: "bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-500/30",
  };
  const cls = map[s] || "bg-slate-600/20 text-slate-200 ring-1 ring-slate-500/30";
  return <span className={`text-xs px-2 py-1 rounded ${cls}`}>{s.replaceAll("_", " ")}</span>;
}

function fmtTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}