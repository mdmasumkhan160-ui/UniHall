import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/apiClient.js";
import { pushNotification } from "../../lib/examApi.js";

export default function Notifications() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const [userNotifications, setUserNotifications] = useState([]);
  const canAdmin = user?.role === "admin" || user?.role === "examcontroller";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get("/notifications");
        if (!cancelled) setUserNotifications(res.data?.data || []);
      } catch (_) {
        if (!cancelled) setUserNotifications([]);
      }
    }
    if (user) load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div
      className="grid gap-6"
      style={{
        backgroundColor: "#013A63",
        padding: "1.5rem",
        borderRadius: "0.5rem",
      }}
    >
      {/* Interview schedule details are included in notification bodies from server */}

      <div
        className="border rounded p-4"
        style={{ backgroundColor: "#2c7da0" }}
      >
        <h2 className="font-semibold mb-4 text-lg text-white">📢 Notice</h2>
        {userNotifications.length === 0 ? (
          <p className="text-white text-center py-4">No notice</p>
        ) : (
          <div className="space-y-3">
            {userNotifications.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-lg border border-gray-300 bg-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {!n.read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                      <h3 className="font-semibold text-gray-900">{n.title}</h3>
                    </div>
                    <p className="text-sm mt-1 text-gray-800">
                      {n.message || n.body}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {/* Mark as read wiring can be added when backend supports it */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {canAdmin && (
        <div
          className="border rounded p-4"
          style={{ backgroundColor: "#2c7da0" }}
        >
          <h2 className="font-semibold mb-3 text-white">📝 Post Notice</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!title.trim() || !body.trim()) {
                alert("Please provide both title and body for the notice");
                return;
              }

              setSending(true);
              try {
                const response = await pushNotification({
                  title: title.trim(),
                  message: body.trim(),
                  recipientType: "all",
                  priority: "MEDIUM",
                });

                if (response.success) {
                  alert(response.message || "Notice sent successfully!");
                  setTitle("");
                  setBody("");
                  const res = await api.get("/notifications");
                  setUserNotifications(res.data?.data || []);
                }
              } catch (err) {
                console.error(err);
                alert(err.response?.data?.message || "Failed to send notice");
              } finally {
                setSending(false);
              }
            }}
            className="grid gap-3 max-w-lg"
          >
            <input
              className="border rounded px-3 py-2"
              placeholder="Notice Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              className="border rounded px-3 py-2"
              rows={4}
              placeholder="Notice Message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 text-white rounded-full w-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#00B4D8" }}
            >
              {sending ? "Sending..." : "📤 Send Notice to Everyone"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
