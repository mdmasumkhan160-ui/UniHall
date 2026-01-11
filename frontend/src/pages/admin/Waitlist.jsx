import React, { useEffect, useMemo, useState } from "react";
import api from "../../lib/apiClient.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Waitlist() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [searchStudentId, setSearchStudentId] = useState("");
  const [selected, setSelected] = useState({});
  const [deleting, setDeleting] = useState(false);
  const [assigning, setAssigning] = useState({});
  const [roomDraft, setRoomDraft] = useState({});

  const load = async (opts = {}) => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const studentIdValue =
        typeof opts.studentId === "string" ? opts.studentId : searchStudentId;
      const trimmedStudentId = String(studentIdValue || "").trim();

      const [wlRes, roomRes] = await Promise.all([
        api.get("/waitlist", {
          params: {
            studentId: trimmedStudentId || undefined,
          },
        }),
        api.get("/rooms"),
      ]);
      setEntries(wlRes.data?.data || []);
      setRooms(roomRes.data?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load waiting list");
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

  const entryIds = useMemo(() => {
    return (entries || []).map((e) => e.entryId).filter(Boolean);
  }, [entries]);

  const selectedCount = useMemo(() => {
    return Object.values(selected || {}).filter(Boolean).length;
  }, [selected]);

  const downloadWaitlistCsv = () => {
    const list = Array.isArray(entries) ? entries : [];
    if (list.length === 0) return;

    const selectedIds = new Set(
      Object.entries(selected || {})
        .filter(([, v]) => !!v)
        .map(([k]) => k)
    );
    const rows = selectedIds.size
      ? list.filter((e) => selectedIds.has(e?.entryId))
      : list;

    const headers = [
      "Entry ID",
      "Student ID",
      "Student Name",
      "Email",
      "Department",
      "Session",
      "Position",
      "Score",
    ];

    const esc = (v) => {
      const s = String(v ?? "");
      return `"${s.replace(/"/g, '""')}"`;
    };

    const lines = [
      headers.map(esc).join(","),
      ...rows.map((e) => {
        const st = e?.student || {};
        return [
          e?.entryId,
          st?.studentId,
          st?.name,
          st?.email,
          st?.department,
          st?.session,
          e?.position,
          e?.score,
        ]
          .map(esc)
          .join(",");
      }),
    ];

    const csv = `\uFEFF${lines.join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `waiting_list_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const allSelected = useMemo(() => {
    if (!entryIds.length) return false;
    return entryIds.every((id) => !!selected[id]);
  }, [entryIds, selected]);

  const toggleSelect = (entryId) => {
    setSelected((s) => ({ ...s, [entryId]: !s?.[entryId] }));
  };

  const toggleSelectAll = () => {
    setSelected((s) => {
      const next = { ...(s || {}) };
      const target = !allSelected;
      entryIds.forEach((id) => {
        next[id] = target;
      });
      return next;
    });
  };

  const deleteSelected = async () => {
    const ids = Object.entries(selected || {})
      .filter(([, v]) => !!v)
      .map(([k]) => k);
    if (!ids.length) return;

    const ok = window.confirm(
      `Delete ${ids.length} selected student(s) from waiting list?`
    );
    if (!ok) return;

    setDeleting(true);
    setError("");
    try {
      await api.delete("/waitlist", { data: { entryIds: ids } });
      setSelected({});
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delete waitlist");
    } finally {
      setDeleting(false);
    }
  };

  const assignFromWaitlist = async (entryId) => {
    const roomId = String(roomDraft[entryId] || "").trim();
    if (!roomId) {
      alert("Select a room");
      return;
    }

    setAssigning((s) => ({ ...s, [entryId]: true }));
    setError("");
    try {
      await api.post(`/waitlist/${entryId}/assign`, { roomId });
      setRoomDraft((d) => {
        const next = { ...d };
        delete next[entryId];
        return next;
      });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to assign from waitlist");
    } finally {
      setAssigning((s) => ({ ...s, [entryId]: false }));
    }
  };

  return (
    <div
      className="rounded-lg shadow p-6"
      style={{ backgroundColor: "#013A63" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Waiting List</h1>
          <p className="text-white">
            Students marked as “Wait” from Seat Allocation.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={downloadWaitlistCsv}
            disabled={loading || entries.length === 0}
            className="px-4 py-2 rounded text-sm text-white font-bold disabled:opacity-60 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            style={{ backgroundColor: "#2C7DA0" }}
            title={
              selectedCount
                ? `Download selected (${selectedCount})`
                : "Download all"
            }
          >
            Download{selectedCount ? ` (${selectedCount})` : ""}
          </button>
          <button
            type="button"
            onClick={deleteSelected}
            disabled={selectedCount === 0 || deleting}
            className="px-4 py-2 bg-red-600 rounded text-sm text-white font-bold hover:bg-red-700 disabled:opacity-60 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            {deleting
              ? "Deleting…"
              : `Delete Selected${selectedCount ? ` (${selectedCount})` : ""}`}
          </button>
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 rounded text-sm text-white font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            style={{ backgroundColor: "#0077B6" }}
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

      <section className="mt-4 bg-white border-2 border-gray-200 rounded-xl p-4 space-y-3">
        <div className="text-sm font-semibold text-gray-900">Search</div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-7">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Student ID
            </label>
            <input
              type="search"
              value={searchStudentId}
              onChange={(e) => setSearchStudentId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
              placeholder="Type Student ID and press Enter"
              autoComplete="off"
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <div className="mt-1 text-xs text-gray-500">
              Searches by university ID or user ID.
            </div>
          </div>
          <div className="md:col-span-5 flex gap-2">
            <button
              type="button"
              onClick={load}
              className="flex-1 px-4 py-2 text-sm rounded bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-60 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              disabled={loading}
            >
              {loading ? "Searching…" : "Search"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchStudentId("");
                setSelected({});
                load({ studentId: "" });
              }}
              className="px-4 py-2 rounded text-sm text-white font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              style={{ backgroundColor: "#00B4D8" }}
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* Mobile cards */}
      <div className="mt-4 space-y-3 md:hidden">
        {loading && (
          <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
            Loading…
          </div>
        )}
        {!loading && entries.length === 0 && (
          <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
            No students on waiting list.
          </div>
        )}
        {!loading &&
          entries.map((e) => {
            const entryId = e?.entryId;
            const draft = roomDraft[entryId] ?? "";
            return (
              <div
                key={entryId}
                className="rounded border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={!!selected[entryId]}
                      onChange={() => toggleSelect(entryId)}
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {e?.student?.name || "—"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {e?.student?.studentId || "—"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Pos: {e?.position ?? "—"} • Score: {e?.score ?? "—"}
                      </div>
                    </div>
                  </label>
                </div>

                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Assign Room</div>
                  <select
                    value={draft}
                    onChange={(ev) =>
                      setRoomDraft((d) => ({
                        ...d,
                        [entryId]: ev.target.value,
                      }))
                    }
                    className="border rounded px-3 py-2 text-sm w-full"
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

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => assignFromWaitlist(entryId)}
                    disabled={!!assigning[entryId]}
                    className="w-full px-3 py-2 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {assigning[entryId] ? "Assigning…" : "Assign"}
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Desktop table */}
      <div className="mt-4 border border-gray-200 rounded hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-800 text-white">
              <th className="text-left px-3 py-2 font-bold">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th className="text-left px-3 py-2 font-bold">Student</th>
              <th className="text-left px-3 py-2 font-bold">Student ID</th>
              <th className="text-left px-3 py-2 font-bold">Department</th>
              <th className="text-left px-3 py-2 font-bold">Session</th>
              <th className="text-left px-3 py-2 font-bold">Position</th>
              <th className="text-left px-3 py-2 font-bold">Score</th>
              <th className="text-left px-3 py-2 font-bold">Assign Room</th>
              <th className="text-left px-3 py-2 font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-3 py-3 text-gray-500" colSpan={9}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && entries.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-gray-500" colSpan={9}>
                  No students on waiting list.
                </td>
              </tr>
            )}
            {!loading &&
              entries.map((e, idx) => {
                const rowBg = idx % 2 === 0 ? "bg-white" : "bg-blue-50";
                const entryId = e?.entryId;
                const draft = roomDraft[entryId] ?? "";
                return (
                  <tr
                    key={entryId}
                    className={`border-t border-gray-200 ${rowBg}`}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={!!selected[entryId]}
                        onChange={() => toggleSelect(entryId)}
                        aria-label="Select entry"
                      />
                    </td>
                    <td className="px-3 py-2">{e?.student?.name || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {e?.student?.studentId || "—"}
                    </td>
                    <td className="px-3 py-2">
                      {e?.student?.department || "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {e?.student?.session || "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {e?.position ?? "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap font-semibold">
                      {e?.score ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={draft}
                        onChange={(ev) =>
                          setRoomDraft((d) => ({
                            ...d,
                            [entryId]: ev.target.value,
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
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => assignFromWaitlist(entryId)}
                        disabled={!!assigning[entryId]}
                        className="px-3 py-1.5 text-xs rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-60 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        {assigning[entryId] ? "Assigning…" : "Assign"}
                      </button>
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
