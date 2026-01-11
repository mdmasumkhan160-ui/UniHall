import React, { useEffect, useMemo, useState } from "react";
import api from "../../lib/apiClient.js";
import { useAuth } from "../../context/AuthContext.jsx";

const prettyStatus = (s) => {
  const raw = String(s || "").trim();
  if (!raw) return "—";
  const lowered = raw.toLowerCase();
  if (lowered === "alloted") return "Alloted";
  if (lowered === "not-alloted") return "Not-Alloted";
  return lowered
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const normalizeProgramLevel = (value) => {
  const v = String(value || "")
    .trim()
    .toLowerCase();
  if (v === "undergrad" || v === "undergraduate") return "undergraduate";
  if (v === "masters" || v === "master") return "masters";
  if (v === "phd") return "phd";
  return "";
};

const getCandidateProgramLevel = (candidate) => {
  const direct = normalizeProgramLevel(candidate?.student?.programLevel);
  if (direct) return direct;

  const id = String(
    candidate?.student?.userId || candidate?.student?.studentId || ""
  );
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id
    );
  if (isUuid) return "";
  return "undergraduate";
};

export default function ManageAllocations() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const [manualSearching, setManualSearching] = useState(false);
  const [manualResults, setManualResults] = useState([]);
  const [manualSelected, setManualSelected] = useState(null);
  const [manualRoomId, setManualRoomId] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [manualAssigning, setManualAssigning] = useState(false);

  const [filterProgramLevel, setFilterProgramLevel] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterSession, setFilterSession] = useState("all");
  const [roomDraft, setRoomDraft] = useState({});
  const [assigning, setAssigning] = useState({});
  const [waiting, setWaiting] = useState({});

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const [candRes, roomRes] = await Promise.all([
        api.get("/allocations/candidates"),
        api.get("/rooms"),
      ]);
      setCandidates(candRes.data?.data || []);
      setRooms(roomRes.data?.data || []);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "Failed to load seat allocation candidates"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.hallId]);

  const availableRooms = useMemo(() => {
    const list = Array.isArray(rooms) ? rooms : [];
    return list
      .filter((r) => {
        const capacity = Number(r.capacity || 0);
        const occ = Number(r.currentOccupancy || 0);
        const status = String(r.status || "").toUpperCase();
        if (capacity <= 0) return false;
        if (occ >= capacity) return false;
        if (
          status === "MAINTENANCE" ||
          status === "UNDER_REPAIR" ||
          status === "RESERVED"
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const fa = Number(a.floorNumber || 0);
        const fb = Number(b.floorNumber || 0);
        if (fa !== fb) return fa - fb;
        return String(a.roomNumber || "").localeCompare(
          String(b.roomNumber || "")
        );
      });
  }, [rooms]);

  const departments = useMemo(() => {
    const set = new Set();
    (candidates || []).forEach((c) => {
      const dept = c?.student?.department;
      if (dept) set.add(dept);
    });
    return Array.from(set).sort();
  }, [candidates]);

  const sessions = useMemo(() => {
    const set = new Set();
    (candidates || []).forEach((c) => {
      const sess = c?.student?.session;
      if (sess) set.add(sess);
    });
    return Array.from(set).sort();
  }, [candidates]);

  const visibleCandidates = useMemo(() => {
    let list = Array.isArray(candidates) ? candidates : [];
    if (filterProgramLevel !== "all") {
      list = list.filter(
        (c) => getCandidateProgramLevel(c) === filterProgramLevel
      );
    }
    if (filterDepartment !== "all") {
      list = list.filter((c) => c?.student?.department === filterDepartment);
    }
    if (filterSession !== "all") {
      list = list.filter((c) => c?.student?.session === filterSession);
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      const aTotal =
        Number(a?.applicationScore || 0) +
        Number(a?.interview?.interviewScore || 0);
      const bTotal =
        Number(b?.applicationScore || 0) +
        Number(b?.interview?.interviewScore || 0);
      return bTotal - aTotal;
    });
    return sorted;
  }, [candidates, filterDepartment, filterProgramLevel, filterSession]);

  const assignRoom = async (applicationId) => {
    const roomId = String(roomDraft[applicationId] || "").trim();
    if (!roomId) {
      alert("Please select a room");
      return;
    }

    setAssigning((s) => ({ ...s, [applicationId]: true }));
    setError("");
    try {
      await api.post("/allocations/assign", { applicationId, roomId });
      setRoomDraft((d) => {
        const next = { ...d };
        delete next[applicationId];
        return next;
      });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to assign room");
    } finally {
      setAssigning((s) => ({ ...s, [applicationId]: false }));
    }
  };

  const waitCandidate = async (applicationId) => {
    if (!applicationId) return;
    setWaiting((s) => ({ ...s, [applicationId]: true }));
    setError("");
    try {
      await api.post("/waitlist", { applicationId });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to add to waiting list");
    } finally {
      setWaiting((s) => ({ ...s, [applicationId]: false }));
    }
  };

  const searchManualStudent = async () => {
    const q = String(manualQuery || "").trim();
    if (!q) {
      setManualResults([]);
      setManualSelected(null);
      return;
    }

    setManualSearching(true);
    setError("");
    try {
      const res = await api.get("/allocations/manual-search", {
        params: { studentId: q },
      });
      const list = res.data?.data || [];
      setManualResults(list);
      setManualSelected(list[0] || null);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to search students");
    } finally {
      setManualSearching(false);
    }
  };

  const submitManualAllocation = async () => {
    const studentId = manualSelected?.studentId;
    if (!studentId) {
      alert("Select a student");
      return;
    }
    const roomId = String(manualRoomId || "").trim();
    if (!roomId) {
      alert("Select a room");
      return;
    }
    const cleanReason = String(manualReason || "").trim();
    if (!cleanReason) {
      alert("Reason is required for manual allocation");
      return;
    }

    setManualAssigning(true);
    setError("");
    try {
      await api.post("/allocations/manual-assign", {
        studentId,
        roomId,
        reason: cleanReason,
      });
      setManualQuery("");
      setManualResults([]);
      setManualSelected(null);
      setManualRoomId("");
      setManualReason("");
      setManualOpen(false);
      await load();
      alert(
        "Manual allocation completed. Check Manage Allocation to edit/cancel."
      );
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to manually allocate");
    } finally {
      setManualAssigning(false);
    }
  };

  return (
    <div
      className="rounded-lg shadow p-6"
      style={{ backgroundColor: "#013A63" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Seat Allocation</h1>
          <p className="text-white">
            Candidates appear here after interview score is saved and confirmed.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setManualOpen((v) => !v)}
            className="px-4 py-2 bg-[#2C7DA0]/40 backdrop-blur-md border border-[#2C7DA0]/50 rounded-full text-sm text-white font-medium hover:bg-[#123C69]/60 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Manual Allocation
          </button>
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 bg-sky-400/40 backdrop-blur-md border border-sky-500/50 rounded-full text-sm text-white font-medium hover:bg-sky-400/60 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {manualOpen && (
        <section className="mt-4 bg-white border-2 border-gray-200 rounded-xl p-4 space-y-3">
          <div className="text-sm font-semibold text-gray-900">
            Manual Allocation
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-600">
                Search Student ID
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  placeholder="e.g. MUH2225001M"
                  className="w-full border rounded px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={searchManualStudent}
                  disabled={manualSearching}
                  className="px-4 py-2 text-sm rounded bg-[#2C7DA0] text-white hover:bg-[#123C69] disabled:opacity-60"
                >
                  {manualSearching ? "Searching…" : "Search"}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">
                Select Room
              </label>
              <select
                value={manualRoomId}
                onChange={(e) => setManualRoomId(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm mt-1"
              >
                <option value="">Select a room</option>
                {availableRooms.map((r) => (
                  <option key={r.roomId} value={r.roomId}>
                    Room {r.roomNumber} (Floor {r.floorNumber}) —{" "}
                    {r.currentOccupancy}/{r.capacity}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {manualResults.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="text-xs font-semibold text-gray-600 mb-2">
                Search Results
              </div>
              <div className="space-y-2">
                {manualResults.map((s) => (
                  <label
                    key={s.userId}
                    className="flex items-start gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="manualStudent"
                      checked={
                        String(manualSelected?.userId) === String(s.userId)
                      }
                      onChange={() => setManualSelected(s)}
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {s.name} — {s.studentId}
                      </div>
                      <div className="text-xs text-gray-500">
                        {s.department || "—"} • {s.session || "—"}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-600">
              Reason (required)
            </label>
            <textarea
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value)}
              rows={3}
              className="w-full border rounded px-3 py-2 text-sm mt-1"
              placeholder="Reason for manual allocation"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setManualOpen(false)}
              className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitManualAllocation}
              disabled={manualAssigning}
              className="px-4 py-2 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {manualAssigning ? "Allocating…" : "Allocate"}
            </button>
          </div>
        </section>
      )}

      <section className="mt-4 bg-blue-800 border-2 border-blue-800 rounded-xl p-4 space-y-3">
        <div className="text-sm font-semibold text-white">
          Candidate Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={filterProgramLevel}
            onChange={(e) => setFilterProgramLevel(e.target.value)}
            className="border rounded px-3 py-2 text-sm bg-[#2C7DA0] text-white font-medium shadow-md hover:bg-[#123C69] transform hover:scale-105 transition-all duration-200 cursor-pointer"
          >
            <option value="all">All Programs</option>
            <option value="undergraduate">Undergraduate</option>
            <option value="masters">Masters</option>
            <option value="phd">PhD</option>
          </select>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="border rounded px-3 py-2 text-sm bg-[#123C69] text-white font-medium shadow-md hover:bg-[#0b3350] transform hover:scale-105 transition-all duration-200 cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <select
            value={filterSession}
            onChange={(e) => setFilterSession(e.target.value)}
            className="border rounded px-3 py-2 text-sm bg-[#2C7DA0] text-white font-medium shadow-md hover:bg-[#123C69] transform hover:scale-105 transition-all duration-200 cursor-pointer"
          >
            <option value="all">All Sessions</option>
            {sessions.map((session) => (
              <option key={session} value={session}>
                {session}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setFilterProgramLevel("all");
              setFilterDepartment("all");
              setFilterSession("all");
            }}
            className="px-3 py-2 bg-[#2C7DA0] text-white rounded text-sm font-medium hover:bg-[#123C69] shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Reset Filters
          </button>
        </div>
      </section>

      {/* Mobile cards */}
      <div className="mt-4 space-y-3 md:hidden">
        {loading && (
          <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
            Loading…
          </div>
        )}
        {!loading && visibleCandidates.length === 0 && (
          <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
            No candidates ready for seat allocation yet.
          </div>
        )}
        {!loading &&
          visibleCandidates.map((c) => {
            const totalScore =
              Number(c?.applicationScore || 0) +
              Number(c?.interview?.interviewScore || 0);
            const appId = c?.applicationId;

            return (
              <div
                key={appId}
                className="rounded border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {c?.student?.name || "—"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {c?.student?.studentId || "—"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Dept</div>
                    <div className="text-gray-900">
                      {c?.student?.department || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Session</div>
                    <div className="text-gray-900">
                      {c?.student?.session || "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xs text-gray-500">Total Score</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {totalScore}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Assign Room</div>
                  <div className="flex flex-col gap-2">
                    <select
                      value={roomDraft[appId] ?? ""}
                      onChange={(e) =>
                        setRoomDraft((d) => ({
                          ...d,
                          [appId]: e.target.value,
                        }))
                      }
                      className="border rounded px-3 py-2 text-sm"
                    >
                      <option value="">Select a room</option>
                      {availableRooms.map((r) => (
                        <option key={r.roomId} value={r.roomId}>
                          Room {r.roomNumber} (Floor {r.floorNumber}) —{" "}
                          {r.currentOccupancy}/{r.capacity}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => assignRoom(appId)}
                      disabled={!!assigning[appId]}
                      className="w-full px-3 py-2 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {assigning[appId] ? "Assigning…" : "Assign"}
                    </button>
                    <button
                      type="button"
                      onClick={() => waitCandidate(appId)}
                      disabled={!!waiting[appId] || !!assigning[appId]}
                      className="w-full px-3 py-2 text-sm rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
                    >
                      {waiting[appId] ? "Waiting…" : "Wait"}
                    </button>
                    {availableRooms.length === 0 && (
                      <div className="text-xs text-gray-500">
                        No available rooms.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Desktop table */}
      <div className="mt-4 border border-gray-200 rounded hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-800 text-white">
              <th className="text-left px-3 py-2 font-bold">Student</th>
              <th className="text-left px-3 py-2 font-bold">Student ID</th>
              <th className="text-left px-3 py-2 font-bold">Dept</th>
              <th className="text-left px-3 py-2 font-bold">Session</th>
              <th className="text-left px-3 py-2 font-bold">Total Score</th>
              <th className="text-left px-3 py-2 font-bold">Assign Room</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-3 py-3 text-gray-500" colSpan={6}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && visibleCandidates.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-white font-bold" colSpan={6}>
                  No candidates ready for seat allocation yet.
                </td>
              </tr>
            )}
            {!loading &&
              visibleCandidates.map((c, idx) => {
                const rowBg = idx % 2 === 0 ? "bg-white" : "bg-blue-100";
                const totalScore =
                  Number(c?.applicationScore || 0) +
                  Number(c?.interview?.interviewScore || 0);
                const appId = c?.applicationId;
                return (
                  <tr
                    key={appId}
                    className={`border-t border-gray-200 ${rowBg}`}
                  >
                    <td className="px-3 py-2">{c?.student?.name || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {c?.student?.studentId || "—"}
                    </td>
                    <td className="px-3 py-2">
                      {c?.student?.department || "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {c?.student?.session || "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap font-semibold">
                      {totalScore}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={roomDraft[appId] ?? ""}
                          onChange={(e) =>
                            setRoomDraft((d) => ({
                              ...d,
                              [appId]: e.target.value,
                            }))
                          }
                          className="border rounded px-2 py-1"
                        >
                          <option value="">Select a room</option>
                          {availableRooms.map((r) => (
                            <option key={r.roomId} value={r.roomId}>
                              Room {r.roomNumber} (Floor {r.floorNumber}) —{" "}
                              {r.currentOccupancy}/{r.capacity}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => assignRoom(appId)}
                          disabled={!!assigning[appId]}
                          className="px-3 py-1.5 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {assigning[appId] ? "Assigning…" : "Assign"}
                        </button>
                        <button
                          type="button"
                          onClick={() => waitCandidate(appId)}
                          disabled={!!waiting[appId] || !!assigning[appId]}
                          className="px-3 py-1.5 text-xs rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
                        >
                          {waiting[appId] ? "Waiting…" : "Wait"}
                        </button>
                      </div>
                      {availableRooms.length === 0 && (
                        <div className="mt-1 text-xs text-gray-500">
                          No available rooms.
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
