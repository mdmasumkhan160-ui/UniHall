import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import * as api from "../../lib/mockApi.js";

export default function ManageRooms() {
  const { user } = useAuth();
  const hallId = user?.hallId;

  // Mock rooms data )
  const [rooms, setRooms] = useState([
    {
      id: "room-1",
      number: "101",
      capacity: 2,
      occupied: 2,
      students: ["Student A", "Student B"],
    },
    {
      id: "room-2",
      number: "102",
      capacity: 2,
      occupied: 1,
      students: ["Student C"],
    },
    { id: "room-3", number: "103", capacity: 3, occupied: 0, students: [] },
    {
      id: "room-4",
      number: "201",
      capacity: 2,
      occupied: 2,
      students: ["Student D", "Student E"],
    },
    {
      id: "room-5",
      number: "202",
      capacity: 3,
      occupied: 3,
      students: ["Student F", "Student G", "Student H"],
    },
    { id: "room-6", number: "203", capacity: 2, occupied: 0, students: [] },
  ]);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all"); // all, available, occupied, full

  const filteredRooms = useMemo(() => {
    if (filterStatus === "all") return rooms;
    if (filterStatus === "available")
      return rooms.filter((r) => r.occupied < r.capacity);
    if (filterStatus === "occupied")
      return rooms.filter((r) => r.occupied > 0 && r.occupied < r.capacity);
    if (filterStatus === "full")
      return rooms.filter((r) => r.occupied === r.capacity);
    return rooms;
  }, [rooms, filterStatus]);

  const stats = useMemo(() => {
    const total = rooms.length;
    const available = rooms.filter((r) => r.occupied < r.capacity).length;
    const full = rooms.filter((r) => r.occupied === r.capacity).length;
    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
    const totalOccupied = rooms.reduce((sum, r) => sum + r.occupied, 0);
    const occupancyRate =
      totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    return {
      total,
      available,
      full,
      occupancyRate,
      totalCapacity,
      totalOccupied,
    };
  }, [rooms]);

  const removeStudent = (roomId, studentName) => {
    if (!confirm(`Remove ${studentName} from this room?`)) return;

    setRooms((prevRooms) =>
      prevRooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              students: room.students.filter((s) => s !== studentName),
              occupied: room.occupied - 1,
            }
          : room
      )
    );
    alert(`${studentName} removed successfully!`);
  };

  const allocateStudent = (roomId) => {
    const studentName = prompt("Enter student name to allocate:");
    if (!studentName || !studentName.trim()) return;

    setRooms((prevRooms) =>
      prevRooms.map((room) =>
        room.id === roomId && room.occupied < room.capacity
          ? {
              ...room,
              students: [...room.students, studentName.trim()],
              occupied: room.occupied + 1,
            }
          : room
      )
    );
    alert(`${studentName} allocated successfully!`);
  };

  const refreshRooms = () => setRooms((prev) => prev.map((r) => ({ ...r })));

  return (
    <div
      className="rounded-lg shadow p-6"
      style={{ backgroundColor: "#013A63" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Rooms</h1>
          <p className="text-white">
            View and manage room allocations for your hall
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={refreshRooms}
            className="px-4 py-2 bg-[#2C7DA0]/40 backdrop-blur-md border border-[#2C7DA0]/50 rounded-full text-sm text-white font-medium hover:bg-[#123C69]/60 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Rooms</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600">Available Rooms</div>
          <div className="text-2xl font-bold text-green-900">
            {stats.available}
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-600">Full Rooms</div>
          <div className="text-2xl font-bold text-red-900">{stats.full}</div>
        </div>
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
          <div className="text-sm text-brand-600">Occupancy Rate</div>
          <div className="text-2xl font-bold text-brand-900">
            {stats.occupancyRate}%
          </div>
          <div className="text-xs text-brand-600 mt-1">
            {stats.totalOccupied}/{stats.totalCapacity} beds
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Rooms</option>
            <option value="available">Available (has space)</option>
            <option value="occupied">Partially Occupied</option>
            <option value="full">Full</option>
          </select>
          <div className="text-sm text-gray-600">
            Showing {filteredRooms.length} of {rooms.length} rooms
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            className={`border rounded-lg p-4 transition-all ${
              room.occupied === room.capacity
                ? "bg-red-50 border-red-200"
                : room.occupied > 0
                ? "bg-yellow-50 border-yellow-200"
                : "bg-green-50 border-green-200"
            }`}
          >
            {/* Room Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Room {room.number}
                </h3>
                <p className="text-sm text-gray-600">
                  Capacity: {room.capacity} | Occupied: {room.occupied}
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  room.occupied === room.capacity
                    ? "bg-red-100 text-red-700"
                    : room.occupied > 0
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {room.occupied === room.capacity
                  ? "Full"
                  : room.occupied > 0
                  ? "Partial"
                  : "Empty"}
              </div>
            </div>

            {/* Students List */}
            <div className="space-y-2 mb-3">
              {room.students.length > 0 ? (
                room.students.map((student, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white rounded p-2 text-sm"
                  >
                    <span className="font-medium text-gray-900">{student}</span>
                    <button
                      onClick={() => removeStudent(room.id, student)}
                      className="text-red-600 hover:text-red-700 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 italic">
                  No students allocated
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {room.occupied < room.capacity && (
                <button
                  onClick={() => allocateStudent(room.id)}
                  className="flex-1 bg-[#2C7DA0] text-white px-3 py-2 rounded text-sm font-medium hover:bg-[#123C69] transition-colors"
                >
                  + Allocate Student
                </button>
              )}
              <button
                onClick={() => setSelectedRoom(room)}
                className="px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No rooms match the selected filter</p>
        </div>
      )}

      {/* Room Details Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-4 text-white">
              <h2 className="text-xl font-bold">
                Room {selectedRoom.number} Details
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Capacity:</span>
                  <div className="font-medium text-gray-900">
                    {selectedRoom.capacity} students
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Currently Occupied:</span>
                  <div className="font-medium text-gray-900">
                    {selectedRoom.occupied} students
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Available Space:</span>
                  <div className="font-medium text-gray-900">
                    {selectedRoom.capacity - selectedRoom.occupied} beds
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div className="font-medium text-gray-900">
                    {selectedRoom.occupied === selectedRoom.capacity
                      ? "Full"
                      : selectedRoom.occupied > 0
                      ? "Partially Occupied"
                      : "Empty"}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Allocated Students:
                </h3>
                {selectedRoom.students.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedRoom.students.map((student, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span>{student}</span>
                        <button
                          onClick={() => {
                            removeStudent(selectedRoom.id, student);
                            setSelectedRoom(null);
                          }}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic text-sm">
                    No students allocated to this room
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedRoom(null)}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
