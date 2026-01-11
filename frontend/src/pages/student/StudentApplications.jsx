import React, { useEffect, useState, useMemo } from "react";
import api from "../../lib/apiClient.js";

export default function StudentApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/forms/student/applications");
        setApps(res.data?.data || []);
      } catch (e) {
        setError("Failed to load applications");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statuses = useMemo(
    () => Array.from(new Set(apps.map((a) => a.status).filter(Boolean))),
    [apps]
  );
  const pretty = (s) => {
    if (!s) return "Submitted";
    if (s === "not-alloted") return "Not-Alloted";
    return String(s)
      .split(" ")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  };

  const visible = useMemo(() => {
    if (filterStatus === "all") return apps;
    return apps.filter((a) => a.status === filterStatus);
  }, [apps, filterStatus]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">My Applications</h1>
        <p className="text-white font-bold">
          Track your application status and view submission details.
        </p>
      </header>

      <section className="bg-white border rounded-xl p-4 space-y-3">
        <div className="flex gap-3 items-center">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded px-3 py-2 text-sm text-white font-medium hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: "#123456" }}
          >
            <option value="all">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {pretty(s)}
              </option>
            ))}
          </select>
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </section>

      <section className="space-y-3">
        {visible.map((app) => (
          <article key={app.id} className="bg-white border rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {app.formTitle || "Application"}
                </h2>
                <p className="text-sm text-gray-600">
                  Submitted: {new Date(app.submittedAt).toLocaleString()}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-800">
                {pretty(app.status || "submitted")}
              </span>
            </div>
            {app.attachments?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Attachments
                </p>
                <ul className="text-sm text-gray-700 list-disc pl-5">
                  {app.attachments.map((att, idx) => (
                    <li key={idx}>
                      <a
                        href={att.url}
                        className="text-blue-600 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {att.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}
        {visible.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-500">
            No applications to show.
          </div>
        )}
      </section>
    </div>
  );
}
