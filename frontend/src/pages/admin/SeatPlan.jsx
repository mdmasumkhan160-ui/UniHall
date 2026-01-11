import React, { useMemo, useState } from "react";
import * as api from "../../lib/mockApi.js";
import { useAuth } from "../../context/AuthContext.jsx";

const statuses = ["Available", "Occupied", "Reserved", "Maintenance"];

export default function SeatPlan() {
  const { user } = useAuth();
  const hallId = user?.hallId;
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [seats, setSeats] = useState(api.listSeats({ hallId }));

  const filtered = useMemo(
    () =>
      seats.filter((s) => {
        const text = `${s.hall}-${s.floor}-${s.room}-${s.bed}`.toLowerCase();
        const passText = text.includes(query.toLowerCase());
        const passStatus = filterStatus ? s.status === filterStatus : true;
        return passText && passStatus;
      }),
    [seats, query, filterStatus]
  );

  const update = (id, patch) => {
    api.updateSeat(id, patch);
    setSeats(api.listSeats({ hallId }));
  };

  const refreshSeats = () => setSeats(api.listSeats({ hallId }));

  return (
    <div
      className="rounded-lg shadow p-6"
      style={{ backgroundColor: "#013A63" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Seat Plan</h1>
          <p className="text-white">Manage seat plan overview</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={refreshSeats}
            className="px-4 py-2 bg-[#2C7DA0]/40 backdrop-blur-md border border-[#2C7DA0]/50 rounded-full text-sm text-white font-medium hover:bg-[#123C69]/60 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Refresh
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 items-center">
        <input
          className="border rounded px-3 py-2"
          placeholder="Search (e.g., A-1-101)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((s) => (
          <div key={s.id} className="border rounded p-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="font-medium">
                {s.hallId} • {s.floor}-{s.room}-{s.bed}
              </div>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={s.status}
                onChange={(e) => update(s.id, { status: e.target.value })}
              >
                {statuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Room {s.room}, Floor {s.floor}, Bed {s.bed}
            </div>
            <div className="mt-2 text-sm">
              <label className="grid gap-1">
                <span className="text-gray-700">Student ID</span>
                <input
                  className="border rounded px-2 py-1"
                  value={s.studentId || ""}
                  onChange={(e) => update(s.id, { studentId: e.target.value })}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
