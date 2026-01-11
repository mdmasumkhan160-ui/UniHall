import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../../lib/apiClient.js";

const ROOM_TYPES = [
  { value: "SINGLE", label: "Single Seat" },
  { value: "DOUBLE", label: "Common Seat" },
];
const ROOM_STATUSES = [
  "AVAILABLE",
  "OCCUPIED",
  "MAINTENANCE",
  "UNDER_REPAIR",
  "RESERVED",
];

export default function CreateHallRooms() {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedFloor, setSelectedFloor] = useState(null);

  const [roomNumber, setRoomNumber] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [roomType, setRoomType] = useState("SINGLE");
  const [status, setStatus] = useState("AVAILABLE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [editFloorNumber, setEditFloorNumber] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [editCurrentOccupancy, setEditCurrentOccupancy] = useState("");
  const [editRoomType, setEditRoomType] = useState("SINGLE");
  const [editStatus, setEditStatus] = useState("AVAILABLE");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);

  const [selectedRoomForDetails, setSelectedRoomForDetails] = useState(null);
  const [roomAllocations, setRoomAllocations] = useState([]);
  const [isRoomAllocationsLoading, setIsRoomAllocationsLoading] =
    useState(false);
  const [roomAllocationsError, setRoomAllocationsError] = useState("");

  async function loadRooms() {
    setIsLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/rooms");
      setRooms(res.data?.data || []);
    } catch (err) {
      setRooms([]);
      setError(err?.response?.data?.message || "Unable to load rooms");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await apiClient.get("/rooms");
        if (!cancelled) setRooms(res.data?.data || []);
      } catch (err) {
        if (!cancelled) {
          setRooms([]);
          setError(err?.response?.data?.message || "Unable to load rooms");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function openRoomDetails(room) {
    if (!room) return;

    setSelectedRoomForDetails(room);
    setIsRoomAllocationsLoading(true);
    setRoomAllocationsError("");
    setRoomAllocations([]);

    try {
      const res = await apiClient.get("/allocations");
      const all = res.data?.data || [];
      const inRoom = all.filter(
        (a) => String(a?.room?.roomId || "") === String(room.roomId)
      );
      setRoomAllocations(inRoom);
    } catch (err) {
      setRoomAllocations([]);
      setRoomAllocationsError(
        err?.response?.data?.message || "Unable to load room students"
      );
    } finally {
      setIsRoomAllocationsLoading(false);
    }
  }

  function floorPrefixFromValue(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    const firstChar = raw.charAt(0);
    return /\d/.test(firstChar) ? firstChar : "";
  }

  const floorPrefix = useMemo(() => {
    return floorPrefixFromValue(floorNumber);
  }, [floorNumber]);

  useEffect(() => {
    if (!floorPrefix) return;

    setRoomNumber((prev) => {
      const current = String(prev ?? "");
      const trimmed = current.trim();
      if (!trimmed) return floorPrefix;
      if (trimmed.startsWith(floorPrefix)) return current;
      if (/^\d/.test(trimmed)) return floorPrefix + trimmed.slice(1);
      return floorPrefix + trimmed;
    });
  }, [floorPrefix]);

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const fa = Number(a.floorNumber);
      const fb = Number(b.floorNumber);
      if (fa !== fb) return fa - fb;
      return String(a.roomNumber).localeCompare(String(b.roomNumber));
    });
  }, [rooms]);

  const floorSummaries = useMemo(() => {
    const byFloor = new Map();
    (rooms || []).forEach((room) => {
      const floor = Number(room.floorNumber);
      if (!Number.isFinite(floor)) return;

      const capacityNum = Number(room.capacity || 0);
      const occupiedNum = Number(room.currentOccupancy || 0);

      const existing = byFloor.get(floor) || {
        floorNumber: floor,
        totalSeats: 0,
        occupiedSeats: 0,
        roomsCount: 0,
      };

      existing.totalSeats += Math.max(0, capacityNum);
      existing.occupiedSeats += Math.max(0, occupiedNum);
      existing.roomsCount += 1;
      byFloor.set(floor, existing);
    });

    return Array.from(byFloor.values())
      .map((f) => ({
        ...f,
        availableSeats: Math.max(0, f.totalSeats - f.occupiedSeats),
      }))
      .sort((a, b) => a.floorNumber - b.floorNumber);
  }, [rooms]);

  const visibleRooms = useMemo(() => {
    if (selectedFloor == null) return [];
    return sortedRooms.filter((r) => Number(r.floorNumber) === selectedFloor);
  }, [sortedRooms, selectedFloor]);

  async function onSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    const prefix = floorPrefixFromValue(floorNumber);
    const cleanRoomNumber = roomNumber.trim();
    if (!prefix) {
      setError("Please enter a valid floor number first");
      return;
    }
    if (!cleanRoomNumber || !cleanRoomNumber.startsWith(prefix)) {
      setError(`Room number must start with ${prefix} (based on floor number)`);
      return;
    }

    const payload = {
      roomNumber: cleanRoomNumber,
      floorNumber: Number.parseInt(floorNumber, 10),
      capacity: Number.parseInt(capacity, 10),
      roomType,
      status,
    };

    setIsSubmitting(true);
    setError("");
    try {
      await apiClient.post("/rooms", payload);
      setRoomNumber("");
      setFloorNumber("");
      setCapacity("");
      setRoomType("SINGLE");
      setStatus("AVAILABLE");
      setSelectedFloor(null);
      await loadRooms();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to create room");
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(room) {
    setError("");
    setEditingRoomId(room.roomId);
    setEditRoomNumber(String(room.roomNumber ?? ""));
    setEditFloorNumber(String(room.floorNumber ?? ""));
    setEditCapacity(String(room.capacity ?? ""));
    setEditCurrentOccupancy(String(room.currentOccupancy ?? ""));
    const rawType = String(room.roomType ?? "SINGLE").toUpperCase();
    setEditRoomType(rawType === "SINGLE" ? "SINGLE" : "DOUBLE");
    setEditStatus(String(room.status ?? "AVAILABLE"));
  }

  function cancelEdit() {
    setEditingRoomId(null);
    setEditRoomNumber("");
    setEditFloorNumber("");
    setEditCapacity("");
    setEditCurrentOccupancy("");
    setEditRoomType("SINGLE");
    setEditStatus("AVAILABLE");
  }

  async function saveEdit() {
    if (!editingRoomId || isSavingEdit) return;

    const payload = {
      roomNumber: editRoomNumber.trim(),
      floorNumber: Number.parseInt(editFloorNumber, 10),
      capacity: Number.parseInt(editCapacity, 10),
      currentOccupancy: Number.parseInt(editCurrentOccupancy, 10),
      roomType: editRoomType,
      status: editStatus,
    };

    setIsSavingEdit(true);
    setError("");
    try {
      await apiClient.put(`/rooms/${editingRoomId}`, payload);
      cancelEdit();
      await loadRooms();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update room");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function deleteRoom(room) {
    if (!room?.roomId || isDeletingId) return;
    const ok = window.confirm(
      `Delete room ${room.roomNumber}? This cannot be undone.`
    );
    if (!ok) return;

    setIsDeletingId(room.roomId);
    setError("");
    try {
      await apiClient.delete(`/rooms/${room.roomId}`);
      if (editingRoomId === room.roomId) cancelEdit();
      await loadRooms();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to delete room");
    } finally {
      setIsDeletingId(null);
    }
  }

  return (
    <div
      className="rounded-lg shadow p-6"
      style={{ backgroundColor: "#013A63" }}
    >
      <div className="flex items-start justify-between gap-4 bg-white border rounded p-4">
        <div>
          <h2 className="font-bold mb-2 text-lg text-[#0B1F3B]">
            🏢 Create Hall Rooms
          </h2>
          <p className="text-sm text-[#0B1F3B] font-bold">
            Add rooms for your hall based on the rooms table.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadRooms}
            className="px-4 py-2 bg-[#0B1F3B] rounded-full text-sm text-white font-medium hover:bg-[#061826] shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-4 grid gap-3 max-w-2xl">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-sm text-white font-bold">Floor Number</label>
            <input
              className="border rounded px-3 py-2"
              placeholder="e.g. 1"
              value={floorNumber}
              onChange={(e) => setFloorNumber(e.target.value)}
              inputMode="numeric"
              required
            />
            {floorPrefix ? (
              <p className="text-xs text-white font-bold">
                Room numbers must start with {floorPrefix}
              </p>
            ) : null}
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-white font-bold">Room Number</label>
            <input
              className="border rounded px-3 py-2"
              placeholder={
                floorPrefix ? `e.g. ${floorPrefix}01` : "Enter floor first"
              }
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              maxLength={10}
              required
              disabled={!floorPrefix}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="grid gap-1">
            <label className="text-sm text-white font-bold">Capacity</label>
            <input
              className="border rounded px-3 py-2"
              placeholder="e.g. 2"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              inputMode="numeric"
              required
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-white font-bold">Room Type</label>
            <select
              className="border rounded px-3 py-2 bg-white"
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
            >
              {ROOM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-white font-bold">Status</label>
            <select
              className="border rounded px-3 py-2 bg-white"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {ROOM_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-brand-600 text-white rounded w-max disabled:opacity-60 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          {isSubmitting ? "Creating..." : "Create Room"}
        </button>
      </form>

      <div className="bg-white border rounded p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">
            {selectedFloor == null
              ? "Floors"
              : `Rooms on Floor ${selectedFloor}`}
          </h3>
          <button
            type="button"
            onClick={loadRooms}
            className="px-3 py-1.5 text-sm bg-[#2C7DA0] text-white rounded hover:bg-[#123C69] shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <p className="text-gray-500 text-center py-6">Loading rooms...</p>
        ) : sortedRooms.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No rooms yet</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            {selectedFloor == null ? (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="py-2 pr-4 bg-blue-800 text-white font-bold">
                      Floor
                    </th>
                    <th className="py-2 pr-4 bg-blue-800 text-white font-bold">
                      Available Seats
                    </th>
                    <th className="py-2 pr-4 bg-blue-800 text-white font-bold">
                      Total Seats
                    </th>
                    <th className="py-2 pr-4 bg-blue-800 text-white font-bold">
                      Rooms
                    </th>
                    <th className="py-2 pr-4 bg-blue-800 text-white font-bold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {floorSummaries.map((f, idx) => {
                    const rowBg = idx % 2 === 0 ? "#E6F2FA" : "#ffffff";
                    const rowColor = idx % 2 === 0 ? "#0B1F3B" : "#000000";
                    return (
                      <tr
                        key={f.floorNumber}
                        className="border-b last:border-b-0"
                        style={{ backgroundColor: rowBg, color: rowColor }}
                      >
                        <td className="py-2 pr-4 font-medium">
                          {f.floorNumber}
                        </td>
                        <td className="py-2 pr-4">{f.availableSeats}</td>
                        <td className="py-2 pr-4">{f.totalSeats}</td>
                        <td className="py-2 pr-4">{f.roomsCount}</td>
                        <td className="py-2 pr-4">
                          <button
                            type="button"
                            onClick={() => {
                              cancelEdit();
                              setSelectedFloor(f.floorNumber);
                            }}
                            className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded hover:bg-brand-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                          >
                            View Rooms
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      cancelEdit();
                      setSelectedRoomForDetails(null);
                      setSelectedFloor(null);
                    }}
                    className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    Back to Floors
                  </button>
                </div>

                {visibleRooms.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">
                    No rooms on this floor
                  </p>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-gray-200">
                        <th className="py-2 pr-4 bg-[#29465B] text-white font-bold">
                          Room
                        </th>
                        <th className="py-2 pr-4 bg-[#29465B] text-white font-bold">
                          Floor
                        </th>
                        <th className="py-2 pr-4 bg-[#29465B] text-white font-bold">
                          Type
                        </th>
                        <th className="py-2 pr-4 bg-blue-800 text-white font-bold">
                          Capacity
                        </th>
                        <th className="py-2 pr-4 bg-blue-800 text-white font-bold">
                          Occupied
                        </th>
                        <th className="py-2 pr-4 bg-blue-800 text-white font-bold">
                          Status
                        </th>
                        <th className="py-2 pr-4 bg-blue-800 text-white font-bold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRooms.map((r, idx) => {
                        const rowBg = idx % 2 === 0 ? "#E6F2FA" : "#ffffff";
                        const rowColor = idx % 2 === 0 ? "#0B1F3B" : "#000000";
                        return (
                          <tr
                            key={r.roomId}
                            className="border-b last:border-b-0"
                            style={{ backgroundColor: rowBg, color: rowColor }}
                          >
                            {editingRoomId === r.roomId ? (
                              <>
                                <td className="py-2 pr-4">
                                  <input
                                    className="border rounded px-2 py-1 w-24"
                                    value={editRoomNumber}
                                    onChange={(e) =>
                                      setEditRoomNumber(e.target.value)
                                    }
                                    maxLength={10}
                                  />
                                </td>
                                <td className="py-2 pr-4">
                                  <input
                                    className="border rounded px-2 py-1 w-20"
                                    value={editFloorNumber}
                                    onChange={(e) =>
                                      setEditFloorNumber(e.target.value)
                                    }
                                    inputMode="numeric"
                                  />
                                </td>
                                <td className="py-2 pr-4">
                                  <select
                                    className="border rounded px-2 py-1 bg-white"
                                    value={editRoomType}
                                    onChange={(e) =>
                                      setEditRoomType(e.target.value)
                                    }
                                  >
                                    {ROOM_TYPES.map((t) => (
                                      <option key={t.value} value={t.value}>
                                        {t.label}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-2 pr-4">
                                  <input
                                    className="border rounded px-2 py-1 w-20"
                                    value={editCapacity}
                                    onChange={(e) =>
                                      setEditCapacity(e.target.value)
                                    }
                                    inputMode="numeric"
                                  />
                                </td>
                                <td className="py-2 pr-4">
                                  <input
                                    className="border rounded px-2 py-1 w-20"
                                    value={editCurrentOccupancy}
                                    onChange={(e) =>
                                      setEditCurrentOccupancy(e.target.value)
                                    }
                                    inputMode="numeric"
                                  />
                                </td>
                                <td className="py-2 pr-4">
                                  <select
                                    className="border rounded px-2 py-1 bg-white"
                                    value={editStatus}
                                    onChange={(e) =>
                                      setEditStatus(e.target.value)
                                    }
                                  >
                                    {ROOM_STATUSES.map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-2 pr-4 bg-teal-100">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={isSavingEdit}
                                      onClick={saveEdit}
                                      className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-60"
                                    >
                                      {isSavingEdit ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isSavingEdit}
                                      onClick={cancelEdit}
                                      className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-60"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-2 pr-4 font-medium">
                                  <button
                                    type="button"
                                    onClick={() => openRoomDetails(r)}
                                    className="text-brand-700 hover:text-brand-800 hover:underline font-semibold"
                                    title="View students in this room"
                                  >
                                    {r.roomNumber}
                                  </button>
                                </td>
                                <td className="py-2 pr-4">{r.floorNumber}</td>
                                <td className="py-2 pr-4">
                                  {String(r.roomType || "").toUpperCase() ===
                                  "SINGLE"
                                    ? "Single Seat"
                                    : "Common Seat"}
                                </td>
                                <td className="py-2 pr-4">{r.capacity}</td>
                                <td className="py-2 pr-4">
                                  {r.currentOccupancy}
                                </td>
                                <td className="py-2 pr-4">{r.status}</td>
                                <td className="py-2 pr-4">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => startEdit(r)}
                                      className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isDeletingId === r.roomId}
                                      onClick={() => deleteRoom(r)}
                                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-60 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                    >
                                      {isDeletingId === r.roomId
                                        ? "Deleting..."
                                        : "Delete"}
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {selectedRoomForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Room {selectedRoomForDetails.roomNumber} (Floor{" "}
                  {selectedRoomForDetails.floorNumber})
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Capacity: {selectedRoomForDetails.capacity} • Occupied:{" "}
                  {selectedRoomForDetails.currentOccupancy} • Status:{" "}
                  {selectedRoomForDetails.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRoomForDetails(null)}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="px-5 py-4">
              {isRoomAllocationsLoading ? (
                <p className="text-sm text-gray-600">Loading students...</p>
              ) : roomAllocationsError ? (
                <p className="text-sm text-red-600">{roomAllocationsError}</p>
              ) : roomAllocations.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No allocated students in this room.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-gray-200">
                        <th className="py-2 pr-4">Student</th>
                        <th className="py-2 pr-4">University ID</th>
                        <th className="py-2 pr-4">Department</th>
                        <th className="py-2 pr-4">Session</th>
                        <th className="py-2 pr-4">Allocation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomAllocations.map((a) => (
                        <tr
                          key={a.allocationId}
                          className="border-b last:border-b-0"
                        >
                          <td className="py-2 pr-4 font-medium text-gray-900">
                            {a?.student?.name || "Unknown"}
                          </td>
                          <td className="py-2 pr-4">
                            {a?.student?.studentId || "—"}
                          </td>
                          <td className="py-2 pr-4">
                            {a?.student?.department || "—"}
                          </td>
                          <td className="py-2 pr-4">
                            {a?.student?.session || "—"}
                          </td>
                          <td className="py-2 pr-4">{a?.status || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
