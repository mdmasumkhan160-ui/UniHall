import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DynamicFormRenderer from "../../components/DynamicFormRenderer.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/apiClient.js";

// Helper: derive hall from studentId if not allocated yet
function inferHallIdFromStudent(user) {
  // If already allocated, use that
  if (user.hallId) return user.hallId;

  // If not allocated but has studentId, infer from ID prefix
  if (user.studentId) {
    const prefix = user.studentId.substring(0, 3).toUpperCase();
    // Map common hall prefixes
    const hallMap = {
      MUH: "hall-muh",
      ASH: "hall-ash",
      SFH: "hall-sfh",
      BAH: "hall-bah",
    };
    return hallMap[prefix] || null;
  }

  return null;
}

export default function FormFill() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedForm, setSelectedForm] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [checkingDup, setCheckingDup] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const formatApiError = (err) => {
    const status = err?.response?.status;
    const message =
      err?.response?.data?.message || err?.message || "Submission failed";
    return status ? `${message} (HTTP ${status})` : message;
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/forms/student/active");
        if (!ignore) {
          setSelectedForm(data?.data || null);
        }
      } catch (err) {
        if (!ignore) {
          const message =
            err.response?.data?.message ||
            "No active form available for you right now.";
          setError(message);
          setSelectedForm(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [user?.hallId, user?.studentId]);

  // Prevent duplicate applications: if already applied for this form, warn and redirect
  useEffect(() => {
    let cancelled = false;
    async function checkDuplicate() {
      if (!selectedForm?.id) return;
      setCheckingDup(true);
      try {
        const res = await api.get("/forms/student/applications");
        const apps = res.data?.data || [];
        const already = apps.some(
          (a) =>
            (a.formId && a.formId === selectedForm.id) ||
            (a.formTitle &&
              selectedForm.title &&
              a.formTitle === selectedForm.title)
        );
        if (already && !cancelled) {
          setBlocked(true);
        }
      } catch (_) {
        // ignore; backend will still prevent duplicates on submit
      } finally {
        if (!cancelled) setCheckingDup(false);
      }
    }
    checkDuplicate();
    return () => {
      cancelled = true;
    };
  }, [selectedForm?.id, selectedForm?.title, nav]);

  // When blocked, show banner briefly then redirect to My Applications
  useEffect(() => {
    if (!blocked) return;
    const t = setTimeout(() => {
      nav("/student/applications", { replace: true });
    }, 2200);
    return () => clearTimeout(t);
  }, [blocked, nav]);

  const submit = async ({ data, attachments }) => {
    if (!selectedForm?.id) return;
    setError("");
    setSubmitting(true);
    try {
      // Transform file objects into simplified attachment descriptors (stub URL handling)
      const attachmentPayload = {};
      Object.entries(attachments || {}).forEach(([fieldId, file]) => {
        if (file) {
          attachmentPayload[fieldId] = {
            name: file.name,
            type: file.type,
            // In production: upload first, get URL. For now use placeholder path.
            url: `/uploads/pending/${encodeURIComponent(file.name)}`,
          };
        }
      });

      await api.post(`/forms/${selectedForm.id}/submit`, {
        data,
        attachments: attachmentPayload,
      });
      alert("Application submitted successfully!");
      nav("/student");
    } catch (err) {
      console.error("[FormFill] submit failed", err);
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-6">Loading form...</div>
    );
  }

  if (!selectedForm) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No Forms Available
        </h2>
        <p className="text-gray-600">
          {error ||
            "There are currently no active admission forms for your hall. Please check back later or contact your hall administrator."}
        </p>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <div className="shrink-0 text-red-600" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm.75 5.25a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6zm-1.5 9a.75.75 0 101.5 0 .75.75 0 00-1.5 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-red-800">
              You already applied for this form
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Duplicate submissions are not allowed. Redirecting you to My
              Applications…
            </p>
            <div className="mt-3">
              <button
                onClick={() => nav("/student/applications", { replace: true })}
                className="text-sm font-medium text-red-700 underline"
              >
                Go now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (checkingDup) {
    return (
      <div className="bg-white border rounded-lg p-6">
        Checking your eligibility…
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {selectedForm?.title || selectedForm?.name || "Hall Admission Form"}
        </h2>
        <p className="text-sm text-gray-600">
          Complete the form below to apply for accommodation in your hall.
        </p>
        {selectedForm?.sessionYears?.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Eligible Sessions: {selectedForm.sessionYears.join(", ")}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {selectedForm && (
        <DynamicFormRenderer
          schema={selectedForm.schema || []}
          onSubmit={submit}
          submitLabel={submitting ? "Submitting…" : "Submit Application"}
        />
      )}
    </div>
  );
}
