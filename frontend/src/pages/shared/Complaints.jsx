import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import apiClient from "../../lib/apiClient.js";

const STATUS_ORDER = ["Pending", "Working", "Resolved", "Rejected"];
const STATUS_BADGES = {
  Pending: "bg-yellow-100 text-yellow-800",
  Working: "bg-blue-100 text-blue-800",
  Resolved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-700",
};

function safeErrMessage(e) {
  return e?.response?.data?.message || e?.message || "Request failed";
}

export default function Complaints() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(
    user.role === "student" ? "file" : "review"
  );

  if (user.role === "examcontroller") {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">No Access</h2>
        <p className="text-gray-600 mt-2">
          Exam controllers do not have access to the complaints system.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#123456] p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Complaints</h1>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {user.role === "student" && (
            <>
              <button
                onClick={() => setActiveTab("file")}
                className={`py-4 px-4 border-b-2 font-bold text-sm ${
                  activeTab === "file"
                    ? "border-blue-500 bg-blue-600 text-white rounded-t-lg"
                    : "border-transparent text-white hover:border-gray-300"
                }`}
              >
                File Complaint
              </button>
              <button
                onClick={() => setActiveTab("my-complaints")}
                className={`py-4 px-4 border-b-2 font-bold text-sm ${
                  activeTab === "my-complaints"
                    ? "border-blue-500 bg-blue-600 text-white rounded-t-lg"
                    : "border-transparent text-white hover:border-gray-300"
                }`}
              >
                My Complaints
              </button>
            </>
          )}

          {(user.role === "admin" || user.role === "staff") && (
            <button
              onClick={() => setActiveTab("review")}
              className={`py-4 px-1 border-b-2 font-bold text-lg ${
                activeTab === "review"
                  ? "border-blue-500 text-white"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Review Complaints
            </button>
          )}
        </nav>
      </div>

      {activeTab === "file" && user.role === "student" && (
        <FileComplaintTab user={user} />
      )}
      {activeTab === "my-complaints" && user.role === "student" && (
        <MyComplaintsTab user={user} />
      )}
      {activeTab === "review" &&
        (user.role === "admin" || user.role === "staff") && (
          <ReviewComplaintsTab user={user} />
        )}
    </div>
  );
}

function FileComplaintTab({ user }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [eligLoading, setEligLoading] = useState(true);
  const [hasActiveAllocation, setHasActiveAllocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    async function loadEligibility() {
      setEligLoading(true);
      setError("");
      try {
        const res = await apiClient.get("/complaints/student/eligibility");
        const eligible = Boolean(res.data?.data?.eligible);
        if (active) setHasActiveAllocation(eligible);
      } catch (e) {
        if (active) {
          setHasActiveAllocation(false);
          setError(safeErrMessage(e));
        }
      } finally {
        if (active) setEligLoading(false);
      }
    }
    loadEligibility();
    return () => {
      active = false;
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!title.trim() || !body.trim()) {
      setError("Title and description are required");
      return;
    }
    if (!hasActiveAllocation) {
      setError("You must have an active hall allocation to file a complaint");
      return;
    }

    setSubmitting(true);
    try {
      const first = attachments?.[0] || null;

      // Create FormData to send file
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", body.trim());
      if (first) {
        formData.append("file", first);
      }

      await apiClient.post("/complaints/student", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setTitle("");
      setBody("");
      setAttachments([]);
      setSuccess("Complaint filed successfully!");
    } catch (e2) {
      setError(safeErrMessage(e2));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments(files);
  };

  if (eligLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          File a New Complaint
        </h2>
        <div className="text-sm text-gray-600">Checking allocation…</div>
      </div>
    );
  }

  if (!hasActiveAllocation) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          File a New Complaint
        </h2>
        <div className="bg-yellow-50 border-l-4 border-yellow-300 p-4">
          <p className="text-sm text-yellow-800">
            You are not assigned to any hall. Complaints can only be filed by
            students with an active hall allocation.
          </p>
        </div>
        {error ? (
          <div className="mt-4 bg-red-50 border-l-4 border-red-300 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        File a New Complaint
      </h2>
      {error ? (
        <div className="mb-4 bg-red-50 border-l-4 border-red-300 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      ) : null}
      {success ? (
        <div className="mb-4 bg-green-50 border-l-4 border-green-300 p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      ) : null}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Brief title of your complaint"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Detailed description of the issue..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attachments (Optional — add PDF/JPG if needed)
          </label>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          {attachments.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              {attachments.length} file(s) attached:{" "}
              {attachments.map((f) => f.name).join(", ")}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit Complaint"}
        </button>
      </form>
    </div>
  );
}

function MyComplaintsTab({ user }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await apiClient.get("/complaints/student");
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
  }, []);

  const sortedComplaints = [...items].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">My Complaints</h2>

      {loading ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">Loading complaints…</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : sortedComplaints.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">You haven't filed any complaints yet.</p>
        </div>
      ) : (
        sortedComplaints.map((c) => <ComplaintCard key={c.id} complaint={c} />)
      )}
    </div>
  );
}

function ReviewComplaintsTab({ user }) {
  const [searchId, setSearchId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshToken, setRefreshToken] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [actionNotes, setActionNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [complaints, setComplaints] = useState([]);

  const formatStudentInfo = (complaint) => {
    const studentId =
      complaint?.studentId ||
      complaint?.studentUniversityId ||
      complaint?.userId;
    const name = complaint?.userName || "";
    const email = complaint?.userEmail || "";

    const idPart = studentId ? String(studentId) : "Unknown";
    const namePart = name ? `(${name})` : "";
    const emailPart = email ? ` • ${email}` : "";

    return `${idPart} ${namePart}`.trim() + emailPart;
  };

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await apiClient.get("/complaints");
        if (active) setComplaints(res.data?.data || []);
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
  }, [refreshToken]);

  const filteredComplaints = useMemo(() => {
    const normalizedSearch = searchId.trim().toLowerCase();
    return complaints.filter((c) => {
      const matchesSearch =
        !normalizedSearch || c.id.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [complaints, searchId, statusFilter]);

  const sortedComplaints = useMemo(() => {
    const entries = [...filteredComplaints];
    // Sort by newest first
    return entries.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [filteredComplaints]);

  useEffect(() => {
    if (sortedComplaints.length === 0) {
      setSelectedId(null);
      setActionNotes("");
      return;
    }
    if (!selectedId || !sortedComplaints.some((c) => c.id === selectedId)) {
      setSelectedId(sortedComplaints[0].id);
      setActionNotes("");
    }
  }, [sortedComplaints, selectedId]);

  const updateStatus = async (
    complaintId,
    status,
    notes,
    resetNotes = false,
    preserveIfEmpty = false
  ) => {
    if (!status) return;
    const normalized = typeof notes === "string" ? notes.trim() : "";
    const payload =
      normalized.length > 0 ? normalized : preserveIfEmpty ? undefined : "";

    try {
      await apiClient.post(`/complaints/${complaintId}/status`, {
        status,
        resolutionDetails: payload,
      });
      if (resetNotes) setActionNotes("");
      setRefreshToken((token) => token + 1);
    } catch (e) {
      setError(safeErrMessage(e));
    }
  };

  const handleSelect = (id) => {
    setSelectedId(id);
    setActionNotes("");
  };

  const handleQuickStatus = (complaint, status) => {
    if (!complaint || complaint.status === status) return;
    const isActive = complaint.id === selectedId;
    const noteDraft = isActive ? actionNotes : "";
    updateStatus(complaint.id, status, noteDraft, isActive, !isActive);
    setSelectedId(complaint.id);
  };

  const selectedComplaint =
    sortedComplaints.find((c) => c.id === selectedId) || null;

  const handleDecision = (status) => {
    if (!selectedComplaint || selectedComplaint.status === status) return;
    updateStatus(selectedComplaint.id, status, actionNotes, true, false);
  };

  const statusOptions = STATUS_ORDER;

  return (
    <div className="space-y-4">
      <div className="bg-white shadow rounded-lg p-4 grid gap-4 md:grid-cols-2">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Search by ID
          </label>
          <input
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="e.g. complaint-hall-ash-1"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Filter by Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">Loading complaints…</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : sortedComplaints.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No complaints to review.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
          <div
            className="border rounded-2xl shadow-sm divide-y overflow-hidden"
            style={{ backgroundColor: "#013A63" }}
          >
            {sortedComplaints.map((complaint) => {
              const createdAt = complaint.createdAt
                ? new Date(complaint.createdAt).toLocaleString()
                : "Unknown";
              return (
                <div
                  key={complaint.id}
                  onClick={() => handleSelect(complaint.id)}
                  className={`cursor-pointer border-l-4 px-4 py-3 transition shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${
                    selectedId === complaint.id
                      ? "border-blue-400"
                      : "border-transparent"
                  }`}
                  style={{
                    backgroundColor:
                      selectedId === complaint.id ? "#2C7DA0" : "#013A63",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {complaint.title || "Complaint"}
                      </div>
                      <div className="text-xs text-white">
                        {formatStudentInfo(complaint)} • {createdAt}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                        STATUS_BADGES[complaint.status] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {complaint.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-white line-clamp-3">
                    {complaint.body ||
                      complaint.description ||
                      "No description provided."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {statusOptions.map((status) => (
                      <button
                        key={`${complaint.id}-${status}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickStatus(complaint, status);
                        }}
                        className={`px-2 py-1 rounded text-xs font-semibold border ${
                          complaint.status === status
                            ? "border-transparent bg-gray-900 text-white"
                            : "border-gray-300 text-gray-600 hover:border-gray-500 hover:text-gray-800"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="border rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 p-6"
            style={{ backgroundColor: "#2C7DA0" }}
          >
            {selectedComplaint ? (
              <div className="space-y-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {selectedComplaint.title || "Complaint"}
                    </h3>
                    <div className="text-sm text-white">
                      {formatStudentInfo(selectedComplaint)} •{" "}
                      {selectedComplaint.createdAt
                        ? new Date(selectedComplaint.createdAt).toLocaleString()
                        : "Unknown"}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      STATUS_BADGES[selectedComplaint.status] ||
                      "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedComplaint.status}
                  </span>
                </div>

                <section className="space-y-2 text-sm">
                  <h4 className="font-semibold text-white">Description</h4>
                  <p className="rounded border border-gray-200 bg-gray-50 p-3 text-gray-700 whitespace-pre-line">
                    {selectedComplaint.body ||
                      selectedComplaint.description ||
                      "No description provided."}
                  </p>
                </section>

                {Array.isArray(selectedComplaint.attachments) &&
                  selectedComplaint.attachments.length > 0 && (
                    <section className="space-y-2 text-sm">
                      <h4 className="font-semibold text-white">Attachments</h4>
                      <div className="space-y-2">
                        {selectedComplaint.attachments.map((file) => {
                          const isImage =
                            /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name);
                          return (
                            <div
                              key={file.url || file.name}
                              className="flex flex-col gap-2"
                            >
                              {isImage ? (
                                <div className="bg-gray-900 rounded p-2">
                                  <img
                                    src={file.url}
                                    alt={file.name}
                                    className="max-w-full h-auto rounded"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      e.target.nextSibling.style.display =
                                        "block";
                                    }}
                                  />
                                  <a
                                    href={file.url}
                                    download={file.name}
                                    className="text-blue-300 hover:text-blue-200 underline break-all text-xs"
                                    style={{ display: "none" }}
                                  >
                                    {file.name} (Download)
                                  </a>
                                </div>
                              ) : (
                                <a
                                  href={file.url}
                                  download={file.name}
                                  className="text-blue-300 hover:text-blue-200 underline break-all text-xs"
                                >
                                  📄 {file.name} (Download)
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                {selectedComplaint.resolutionDetails ? (
                  <section className="space-y-2 text-sm">
                    <h4 className="font-semibold text-white">Admin Notes</h4>
                    <p className="rounded border border-blue-100 bg-blue-50 p-3 text-blue-900 whitespace-pre-line">
                      {selectedComplaint.resolutionDetails}
                    </p>
                  </section>
                ) : null}

                <section className="space-y-3">
                  <h4 className="text-sm font-semibold text-white">Decision</h4>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    placeholder="Optional: add notes about this update."
                  />
                  <div className="flex flex-wrap gap-3">
                    {statusOptions.map((status) => (
                      <button
                        key={`detail-${status}`}
                        onClick={() => handleDecision(status)}
                        className={`px-4 py-2 rounded text-sm font-medium shadow-sm ${
                          selectedComplaint.status === status
                            ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                        disabled={selectedComplaint.status === status}
                      >
                        Set {status}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Select a complaint to view full details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ComplaintCard({ complaint, extraContent }) {
  const [showDetails, setShowDetails] = useState(false);
  const description =
    complaint.body || complaint.description || "No description provided.";
  const createdAt = complaint.createdAt
    ? new Date(complaint.createdAt).toLocaleString()
    : "Unknown";
  const updatedAt = complaint.updatedAt
    ? new Date(complaint.updatedAt).toLocaleString()
    : null;
  const attachments = Array.isArray(complaint.attachments)
    ? complaint.attachments
    : [];
  const filer =
    complaint.userName || complaint.studentId || complaint.userId || "Unknown";

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {complaint.title || "Complaint"}
          </h3>
          <div className="text-sm text-gray-500">
            Filed by: {filer} • {createdAt}
          </div>
          <p className="text-gray-700 line-clamp-3 md:line-clamp-2">
            {description}
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              STATUS_BADGES[complaint.status] || "bg-gray-100 text-gray-800"
            }`}
          >
            {complaint.status || "Pending"}
          </span>
          <button
            onClick={() => setShowDetails((prev) => !prev)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {showDetails ? "Hide details" : "View details"}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-5 border-t pt-4 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-1">
              Full Description
            </h4>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>

          {attachments.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">
                Attachments
              </h4>
              <ul className="list-disc list-inside text-sm text-blue-600">
                {attachments.map((file) => (
                  <li key={file.url || file.name}>{file.name || file.url}</li>
                ))}
              </ul>
            </div>
          )}

          {updatedAt && (
            <div className="text-sm text-gray-500">
              Last updated: {updatedAt}
            </div>
          )}

          {complaint.resolutionDetails && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="text-sm font-semibold text-blue-900 mb-1">
                Response from Hall administration
              </div>
              <p className="text-sm text-blue-900 whitespace-pre-line">
                {complaint.resolutionDetails}
              </p>
            </div>
          )}

          {extraContent && (
            <div className="bg-gray-100 rounded-lg p-4 space-y-3">
              {extraContent}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
