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

export default function ManageAllocatedSeats() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [allocations, setAllocations] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyItems, setHistoryItems] = useState([]);
  const [historyDownloading, setHistoryDownloading] = useState(false);

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentModalLoading, setStudentModalLoading] = useState(false);
  const [studentModalError, setStudentModalError] = useState("");
  const [studentProfile, setStudentProfile] = useState(null);
  const [studentRecords, setStudentRecords] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedStudentBasic, setSelectedStudentBasic] = useState(null);

  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterSession, setFilterSession] = useState("all");
  const [filterRoomQuery, setFilterRoomQuery] = useState("");
  const [filterManualOnly, setFilterManualOnly] = useState(false);
  const [filterStudentId, setFilterStudentId] = useState("");

  const [selected, setSelected] = useState({});
  const [bulkCanceling, setBulkCanceling] = useState(false);
  const [bulkCancelOpen, setBulkCancelOpen] = useState(false);
  const [bulkCancelReason, setBulkCancelReason] = useState("");

  const [allocationRoomDraft, setAllocationRoomDraft] = useState({});
  const [updatingAllocation, setUpdatingAllocation] = useState({});
  const [vacatingAllocation, setVacatingAllocation] = useState({});

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const [allocRes, roomRes] = await Promise.all([
        api.get("/allocations"),
        api.get("/rooms"),
      ]);
      setAllocations(allocRes.data?.data || []);
      setRooms(roomRes.data?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load allocations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.hallId]);

  const loadHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const res = await api.get("/allocations", {
        params: { statuses: "VACATED" },
      });
      const rows = res.data?.data || [];
      setHistoryItems(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setHistoryError(
        e?.response?.data?.message || "Failed to load cancelled seat history"
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!historyOpen) return;
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyOpen, user?.hallId]);

  const downloadHistoryPdf = async () => {
    setHistoryDownloading(true);
    setHistoryError("");
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });
      doc.setFontSize(16);
      doc.text("Cancelled Seat History", 40, 40);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);

      const rows = (visibleHistoryItems || []).map((a) => {
        const student = a?.student || {};
        const room = a?.room || {};
        const when = a?.vacatedDate || a?.updatedAt || a?.endDate || "";
        const reason = a?.vacationReason || "—";
        return [
          student.studentId || "—",
          student.name || "—",
          student.department || "—",
          student.session || "—",
          room.roomNumber || "—",
          when ? new Date(when).toLocaleString() : "—",
          reason,
        ];
      });

      autoTable(doc, {
        startY: 80,
        head: [
          [
            "Student ID",
            "Name",
            "Department",
            "Session",
            "Room",
            "Cancelled At",
            "Reason",
          ],
        ],
        body: rows,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [16, 185, 129] },
        alternateRowStyles: { fillColor: [245, 253, 249] },
      });

      const filename = `cancelled-seat-history-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      doc.save(filename);
    } catch (e) {
      setHistoryError(e?.message || "Failed to generate PDF");
    } finally {
      setHistoryDownloading(false);
    }
  };

  const openStudentDetails = (student) => {
    const sid =
      student?.studentId ||
      student?.universityId ||
      student?.userId ||
      student?.id ||
      null;
    if (!sid) return;
    setSelectedStudentId(String(sid));
    setSelectedStudentBasic(student || null);
    setStudentModalOpen(true);
  };

  useEffect(() => {
    if (!studentModalOpen || !selectedStudentId || !user) return;

    let cancelled = false;
    (async () => {
      setStudentModalLoading(true);
      setStudentModalError("");
      try {
        const sid = String(selectedStudentId);
        const [profileRes, recordsRes] = await Promise.all([
          api.get(`/students/${encodeURIComponent(sid)}/profile`),
          api.get("/disciplinary-records", { params: { studentId: sid } }),
        ]);

        if (cancelled) return;
        setStudentProfile(profileRes.data?.data || null);
        setStudentRecords(recordsRes.data?.data || []);
      } catch (e) {
        if (cancelled) return;
        setStudentProfile(null);
        setStudentRecords([]);
        setStudentModalError(
          e?.response?.data?.message || "Failed to load student details"
        );
      } finally {
        if (!cancelled) setStudentModalLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [studentModalOpen, selectedStudentId, user]);

  const departments = useMemo(() => {
    const set = new Set();
    const all = [...(allocations || []), ...(historyItems || [])];
    all.forEach((a) => {
      const dept = a?.student?.department;
      if (dept) set.add(dept);
    });
    return Array.from(set).sort();
  }, [allocations, historyItems]);

  const sessions = useMemo(() => {
    const set = new Set();
    const all = [...(allocations || []), ...(historyItems || [])];
    all.forEach((a) => {
      const sess = a?.student?.session;
      if (sess) set.add(sess);
    });
    return Array.from(set).sort();
  }, [allocations, historyItems]);

  const visibleAllocations = useMemo(() => {
    let list = Array.isArray(allocations) ? allocations : [];
    if (filterDepartment !== "all") {
      list = list.filter((a) => a?.student?.department === filterDepartment);
    }
    if (filterSession !== "all") {
      list = list.filter((a) => a?.student?.session === filterSession);
    }
    const roomQ = String(filterRoomQuery || "")
      .trim()
      .toLowerCase();
    if (roomQ) {
      list = list.filter((a) =>
        String(a?.room?.roomNumber ?? "")
          .trim()
          .toLowerCase()
          .includes(roomQ)
      );
    }
    if (filterManualOnly) {
      list = list.filter((a) => String(a?.reason || "").trim().length > 0);
    }
    const q = String(filterStudentId || "")
      .trim()
      .toLowerCase();
    if (q) {
      list = list.filter((a) =>
        String(a?.student?.studentId || "")
          .toLowerCase()
          .includes(q)
      );
    }
    return list;
  }, [
    allocations,
    filterDepartment,
    filterSession,
    filterRoomQuery,
    filterManualOnly,
    filterStudentId,
  ]);

  const visibleHistoryItems = useMemo(() => {
    let list = Array.isArray(historyItems) ? historyItems : [];
    if (filterDepartment !== "all") {
      list = list.filter((a) => a?.student?.department === filterDepartment);
    }
    if (filterSession !== "all") {
      list = list.filter((a) => a?.student?.session === filterSession);
    }
    const roomQ = String(filterRoomQuery || "")
      .trim()
      .toLowerCase();
    if (roomQ) {
      list = list.filter((a) =>
        String(a?.room?.roomNumber ?? "")
          .trim()
          .toLowerCase()
          .includes(roomQ)
      );
    }
    if (filterManualOnly) {
      list = list.filter((a) => String(a?.reason || "").trim().length > 0);
    }
    const q = String(filterStudentId || "")
      .trim()
      .toLowerCase();
    if (q) {
      list = list.filter((a) =>
        String(a?.student?.studentId || "")
          .toLowerCase()
          .includes(q)
      );
    }
    return list;
  }, [
    historyItems,
    filterDepartment,
    filterSession,
    filterRoomQuery,
    filterManualOnly,
    filterStudentId,
  ]);

  const visibleAllocationIds = useMemo(() => {
    return (visibleAllocations || [])
      .map((a) => a?.allocationId)
      .filter(Boolean);
  }, [visibleAllocations]);

  const selectedCount = useMemo(() => {
    return Object.values(selected || {}).filter(Boolean).length;
  }, [selected]);

  const allVisibleSelected = useMemo(() => {
    if (!visibleAllocationIds.length) return false;
    return visibleAllocationIds.every((id) => !!selected[id]);
  }, [visibleAllocationIds, selected]);

  const toggleSelect = (allocationId) => {
    setSelected((s) => ({ ...s, [allocationId]: !s?.[allocationId] }));
  };

  const toggleSelectAllVisible = () => {
    setSelected((s) => {
      const next = { ...(s || {}) };
      const target = !allVisibleSelected;
      visibleAllocationIds.forEach((id) => {
        next[id] = target;
      });
      return next;
    });
  };

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

  const updateAllocationRoom = async (allocationId) => {
    const roomId = String(allocationRoomDraft[allocationId] || "").trim();
    if (!roomId) {
      alert("Please select a new room");
      return;
    }

    setUpdatingAllocation((s) => ({ ...s, [allocationId]: true }));
    setError("");
    try {
      await api.put(`/allocations/${allocationId}`, { roomId });
      setAllocationRoomDraft((d) => {
        const next = { ...d };
        delete next[allocationId];
        return next;
      });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update allocation");
    } finally {
      setUpdatingAllocation((s) => ({ ...s, [allocationId]: false }));
    }
  };

  const cancelAllocation = async (allocationId) => {
    const reason = window.prompt(
      "Cancel this seat allocation?\n\nOptional: enter a reason.",
      ""
    );
    if (reason === null) return;

    setVacatingAllocation((s) => ({ ...s, [allocationId]: true }));
    setError("");
    try {
      await api.delete(`/allocations/${allocationId}`, {
        data: { reason: String(reason || "").trim() || null },
      });
      setAllocationRoomDraft((d) => {
        const next = { ...d };
        delete next[allocationId];
        return next;
      });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to cancel allocation");
    } finally {
      setVacatingAllocation((s) => ({ ...s, [allocationId]: false }));
    }
  };

  const cancelSelectedAllocations = async () => {
    const ids = Object.entries(selected || {})
      .filter(([, v]) => !!v)
      .map(([k]) => k);
    if (!ids.length) return;

    setBulkCanceling(true);
    setError("");

    const cleanReason = String(bulkCancelReason || "").trim();
    if (!cleanReason) {
      setBulkCanceling(false);
      setError("Please enter a reason to cancel selected allocations");
      return;
    }
    const failures = [];

    try {
      for (const allocationId of ids) {
        setVacatingAllocation((s) => ({ ...s, [allocationId]: true }));
        try {
          await api.delete(`/allocations/${allocationId}`, {
            data: { reason: cleanReason },
          });
          setSelected((s) => {
            const next = { ...(s || {}) };
            delete next[allocationId];
            return next;
          });
          setAllocationRoomDraft((d) => {
            const next = { ...(d || {}) };
            delete next[allocationId];
            return next;
          });
        } catch (e) {
          failures.push(
            e?.response?.data?.message || `Failed to cancel ${allocationId}`
          );
        } finally {
          setVacatingAllocation((s) => ({ ...s, [allocationId]: false }));
        }
      }

      await load();
      if (failures.length) {
        setError(
          failures.length === 1
            ? failures[0]
            : `${failures.length} cancellations failed. Please retry.`
        );
      } else {
        setBulkCancelOpen(false);
        setBulkCancelReason("");
      }
    } finally {
      setBulkCanceling(false);
    }
  };

  return (
    <div
      className="rounded-lg shadow p-6"
      style={{ backgroundColor: "#013A63" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Allocation</h1>
          <p className="text-white">Edit room assignments or cancel seats.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="px-4 py-2 rounded-full text-sm font-bold text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            Check History
          </button>
          <button
            type="button"
            onClick={() => setBulkCancelOpen((v) => !v)}
            disabled={selectedCount === 0 || bulkCanceling}
            className="px-4 py-2 bg-red-600 border-2 border-red-700 rounded-full text-sm text-white font-bold hover:bg-red-700 disabled:opacity-60 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            {`Cancel Seat${selectedCount ? ` (${selectedCount})` : ""}`}
          </button>
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 bg-[#2C7DA0]/40 backdrop-blur-md border border-[#2C7DA0]/50 rounded-full text-sm text-white font-bold hover:bg-[#123C69]/60 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
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

      {bulkCancelOpen && selectedCount > 0 && (
        <section className="mt-4 bg-white border-2 border-red-200 rounded-xl p-4 space-y-3">
          <div className="text-sm font-semibold text-gray-900">
            Cancel Seat ({selectedCount})
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">
              Reason (required)
            </label>
            <textarea
              value={bulkCancelReason}
              onChange={(e) => setBulkCancelReason(e.target.value)}
              rows={3}
              className="w-full border rounded px-3 py-2 text-sm mt-1"
              placeholder="Reason for canceling the selected allocations"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setBulkCancelOpen(false);
                setBulkCancelReason("");
              }}
              disabled={bulkCanceling}
              className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Close
            </button>
            <button
              type="button"
              onClick={cancelSelectedAllocations}
              disabled={bulkCanceling || !String(bulkCancelReason || "").trim()}
              className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            >
              {bulkCanceling ? "Canceling…" : "Confirm Cancel"}
            </button>
          </div>
        </section>
      )}

      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-emerald-50 via-white to-sky-50 border-b">
              <div>
                <div className="text-lg font-extrabold text-slate-900">
                  Cancelled Seat History
                </div>
                <div className="text-xs text-slate-600">
                  Shows cancelled (VACATED) allocations with reason.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadHistory}
                  disabled={historyLoading}
                  className="h-9 px-3 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {historyLoading ? "Loading…" : "Refresh"}
                </button>
                <button
                  type="button"
                  onClick={downloadHistoryPdf}
                  disabled={historyDownloading || historyLoading}
                  className="h-9 px-3 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm disabled:opacity-60"
                >
                  {historyDownloading ? "Downloading…" : "Download PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="h-9 px-3 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>

            {(historyError || error) && (
              <div className="px-5 pt-4">
                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {historyError || error}
                </div>
              </div>
            )}

            <div className="p-5 space-y-3">
              <div className="text-xs text-slate-600">
                Using current page filters — showing{" "}
                {visibleHistoryItems.length} of {historyItems.length}.
              </div>
              <div className="overflow-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">
                        Student
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Department
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Session
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Room
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Cancelled At
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyLoading ? (
                      <tr>
                        <td
                          className="px-3 py-6 text-center text-slate-500"
                          colSpan={6}
                        >
                          Loading history…
                        </td>
                      </tr>
                    ) : visibleHistoryItems.length ? (
                      visibleHistoryItems.map((a) => {
                        const student = a?.student || {};
                        const room = a?.room || {};
                        const when =
                          a?.vacatedDate || a?.updatedAt || a?.endDate || null;
                        return (
                          <tr
                            key={a?.allocationId}
                            className="hover:bg-slate-50/60"
                          >
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => openStudentDetails(student)}
                                className="text-left"
                                title="View student profile"
                              >
                                <div className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline">
                                  {student.name || "Unknown"}
                                </div>
                                <div className="text-xs text-emerald-700/80 hover:underline">
                                  {student.studentId || "—"}
                                </div>
                              </button>
                            </td>
                            <td className="px-3 py-2 text-slate-800">
                              {student.department || "—"}
                            </td>
                            <td className="px-3 py-2 text-slate-800">
                              {student.session || "—"}
                            </td>
                            <td className="px-3 py-2 text-slate-800">
                              {room.roomNumber ? `${room.roomNumber}` : "—"}
                            </td>
                            <td className="px-3 py-2 text-slate-800">
                              {when ? new Date(when).toLocaleString() : "—"}
                            </td>
                            <td className="px-3 py-2 text-slate-800">
                              {a?.vacationReason || "—"}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          className="px-3 py-6 text-center text-slate-500"
                          colSpan={6}
                        >
                          No cancelled seats match the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {studentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-sky-50 via-white to-emerald-50 border-b">
              <div>
                <div className="text-lg font-extrabold text-slate-900">
                  Student Profile
                </div>
                <div className="text-xs text-slate-600">
                  Profile and disciplinary records
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStudentModalOpen(false);
                  setStudentModalError("");
                }}
                className="h-9 px-3 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            {(studentModalError || error) && (
              <div className="px-5 pt-4">
                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {studentModalError || error}
                </div>
              </div>
            )}

            <div className="p-5 space-y-4">
              {studentModalLoading ? (
                <div className="text-sm text-slate-600">Loading…</div>
              ) : (
                <>
                  <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-200 to-sky-200 flex items-center justify-center text-slate-800 font-extrabold">
                        {String(
                          studentProfile?.name ||
                            selectedStudentBasic?.name ||
                            "S"
                        )
                          .trim()
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-bold text-slate-900 truncate">
                          {studentProfile?.name ||
                            selectedStudentBasic?.name ||
                            "Unknown"}
                        </div>
                        <div className="text-sm text-slate-700">
                          ID: {studentProfile?.studentId || selectedStudentId}
                        </div>
                        <div className="text-sm text-slate-700 truncate">
                          Email:{" "}
                          {studentProfile?.email ||
                            selectedStudentBasic?.email ||
                            "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                        <div className="text-xs font-semibold text-slate-500">
                          Department
                        </div>
                        <div className="font-semibold text-slate-800">
                          {studentProfile?.department ||
                            selectedStudentBasic?.department ||
                            "—"}
                        </div>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                        <div className="text-xs font-semibold text-slate-500">
                          Session
                        </div>
                        <div className="font-semibold text-slate-800">
                          {studentProfile?.sessionYear ||
                            selectedStudentBasic?.session ||
                            "—"}
                        </div>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                        <div className="text-xs font-semibold text-slate-500">
                          Program
                        </div>
                        <div className="font-semibold text-slate-800">
                          {studentProfile?.programLevel || "—"}
                        </div>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                        <div className="text-xs font-semibold text-slate-500">
                          Hall
                        </div>
                        <div className="font-semibold text-slate-800">
                          {studentProfile?.hall?.hallName || "—"}
                          {studentProfile?.hall?.hallCode
                            ? ` (${studentProfile.hall.hallCode})`
                            : ""}
                        </div>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 px-3 py-2 md:col-span-2">
                        <div className="text-xs font-semibold text-slate-500">
                          Address
                        </div>
                        <div className="font-semibold text-slate-800">
                          {studentProfile?.address || "—"}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-extrabold text-slate-900">
                        Disciplinary Records
                      </div>
                      <div className="text-xs text-slate-600">
                        {studentRecords.length} record
                        {studentRecords.length === 1 ? "" : "s"}
                      </div>
                    </div>

                    <div className="mt-3 overflow-auto rounded-xl border border-slate-200">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-slate-700">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold">
                              Date
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Severity
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Title
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentRecords.length ? (
                            studentRecords.map((r) => (
                              <tr
                                key={r.recordId}
                                className="hover:bg-slate-50/60"
                              >
                                <td className="px-3 py-2 whitespace-nowrap text-slate-800">
                                  {r.incidentDate
                                    ? new Date(
                                        r.incidentDate
                                      ).toLocaleDateString()
                                    : "—"}
                                </td>
                                <td className="px-3 py-2 text-slate-800">
                                  {r.severity || "—"}
                                </td>
                                <td className="px-3 py-2 text-slate-900">
                                  <div className="font-semibold">
                                    {r.title || "—"}
                                  </div>
                                  {r.details ? (
                                    <div className="text-xs text-slate-600 mt-0.5 truncate max-w-[520px]">
                                      {r.details}
                                    </div>
                                  ) : null}
                                </td>
                                <td className="px-3 py-2 text-slate-800">
                                  {r.actionTaken || "—"}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                className="px-3 py-6 text-center text-slate-500"
                                colSpan={4}
                              >
                                No disciplinary records found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="mt-4 rounded-2xl border border-white/60 bg-gradient-to-r from-white/95 via-sky-50/80 to-emerald-50/70 p-3 shadow-sm backdrop-blur space-y-3">
        <div className="text-sm font-bold text-slate-800">Filters</div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input
            value={filterStudentId}
            onChange={(e) => setFilterStudentId(e.target.value)}
            placeholder="Search Student ID"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
          <input
            value={filterRoomQuery}
            onChange={(e) => setFilterRoomQuery(e.target.value)}
            placeholder="Search Room No"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer"
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
            className="h-9 w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer"
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
            onClick={() => setFilterManualOnly((v) => !v)}
            className={`h-9 px-2 py-1.5 rounded-lg text-[11px] leading-none font-semibold text-white shadow-md hover:shadow-lg transition-all whitespace-nowrap ${
              filterManualOnly
                ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                : "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700"
            }`}
          >
            Manual Allocation
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterStudentId("");
              setFilterRoomQuery("");
              setFilterDepartment("all");
              setFilterSession("all");
              setFilterManualOnly(false);
              setBulkCancelOpen(false);
              setBulkCancelReason("");
            }}
            className="h-9 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-800 border border-slate-200 bg-gradient-to-r from-white to-slate-50 hover:from-slate-50 hover:to-white shadow-sm hover:shadow-md transition-all"
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
        {!loading && visibleAllocations.length === 0 && (
          <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
            No allocated students yet.
          </div>
        )}
        {!loading &&
          visibleAllocations.map((a) => {
            const allocationId = a?.allocationId;
            const currentRoomId = a?.room?.roomId;
            const draft = allocationRoomDraft[allocationId] ?? "";
            const canUpdate =
              !!draft && String(draft) !== String(currentRoomId);

            return (
              <div
                key={allocationId}
                className="rounded border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <label className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={!!selected[allocationId]}
                        onChange={() => toggleSelect(allocationId)}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => openStudentDetails(a?.student)}
                      className="min-w-0 text-left"
                      title="View student profile"
                    >
                      <div className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline truncate">
                        {a?.student?.name || "—"}
                      </div>
                      <div className="text-xs text-emerald-700/80 mt-1 hover:underline">
                        {a?.student?.studentId || "—"}
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Room</div>
                    <div className="text-gray-900">
                      Room {a?.room?.roomNumber || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Occupancy</div>
                    <div className="text-gray-900">
                      {a?.room?.currentOccupancy ?? "—"}/
                      {a?.room?.capacity ?? "—"}
                    </div>
                  </div>
                </div>

                {filterManualOnly && (
                  <div className="mt-3 text-sm">
                    <div className="text-xs text-gray-500">Reason</div>
                    <div className="text-gray-900">{a?.reason || "—"}</div>
                  </div>
                )}

                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Change Room</div>
                  <select
                    value={draft}
                    onChange={(e) =>
                      setAllocationRoomDraft((d) => ({
                        ...d,
                        [allocationId]: e.target.value,
                      }))
                    }
                    className="border rounded px-3 py-2 text-sm w-full"
                  >
                    <option value="">Select a new room</option>
                    {availableRooms
                      .filter((r) => String(r.roomId) !== String(currentRoomId))
                      .map((r) => (
                        <option key={r.roomId} value={r.roomId}>
                          Room {r.roomNumber} (Floor {r.floorNumber}) —{" "}
                          {r.currentOccupancy}/{r.capacity}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateAllocationRoom(allocationId)}
                    disabled={
                      !canUpdate ||
                      !!updatingAllocation[allocationId] ||
                      bulkCanceling
                    }
                    className="flex-1 px-3 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {updatingAllocation[allocationId] ? "Updating…" : "Update"}
                  </button>
                  <button
                    type="button"
                    onClick={() => cancelAllocation(allocationId)}
                    disabled={
                      !!vacatingAllocation[allocationId] || bulkCanceling
                    }
                    className="flex-1 px-3 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {vacatingAllocation[allocationId] ? "Canceling…" : "Cancel"}
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Desktop table */}
      <div className="mt-4 border border-gray-200 rounded hidden md:block overflow-x-auto bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200">
              <th className="py-2 px-3 bg-blue-800 text-white font-bold">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAllVisible}
                  aria-label="Select all visible"
                />
              </th>
              <th className="py-2 px-3 bg-blue-800 text-white font-bold">
                Student
              </th>
              <th className="py-2 px-3 bg-blue-800 text-white font-bold">
                Student ID
              </th>
              <th className="py-2 px-3 bg-blue-800 text-white font-bold">
                Room
              </th>
              <th className="py-2 px-3 bg-blue-800 text-white font-bold">
                Occupancy
              </th>
              {filterManualOnly && (
                <th className="py-2 px-3 bg-blue-800 text-white font-bold">
                  Reason
                </th>
              )}
              <th className="py-2 px-3 bg-blue-800 text-white font-bold">
                Change Room
              </th>
              <th className="py-2 px-3 bg-blue-800 text-white font-bold">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  className="px-3 py-3 text-gray-500"
                  colSpan={filterManualOnly ? 8 : 7}
                >
                  Loading…
                </td>
              </tr>
            )}
            {!loading && visibleAllocations.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-gray-500 text-center"
                  colSpan={filterManualOnly ? 8 : 7}
                >
                  No allocated students yet.
                </td>
              </tr>
            )}
            {!loading &&
              visibleAllocations.map((a, idx) => {
                const allocationId = a?.allocationId;
                const currentRoomId = a?.room?.roomId;
                const draft = allocationRoomDraft[allocationId] ?? "";
                const canUpdate =
                  !!draft && String(draft) !== String(currentRoomId);
                const rowBg = idx % 2 === 0 ? "#E6F2FA" : "#ffffff";
                const rowColor = idx % 2 === 0 ? "#0B1F3B" : "#000000";

                return (
                  <tr
                    key={allocationId}
                    className="border-t last:border-b-0"
                    style={{ backgroundColor: rowBg, color: rowColor }}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={!!selected[allocationId]}
                        onChange={() => toggleSelect(allocationId)}
                        aria-label="Select allocation"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => openStudentDetails(a?.student)}
                        className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                        title="View student profile"
                      >
                        {a?.student?.name || "—"}
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openStudentDetails(a?.student)}
                        className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                        title="View student profile"
                      >
                        {a?.student?.studentId || "—"}
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      Room {a?.room?.roomNumber || "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {a?.room?.currentOccupancy ?? "—"}/
                      {a?.room?.capacity ?? "—"}
                    </td>
                    {filterManualOnly && (
                      <td className="px-3 py-2">{a?.reason || "—"}</td>
                    )}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={draft}
                          onChange={(e) =>
                            setAllocationRoomDraft((d) => ({
                              ...d,
                              [allocationId]: e.target.value,
                            }))
                          }
                          className="border rounded px-2 py-1"
                        >
                          <option value="">Select a new room</option>
                          {availableRooms
                            .filter(
                              (r) => String(r.roomId) !== String(currentRoomId)
                            )
                            .map((r) => (
                              <option key={r.roomId} value={r.roomId}>
                                Room {r.roomNumber} (Floor {r.floorNumber}) —{" "}
                                {r.currentOccupancy}/{r.capacity}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => updateAllocationRoom(allocationId)}
                          disabled={
                            !canUpdate ||
                            !!updatingAllocation[allocationId] ||
                            bulkCanceling
                          }
                          className="px-3 py-1.5 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {updatingAllocation[allocationId]
                            ? "Updating…"
                            : "Update"}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => cancelAllocation(allocationId)}
                        disabled={
                          !!vacatingAllocation[allocationId] || bulkCanceling
                        }
                        className="px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {vacatingAllocation[allocationId]
                          ? "Canceling…"
                          : "Cancel"}
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
