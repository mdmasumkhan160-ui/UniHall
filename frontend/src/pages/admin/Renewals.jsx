import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import apiClient from "../../lib/apiClient.js";

const STATUS_COLORS = {
  Pending: "bg-yellow-100 text-yellow-800",
  "Under review": "bg-blue-100 text-blue-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

function statusLabel(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PENDING") return "Pending";
  if (s === "UNDER_REVIEW") return "Under review";
  if (s === "APPROVED") return "Approved";
  if (s === "REJECTED") return "Rejected";
  return "Pending";
}

function safeErrMessage(e) {
  return e?.response?.data?.message || e?.message || "Request failed";
}

export default function Renewals() {
  const { user } = useAuth();
  const [decisionNotes, setDecisionNotes] = useState("");
  const [extendMonths, setExtendMonths] = useState(12);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await apiClient.get("/renewals");
        if (active) setItems(res.data?.data || []);
      } catch (e) {
        if (active) setError(safeErrMessage(e));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [refreshFlag]);

  const renewals = useMemo(() => {
    const list = Array.isArray(items) ? items.slice() : [];
    // Show only pending requests as requested.
    const pendingOnly = list.filter(
      (r) => String(r.status || "").toUpperCase() === "PENDING"
    );
    return pendingOnly.sort((a, b) => {
      const sa = statusLabel(a.status);
      const sb = statusLabel(b.status);
      if (sa === sb) {
        return (
          new Date(b.requestedAt || b.applicationDate || 0) -
          new Date(a.requestedAt || a.applicationDate || 0)
        );
      }
      const order = { Pending: 0, "Under review": 1, Approved: 2, Rejected: 3 };
      return (order[sa] ?? 99) - (order[sb] ?? 99);
    });
  }, [items]);

  const visibleRenewals = renewals.slice(0, 3);
  const [selectedId, setSelectedId] = useState(
    () => visibleRenewals[0]?.id ?? null
  );
  const selectedRenewal =
    visibleRenewals.find((r) => r.id === selectedId) || null;

  useEffect(() => {
    if (!visibleRenewals.some((r) => r.id === selectedId)) {
      const fallbackId = visibleRenewals[0]?.id ?? null;
      setSelectedId(fallbackId);
      setDecisionNotes("");
    }
  }, [visibleRenewals, selectedId]);

  const handleSelect = (id) => {
    setSelectedId(id);
    setDecisionNotes("");
    setExtendMonths(12);
  };

  const handleDecision = async (status) => {
    if (!selectedRenewal) return;
    setError("");
    try {
      const payload = {
        status,
        note: decisionNotes.trim() || null,
      };
      if (String(status || "").toUpperCase() === "APPROVED") {
        payload.extendMonths = Number(extendMonths) || 12;
      }
      await apiClient.post(`/renewals/${selectedRenewal.id}/decision`, payload);
      setDecisionNotes("");
      setRefreshFlag((flag) => flag + 1);
    } catch (e) {
      setError(safeErrMessage(e));
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
      <div className="border rounded-lg shadow-sm" style={{ backgroundColor: '#2C7DA0' }}>
        <div className="border-b px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Renewal Requests</h2>
          <p className="text-xs text-white font-bold">
            Showing the three most recent requests for your hall.
          </p>
        </div>
        <div className="divide-y">
          {loading ? (
            <div className="px-4 py-6 text-sm text-white font-bold">
              Loading renewal requests…
            </div>
          ) : error ? (
            <div className="px-4 py-6 text-sm text-white font-bold">{error}</div>
          ) : visibleRenewals.length === 0 ? (
            <div className="px-4 py-6 text-sm text-white font-bold">
              No renewal requests available.
            </div>
          ) : (
            visibleRenewals.map((request) => (
              <button
                key={request.id}
                onClick={() => handleSelect(request.id)}
                className={`w-full text-left px-4 py-3 transition ${
                  selectedId === request.id ? "bg-brand-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {request.student?.name || request.studentId}
                    </div>
                    <div className="text-xs text-white font-bold">
                      {request.requestedAt
                        ? new Date(request.requestedAt).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-2xs font-semibold uppercase tracking-wide ${
                      STATUS_COLORS[statusLabel(request.status)] ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {statusLabel(request.status)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-white font-bold">
                  {request.remarks || "No remarks provided."}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="border rounded-lg shadow-sm p-6" style={{ backgroundColor: '#2C7DA0' }}>
        {selectedRenewal ? (
          <div className="space-y-5">
            <div>
              <h3 className="text-xl font-semibold text-white">
                Application details
              </h3>
              <p className="text-sm text-white font-bold">
                Review supporting information before making a decision.
              </p>
            </div>

            <section className="space-y-2 text-sm">
              <h4 className="font-semibold text-white">Applicant</h4>
              <p className="text-white font-bold">
                {selectedRenewal.student?.name || selectedRenewal.studentId}
              </p>
              <p className="text-white font-bold">
                Request submitted on{" "}
                {selectedRenewal.requestedAt
                  ? new Date(selectedRenewal.requestedAt).toLocaleString()
                  : "—"}
              </p>
            </section>

            <section className="space-y-2 text-sm">
              <h4 className="font-semibold text-white">Reason</h4>
              <p className="rounded border border-gray-200 bg-gray-50 p-3 text-gray-700 whitespace-pre-line">
                {selectedRenewal.remarks || "No remarks provided."}
              </p>
            </section>

            {selectedRenewal.attachment && (
              <section className="space-y-2 text-sm">
                <h4 className="font-semibold text-white">
                  Supporting Documents
                </h4>
                <ul className="list-disc list-inside text-white font-bold">
                  <li>
                    {selectedRenewal.attachment.name ||
                      selectedRenewal.attachment.url}
                  </li>
                </ul>
              </section>
            )}

            {selectedRenewal.rejectionReason &&
              statusLabel(selectedRenewal.status) === "Rejected" && (
                <section className="space-y-2 text-sm">
                  <h4 className="font-semibold text-white">
                    Rejection Reason
                  </h4>
                  <p className="rounded border border-gray-200 bg-gray-50 p-3 text-gray-700 whitespace-pre-line">
                    {selectedRenewal.rejectionReason}
                  </p>
                </section>
              )}

            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Decision</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-white">
                    Extend by (months)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={extendMonths}
                    onChange={(e) => setExtendMonths(e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <div className="mt-1 text-xs text-white font-bold">
                    Used when accepting renewal.
                  </div>
                </div>
              </div>
              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                rows={3}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                placeholder="Optional: leave a note explaining your decision."
              />
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleDecision("APPROVED")}
                  disabled={statusLabel(selectedRenewal.status) === "Approved"}
                  className={`px-4 py-2 rounded text-sm font-medium shadow-sm ${
                    statusLabel(selectedRenewal.status) === "Approved"
                      ? "bg-green-100 text-green-600 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  Accept Renewal
                </button>
                <button
                  onClick={() => handleDecision("REJECTED")}
                  disabled={statusLabel(selectedRenewal.status) === "Rejected"}
                  className={`px-4 py-2 rounded text-sm font-medium shadow-sm ${
                    statusLabel(selectedRenewal.status) === "Rejected"
                      ? "bg-red-100 text-red-600 cursor-not-allowed"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  Reject Renewal
                </button>
              </div>
            </section>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white font-bold">
            Select a renewal request to view the details.
          </div>
        )}
      </div>
    </div>
  );
}
