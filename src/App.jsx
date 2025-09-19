import React from "react";
import { useFlights } from "./useFlights.js";
import { FLIGHTS_URL } from "./config.js";
// import SplitFlapWord from "./components/SplitFlatWord.jsx";
import SplitFlapNumber from "./components/SplitFlatNumber.jsx";
import SplitFlapGate from "./components/SplitFlatGate.jsx";
import SplitFlapStatus from "./components/SplitFlapStatus.jsx";
import SplitFlapTime from "./components/SplitFlapTime.jsx";
import SplitFlapPlace from "./components/SplitFlapPlace.jsx";
import logos from "./logos.js";

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

  const arrFlights = data?.flights?.filter((f) => f.dir === "ARR") ?? [];
  const depFlights = data?.flights?.filter((f) => f.dir === "DEP") ?? [];

  return (
    <div className="w-full max-w-screen-3xl mx-auto p-8">
      <header className="mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          {/* left spacer on desktop */}
          <div className="hidden sm:block" />

          {/* centered logo */}
          <div className="flex justify-center">
            <img
              src={new URL("./assets/logo.webp", import.meta.url).href}
              alt="PSM Airport"
              className="h-24 w-auto object-contain"
            />
          </div>

          {/* last updated: right on desktop, centered on mobile */}
          <div className="flex sm:justify-end justify-center">
            <span className="text-xs tabular-nums flex items-center gap-2">
              Last updated: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "--:--:--"}
              {showPulse && (
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full bg-sky-400 ring-2 ring-sky-400/30 animate-pulse"
                  title="Refreshing"
                />
              )}
            </span>
          </div>
        </div>
      </header>

      {/* Two-column layout: Arrivals (left) / Departures (right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ARRIVALS */}
        <section className="relative overflow-hidden">
          
          <div className="flex items-center gap-3">
            <img
              src={new URL("./assets/arr.png", import.meta.url).href}
              alt="Arrivals"
              className="h-10 w-10 object-contain"
            />
            <h1 className="text-5xl font-thin tracking-wide text-[#ffd401]">ARRIVALS</h1>
          </div>
       

          {isError && arrFlights.length === 0 ? (
            <div className="p-6 text-rose-400">
              Error loading flights.
              <pre className="mt-2 text-xs text-rose-300 whitespace-pre-wrap">{String(error?.message || error)}</pre>
            </div>
          ) : data ? (
            <FlightTable flights={arrFlights} mode="ARR" />
          ) : (
            <div className="p-6">Loading flights…</div>
          )}
        </section>

        {/* DEPARTURES */}
        <section className="relativeoverflow-hidden ">
          <div className="flex items-center gap-3">
            <img
              src={new URL("./assets/dep.png", import.meta.url).href}
              alt="Arrivals"
              className="h-10 w-10 object-contain"
            />
            <h1 className="text-5xl font-thin tracking-wide text-[#ffd401]">DEPARTURES</h1>
          </div>

          {isError && depFlights.length === 0 ? (
            <div className="p-6 text-rose-400">
              Error loading flights.
              <pre className="mt-2 text-xs text-rose-300 whitespace-pre-wrap">{String(error?.message || error)}</pre>
            </div>
          ) : data ? (
            <FlightTable flights={depFlights} mode="DEP" />
          ) : (
            <div className="p-6">Loading flights…</div>
          )}
        </section>
      </div>
    </div>
  );
}

function FlightTable({ flights, mode = "ARR" }) {
  return (
    <div className="w-full mt-8">
      <table className="hidden md:table w-full border-collapse table-auto border-0">
        <thead className="bg-[#002B55]">
          <tr className="text-left text-white">
            <Th>Airline</Th>
            <Th>Flight</Th>
            <Th>{mode === "ARR" ? "From" : "To"}</Th>
            <Th>Sched</Th>
            <Th>Est</Th>
            <Th>Gate</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {flights.map((f) => (
            <tr key={f.id} className="border-t border-stone-300/60 bg-[#002B55] first:border-t-0">
              <Td className="leading-none text-left">
                <div className="h-12 w-12 flex items-center justify-center">
                  {logos[f.carrierCode] ? (
                    <img
                      src={logos[f.carrierCode]}
                      alt={f.airline || "Airline logo"}
                      className="h-12 w-12 object-contain"
                    />
                  ) : (
                    <div
                      className="h-12 w-12 bg-white rounded flex items-center justify-center uppercase text-[10px] tracking-widest text-stone-800"
                      title={f.airline || "Airline logo"}
                      aria-label={f.airline || "Airline logo"}
                    >
                      LOGO
                    </div>
                  )}
                </div>
              </Td>
              <Td className="leading-none">
                <div className="min-w-[6ch]">
                  <SplitFlapNumber value={f.flightNo}  size="M" />
                </div>
              </Td>
              <Td className="leading-none">
                <div className="min-w-[4ch]">
                  <SplitFlapPlace value={mode === "ARR" ? (f.origin || "—") : (f.destination || "—")} size="M" />
                </div>
              </Td>
              <Td className="leading-none">
                <SplitFlapTime value={f.sched} size="M" />
              </Td>
              <Td className="leading-none">
                {f.est ? (
                  <SplitFlapTime value={f.est} size="M" />
                ) : (
                  <span className="text-stone-400">—</span>
                )}
              </Td>
              <Td className="leading-none">
                <div className="min-w-[3ch]">
                  {f.gate ? (
                    <SplitFlapGate value={f.gate} min={2} size="M" />
                  ) : (
                    <span className="text-transparent">--</span>
                  )}
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
            <div className="mt-1">
              <div className="h-10 w-10 flex items-center justify-center">
                {logos[f.carrierCode] ? (
                  <img
                    src={logos[f.carrierCode]}
                    alt={f.airline || "Airline logo"}
                    className="h-10 w-10 object-contain"
                  />
                ) : (
                  <div
                    className="h-10 w-10 bg-stone-700/60 rounded flex items-center justify-center uppercase text-[9px] tracking-widest text-stone-300"
                    title={f.airline || "Airline logo"}
                    aria-label={f.airline || "Airline logo"}
                  >
                    LOGO
                  </div>
                )}
              </div>
            </div>
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
  return <th className="py-2 px-0 text-xl font-semibold tracking-wide">{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`py-2 px-0 text-sm whitespace-nowrap ${className}`}>{children}</td>;
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