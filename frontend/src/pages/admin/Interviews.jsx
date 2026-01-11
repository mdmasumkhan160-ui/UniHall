import React, { useEffect, useMemo, useState } from "react";
import api from "../../lib/apiClient.js";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (_) {
    return String(dateStr);
  }
}

function prettyStatus(status) {
  const raw = String(status || "").trim();
  if (!raw) return "—";
  const lowered = raw.toLowerCase();
  if (lowered === "alloted") return "Alloted";
  if (lowered === "not-alloted") return "Not-Alloted";
  return lowered
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Interviews() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState({});
  const [scoreDraft, setScoreDraft] = useState({});
  const [filterVenue, setFilterVenue] = useState("");
  const [filterStudentId, setFilterStudentId] = useState("");

  const [detailsModal, setDetailsModal] = useState({
    open: false,
    interviewId: null,
    loading: false,
    error: "",
    data: null,
  });

  const loadInterviews = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/interviews");
      const data = res.data?.data || [];
      setItems(data);
      const init = {};
      data.forEach((it) => {
        init[it.interviewId] = it.interviewScore ?? "";
      });
      setScoreDraft(init);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
    return () => {};
  }, []);

  const rows = useMemo(() => {
    return (items || []).map((it) => ({
      id: it.interviewId,
      applicationId: it.applicationId,
      date: it.date,
      time: it.time,
      venue: it.venue,
      interviewScore: it.interviewScore,
      applicationScore: it.application?.score,
      studentName: it.student?.name,
      studentId: it.student?.studentId,
      department: it.student?.department,
      session: it.student?.session,
    }));
  }, [items]);

  const openDetails = async (interviewId) => {
    if (!interviewId) return;
    setDetailsModal({
      open: true,
      interviewId,
      loading: true,
      error: "",
      data: null,
    });
    try {
      const res = await api.get(
        `/interviews/${encodeURIComponent(interviewId)}/application`
      );
      setDetailsModal({
        open: true,
        interviewId,
        loading: false,
        error: "",
        data: res.data?.data || null,
      });
    } catch (e) {
      setDetailsModal({
        open: true,
        interviewId,
        loading: false,
        error:
          e?.response?.data?.message ||
          "Failed to load application form details",
        data: null,
      });
    }
  };

  const closeDetails = () => {
    setDetailsModal({
      open: false,
      interviewId: null,
      loading: false,
      error: "",
      data: null,
    });
  };

  const renderValue = (value) => {
    if (value === null || value === undefined) return "—";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch (_) {
        return String(value);
      }
    }
    const s = String(value);
    return s.trim() ? s : "—";
  };

  const filteredRows = useMemo(() => {
    const venueNeedle = String(filterVenue || "")
      .trim()
      .toLowerCase();
    const studentNeedle = String(filterStudentId || "")
      .trim()
      .toLowerCase();
    return (rows || []).filter((r) => {
      const venueHay = String(r?.venue || "").toLowerCase();
      const studentHay = String(r?.studentId || "").toLowerCase();
      if (venueNeedle && !venueHay.includes(venueNeedle)) return false;
      if (studentNeedle && !studentHay.includes(studentNeedle)) return false;
      return true;
    });
  }, [rows, filterVenue, filterStudentId]);

  const saveAndConfirmScore = async (interviewId) => {
    const value = scoreDraft[interviewId];
    const numeric = value === "" ? null : Number(value);
    if (numeric === null || !Number.isFinite(numeric)) {
      alert("Please enter a valid interview score");
      return;
    }

    const ok = window.confirm(
      "Save and confirm this interview score?\n\nThis interview will be removed from this list and the student will appear in Seat Allocation."
    );
    if (!ok) return;

    setSaving((s) => ({ ...s, [interviewId]: true }));
    setError("");
    try {
      await api.put(`/interviews/${encodeURIComponent(interviewId)}/score`, {
        interviewScore: numeric,
      });
      setItems((prev) =>
        (prev || []).filter((it) => it.interviewId !== interviewId)
      );
      setScoreDraft((d) => {
        const next = { ...d };
        delete next[interviewId];
        return next;
      });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save interview score");
    } finally {
      setSaving((s) => ({ ...s, [interviewId]: false }));
    }
  };

  return (
    <div
      className="rounded-lg shadow p-6"
      style={{ backgroundColor: "#013A63" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Interviews</h1>
          <p className="text-cyan-100">Scheduled interviews for your hall</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={filterVenue}
            onChange={(e) => setFilterVenue(e.target.value)}
            placeholder="Filter by venue"
            className="w-full border rounded px-3 py-2 text-base"
          />
          <input
            type="text"
            value={filterStudentId}
            onChange={(e) => setFilterStudentId(e.target.value)}
            placeholder="Filter by student ID"
            className="w-full border rounded px-3 py-2 text-base"
          />
        </div>
      </div>

      {/* Mobile cards */}
      <div className="mt-4 space-y-3 md:hidden">
        {loading && (
          <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
            Loading…
          </div>
        )}
        {!loading && filteredRows.length === 0 && (
          <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
            No interviews scheduled yet.
          </div>
        )}
        {!loading &&
          filteredRows.map((r) => (
            <div
              key={r.id}
              className="rounded border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => openDetails(r.id)}
                    className="font-semibold text-gray-900 truncate text-left underline"
                    title="View submitted application form"
                  >
                    {r.studentName || "—"}
                  </button>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(r.date)} • {r.time || "—"} • {r.venue || "—"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                <div>
                  <div className="text-xs text-gray-500">Student ID</div>
                  <button
                    type="button"
                    onClick={() => openDetails(r.id)}
                    className="text-gray-900 text-left underline"
                    title="View submitted application form"
                  >
                    {r.studentId || "—"}
                  </button>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Dept</div>
                  <div className="text-gray-900">{r.department || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Session</div>
                  <div className="text-gray-900">{r.session || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">App Score</div>
                  <div className="text-gray-900">
                    {typeof r.applicationScore === "number"
                      ? r.applicationScore
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-1">
                  Interview Score
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full sm:w-32 border rounded px-2 py-2"
                    value={scoreDraft[r.id] ?? ""}
                    onChange={(e) =>
                      setScoreDraft((d) => ({
                        ...d,
                        [r.id]: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => saveAndConfirmScore(r.id)}
                    disabled={!!saving[r.id]}
                    className="w-full sm:w-auto px-3 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {saving[r.id] ? "Saving…" : "Save & Confirm"}
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Desktop table */}
      <div className="mt-4 border border-gray-200 rounded hidden md:block bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200">
              <th className="py-2 px-3 bg-blue-800 text-white font-bold">
                Date
              </th>
              <th className="py-2 px-3 bg-blue-800 text-white font-bold">
                Time
              </th>
              <th className="py-2 px-3 bg-blue-800 text-white font-bold">
                Venue
              </th>
              <th className="py-2 px-3 bg-blue-800 text-white font-bold">
                Student
              </th>
              <th className="py-2 px-3 bg-blue-800 text-white font-bold">
                Student ID
              </th>
              <th className="py-2 px-3 bg-blue-800 text-white font-bold">
                Dept
              </th>
              <th className="py-2 px-3 bg-blue-800 text-white font-bold">
                Session
              </th>
              <th className="py-2 px-3 bg-blue-800 text-white font-bold">
                App Score
              </th>
              <th className="py-2 px-3 bg-blue-800 text-white font-bold">
                Interview Score
              </th>
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
            {!loading && filteredRows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-gray-500 text-center" colSpan={9}>
                  No interviews scheduled yet.
                </td>
              </tr>
            )}
            {!loading &&
              filteredRows.map((r, idx) => {
                const rowBg = idx % 2 === 0 ? "#E6F2FA" : "#ffffff";
                const rowColor = idx % 2 === 0 ? "#0B1F3B" : "#000000";
                return (
                  <tr
                    key={r.id}
                    className="border-t last:border-b-0"
                    style={{ backgroundColor: rowBg, color: rowColor }}
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDate(r.date)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.time || "—"}
                    </td>
                    <td className="px-3 py-2">{r.venue || "—"}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => openDetails(r.id)}
                        className="text-left underline"
                        title="View submitted application form"
                        style={{ color: rowColor }}
                      >
                        {r.studentName || "—"}
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openDetails(r.id)}
                        className="text-left underline"
                        title="View submitted application form"
                        style={{ color: rowColor }}
                      >
                        {r.studentId || "—"}
                      </button>
                    </td>
                    <td className="px-3 py-2">{r.department || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.session || "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {typeof r.applicationScore === "number"
                        ? r.applicationScore
                        : "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-24 border rounded px-2 py-1"
                          value={scoreDraft[r.id] ?? ""}
                          onChange={(e) =>
                            setScoreDraft((d) => ({
                              ...d,
                              [r.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => saveAndConfirmScore(r.id)}
                          disabled={!!saving[r.id]}
                          className="px-3 py-1.5 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {saving[r.id] ? "Saving…" : "Save & Confirm"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {detailsModal.open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Applicant Application Form
                </div>
                <div className="text-xs text-gray-500">
                  Interview ID: {detailsModal.interviewId}
                </div>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="p-4 max-h-[75vh] overflow-auto">
              {detailsModal.loading && (
                <div className="text-sm text-gray-500">
                  Loading application details…
                </div>
              )}
              {!detailsModal.loading && detailsModal.error && (
                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {detailsModal.error}
                </div>
              )}

              {!detailsModal.loading &&
                !detailsModal.error &&
                detailsModal.data && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div className="rounded border border-gray-200 p-3">
                        <div className="text-xs text-gray-500">Form</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {detailsModal.data?.form?.title || "—"}
                        </div>
                      </div>
                      <div className="rounded border border-gray-200 p-3">
                        <div className="text-xs text-gray-500">Applicant</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {detailsModal.data?.application?.applicant?.name ||
                            "—"}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {detailsModal.data?.application?.applicant
                            ?.studentId || "—"}
                        </div>
                        <div className="text-xs text-gray-600">
                          {detailsModal.data?.application?.applicant
                            ?.department || "—"}{" "}
                          •{" "}
                          {detailsModal.data?.application?.applicant?.session ||
                            "—"}
                        </div>
                      </div>
                    </div>

                    <div className="rounded border border-gray-200 p-4">
                      <div className="text-sm font-semibold text-gray-900">
                        Submitted Answers
                      </div>
                      <div className="mt-3 space-y-3">
                        {(detailsModal.data?.form?.schema || []).map(
                          (field) => (
                            <div
                              key={field.id}
                              className="border-b border-gray-100 pb-3"
                            >
                              <div className="text-xs font-semibold text-gray-600">
                                {field.label}
                              </div>
                              <div className="text-sm text-gray-900 mt-1">
                                {renderValue(
                                  detailsModal.data?.application?.data?.[
                                    field.id
                                  ]
                                )}
                              </div>
                            </div>
                          )
                        )}

                        {(!detailsModal.data?.form?.schema ||
                          detailsModal.data.form.schema.length === 0) && (
                          <div className="text-sm text-gray-500">
                            No form schema available to display.
                          </div>
                        )}
                      </div>
                    </div>

                    {Array.isArray(
                      detailsModal.data?.application?.attachments
                    ) &&
                      detailsModal.data.application.attachments.length > 0 && (
                        <div className="rounded border border-gray-200 p-4 mt-4">
                          <div className="text-sm font-semibold text-gray-900">
                            Attachments
                          </div>
                          <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
                            {detailsModal.data.application.attachments.map(
                              (att, idx) => (
                                <li key={`${att.url || idx}`}>
                                  <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {att.name || att.url}
                                  </a>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
