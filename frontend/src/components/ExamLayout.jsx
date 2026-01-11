import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";

export default function ExamLayout({ children }) {
  const location = useLocation();

  return (
    <div
      className="flex gap-6 rounded-3xl overflow-hidden p-4"
      style={{ backgroundColor: "#234e78" }}
    >
      {/* Sidebar */}
      <aside
        className="hidden lg:block w-64 flex-shrink-0 rounded-2xl overflow-hidden shadow-lg"
        style={{ backgroundColor: "#234e78" }}
      >
        <div
          className="p-4 sticky top-24"
          style={{ backgroundColor: "transparent" }}
        >
          <h2 className="text-xs font-bold text-white mb-5 uppercase tracking-wider px-1">
            Exam Controller
          </h2>
          <nav className="space-y-1">
            <Link
              to="/exam"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                location.pathname === "/exam"
                  ? "bg-white/10 text-white border-l-4 border-white/30"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span>Dashboard</span>
            </Link>

            <Link
              to="/exam/seat-plans"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                location.pathname === "/exam/seat-plans"
                  ? "bg-white/10 text-white border-l-4 border-white/30"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              <span>Seat Plans</span>
            </Link>

            <Link
              to="/exam/results"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                location.pathname === "/exam/results"
                  ? "bg-white/10 text-white border-l-4 border-white/30"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Results</span>
            </Link>

            <Link
              to="/profile"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                location.pathname === "/profile"
                  ? "bg-white/10 text-white border-l-4 border-white/30"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Profile</span>
            </Link>

            <Link
              to="/exam/notifications"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                location.pathname === "/exam/notifications"
                  ? "bg-white/10 text-white border-l-4 border-white/30"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span>Notifications</span>
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 rounded-2xl bg-slate-50 p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}
