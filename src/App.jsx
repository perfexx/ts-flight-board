import React from "react";

export default function App() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Arrivals & Departures</h1>
        <span className="text-sm text-slate-400">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </header>
      <div className="bg-slate-800 rounded-lg p-4">
        <p className="text-slate-300">
          🚀 Flight data will appear here once we hook up the API.
        </p>
      </div>
    </div>
  );
}
