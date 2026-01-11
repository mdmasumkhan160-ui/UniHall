import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../../lib/apiClient.js";

function safeErrMessage(e) {
  return e?.response?.data?.message || e?.message || "Request failed";
}

function statusBadgeClass(status) {
  const s = String(status || "").toUpperCase();
  if (s === "APPROVED") return "bg-green-100 text-green-800";
  if (s === "REJECTED") return "bg-red-100 text-red-800";
  if (s === "UNDER_REVIEW") return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-800";
}

function statusLabel(status) {
  const s = String(status || "").toUpperCase();
  if (s === "UNDER_REVIEW") return "Under review";
  if (s === "PENDING") return "Pending";
  if (s === "APPROVED") return "Approved";
  if (s === "REJECTED") return "Rejected";
  return status || "Pending";
}

export default function StudentRenewals() {
  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [academicYear, setAcademicYear] = useState("");
  const [remarks, setRemarks] = useState("");
  const [attachment, setAttachment] = useState(null);

  const windowOpen = Boolean(eligibility?.canApplyRenewal);
  const formDisabled = !windowOpen || submitting;

  const hasProof = Boolean(attachment?.dataUrl);

  const canSubmit = useMemo(() => {
    return (
      eligible &&
      windowOpen &&
      academicYear.trim().length >= 4 &&
      hasProof &&
      !submitting
    );
  }, [eligible, windowOpen, academicYear, hasProof, submitting]);

  const expiryLabel = useMemo(() => {
    const iso = eligibility?.expiresAt;
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString();
  }, [eligibility]);

  async function load() {
    setError("");
    setLoading(true);
    try {
      const [eligRes, listRes] = await Promise.all([
        apiClient.get("/renewals/student/eligibility"),
        apiClient.get("/renewals/student"),
      ]);
      const eligData = eligRes.data?.data;
      setEligible(Boolean(eligData?.eligible));
      setEligibility(eligData || null);
      setItems(listRes.data?.data || []);
    } catch (e) {
      setError(safeErrMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");
    try {
      const payload = {
        academicYear: academicYear.trim(),
        remarks: remarks.trim() || null,
        attachment: {
          name: attachment?.name || "proof",
          type: attachment?.type || "application/octet-stream",
          dataUrl: attachment?.dataUrl,
        },
      };

      await apiClient.post("/renewals/student", payload);
      setAcademicYear("");
      setRemarks("");
      setAttachment(null);
      await load();
    } catch (e2) {
      setError(safeErrMessage(e2));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl text-white font-bold">Renewals</h1>
          <p className="text-sm text-white font-bold">
            Request a renewal only if you are currently allocated.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="px-3 py-2 rounded-md text-sm text-white font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          style={{ backgroundColor: "#00B4D8" }}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="p-3 rounded-md bg-red-50 text-white font-bold text-sm">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-white font-bold">Loading…</div>
      ) : !eligible ? (
        <div className="p-4 rounded-md border bg-white">
          <div className="text-black font-bold">
            You are not eligible for renewal.
          </div>
          <div className="text-sm text-black font-bold mt-1">
            You must have an active hall allocation to request a renewal.
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-md border bg-white space-y-3">
          <div className="text-sm text-black font-bold">
            Active allocation:{" "}
            <span className="font-medium">
              {eligibility?.allocation?.room?.roomNumber || "N/A"}
            </span>
          </div>
          {expiryLabel ? (
            <div className="text-sm text-black font-bold">
              Seat expiry: <span className="font-medium">{expiryLabel}</span>
            </div>
          ) : null}
          {eligible && eligibility && eligibility.canApplyRenewal === false ? (
            <div className="p-3 rounded-md bg-yellow-50 text-yellow-800 text-sm">
              You can submit a renewal request only within 3 months of seat
              expiry.
            </div>
          ) : null}
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            <div>
              <label className="block text-sm text-black font-bold">
                Academic Year
              </label>
              <input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                placeholder="e.g. 2025/2026"
                disabled={formDisabled}
              />
            </div>
            <div>
              <label className="block text-sm text-black font-bold">
                Proof Document (required)
              </label>
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) {
                    setAttachment(null);
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    setAttachment({
                      name: file.name,
                      type: file.type,
                      dataUrl: String(reader.result || ""),
                    });
                  };
                  reader.onerror = () => setAttachment(null);
                  reader.readAsDataURL(file);
                }}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                disabled={formDisabled}
              />
              {!windowOpen ? (
                <div className="mt-1 text-xs text-gray-600">
                  Renewal window is closed.
                </div>
              ) : null}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-black font-bold">
                Remarks (optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                rows={3}
                placeholder="Add any note for the hall admin…"
                disabled={formDisabled}
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-md text-white font-bold text-sm disabled:opacity-50 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                style={{ backgroundColor: "#00B4D8" }}
                disabled={!canSubmit}
              >
                {submitting ? "Submitting…" : "Submit renewal request"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="p-4 rounded-md border bg-white">
        <div className="text-black font-bold">My renewal requests</div>
        <div className="mt-3 space-y-3">
          {items.length === 0 ? (
            <div className="text-sm text-black font-bold">
              No renewal requests found.
            </div>
          ) : (
            items.map((r) => (
              <div key={r.id || r.renewalId} className="p-3 rounded-md border">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-black font-bold">
                      {r.academicYear}
                    </div>
                    <div className="text-xs text-black font-bold">
                      Room: {r.room?.roomNumber || r.roomNumber || "N/A"}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${statusBadgeClass(
                      r.status
                    )}`}
                  >
                    {statusLabel(r.status)}
                  </span>
                </div>
                {r.remarks ? (
                  <div className="mt-2 text-sm text-black font-bold">
                    Remarks: {r.remarks}
                  </div>
                ) : null}
                {r.rejectionReason ? (
                  <div className="mt-2 text-sm text-black font-bold">
                    Reason: {r.rejectionReason}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
