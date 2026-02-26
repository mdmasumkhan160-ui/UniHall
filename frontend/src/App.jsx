import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import * as api from "./lib/mockApi.js";
import apiClient from "./lib/apiClient.js";
import { getHallImage } from "./lib/hallImages.js";

import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import StudentSeatPlans from "./pages/student/StudentSeatPlans.jsx";
import StudentApplications from "./pages/student/StudentApplications.jsx";
import FormFill from "./pages/student/FormFill.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import StaffDashboard from "./pages/staff/StaffDashboard.jsx";
import ExamDashboard from "./pages/exam/ExamDashboard.jsx";
import Results from "./pages/exam/Results.jsx";
import SeatPlans from "./pages/exam/SeatPlans.jsx";
import ExamLayout from "./components/ExamLayout.jsx";
import Profile from "./pages/shared/Profile.jsx";
import Notifications from "./pages/shared/Notifications.jsx";
import Complaints from "./pages/shared/Complaints.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";

function Nav() {
  const { user, logout } = useAuth();
  const [hallName, setHallName] = useState(null);
  const [hallCode, setHallCode] = useState(null);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    async function loadHallName() {
      if (!user || user.role !== "admin") {
        if (!cancelled) {
          setHallName(null);
          setHallCode(null);
        }
        return;
      }
      try {
        const res = await apiClient.get("/profile");
        if (!cancelled) {
          const name = res.data?.data?.profile?.hallName || null;
          const code = res.data?.data?.profile?.hallCode || null;
          setHallName(name);
          setHallCode(code);
        }
      } catch (_) {
        if (!cancelled) {
          setHallName(null);
          setHallCode(null);
        }
      }
    }
    loadHallName();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Close admin menu when route changes
  useEffect(() => {
    setIsAdminMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-4">
          <Link
            to="/"
            className="font-bold text-xl text-brand-700 hover:text-brand-800 transition-colors"
          >
            UniHall
          </Link>
          {user?.role === "admin" && (
            <button
              type="button"
              className="lg:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium shadow-soft hover:bg-gray-50 hover:border-gray-400 transition-all"
              onClick={() => setIsAdminMenuOpen(true)}
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <span>Menu</span>
            </button>
          )}
          <nav className="text-sm text-gray-600 flex gap-3 items-center">
            {user?.role === "admin" && hallName && (
              <>
                <span className="font-semibold text-gray-900 px-3 py-1.5 bg-brand-50 rounded-lg sm:hidden">
                  {(hallCode || hallName).toString().toUpperCase()}
                </span>
                <span className="font-semibold text-gray-900 px-3 py-1.5 bg-brand-50 rounded-lg hidden sm:inline">
                  {hallName}
                </span>
              </>
            )}
            {user?.role === "examcontroller" && (
              <Link to="/exam" className="hover:text-brand-700">
                Exam
              </Link>
            )}
            {user?.role === "staff" && (
              <Link to="/staff" className="hover:text-brand-700">
                Staff
              </Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to={
                    user.role === "admin"
                      ? "/admin/notifications"
                      : user.role === "student"
                        ? "/student"
                        : "/notifications"
                  }
                  className="relative group px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl shadow-md hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  <span className="text-base group-hover:animate-bounce">
                    🔔
                  </span>
                  <span>Notifications</span>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-md hover:shadow-xl hover:shadow-red-500/40 hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center gap-2 group"
                >
                  <span className="text-base group-hover:rotate-12 transition-transform duration-300">
                    🚪
                  </span>
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-all shadow-soft"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {user?.role === "admin" && isAdminMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsAdminMenuOpen(false)}
          />
          <aside className="absolute top-0 left-0 h-full w-72 max-w-full bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-brand-600 to-brand-700 text-white px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-base font-bold tracking-wide">Admin Menu</h2>
              <button
                type="button"
                className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-all"
                onClick={() => setIsAdminMenuOpen(false)}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <nav className="p-4 space-y-1">
              <Link
                to="/admin"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === "/admin"
                    ? "bg-brand-50 text-brand-700 border-l-4 border-brand-600"
                    : "text-gray-700 hover:bg-gray-50"
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
                to="/admin/forms"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === "/admin/forms"
                    ? "bg-brand-50 text-brand-700 border-l-4 border-brand-600"
                    : "text-gray-700 hover:bg-gray-50"
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
                <span>Forms</span>
              </Link>
              <Link
                to="/admin/applications"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === "/admin/applications"
                    ? "bg-brand-50 text-brand-700 border-l-4 border-brand-600"
                    : "text-gray-700 hover:bg-gray-50"
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
                <span>Applications</span>
              </Link>
              <Link
                to="/admin/interviews"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === "/admin/interviews"
                    ? "bg-brand-50 text-brand-700 border-l-4 border-brand-600"
                    : "text-gray-700 hover:bg-gray-50"
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Interviews</span>
              </Link>
              <Link
                to="/admin/allocations"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === "/admin/allocations"
                    ? "bg-brand-50 text-brand-700 border-l-4 border-brand-600"
                    : "text-gray-700 hover:bg-gray-50"
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span>Seat Allocation</span>
              </Link>
              <Link
                to="/admin/manage-allocations"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === "/admin/manage-allocations"
                    ? "bg-brand-50 text-brand-700 border-l-4 border-brand-600"
                    : "text-gray-700 hover:bg-gray-50"
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Manage Allocation</span>
              </Link>
              <Link
                to="/admin/disciplinary"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === "/admin/disciplinary"
                    ? "bg-brand-50 text-brand-700 border-l-4 border-brand-600"
                    : "text-gray-700 hover:bg-gray-50"
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>Disciplinary Records</span>
              </Link>
              <Link
                to="/admin/notifications"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === "/admin/notifications"
                    ? "bg-brand-50 text-brand-700 border-l-4 border-brand-600"
                    : "text-gray-700 hover:bg-gray-50"
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
                <span>Push Notifications</span>
              </Link>
              <Link
                to="/admin/rooms"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === "/admin/rooms"
                    ? "bg-brand-50 text-brand-700 border-l-4 border-brand-600"
                    : "text-gray-700 hover:bg-gray-50"
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span>Create Hall Rooms</span>
              </Link>
              <Link
                to="/admin/waitlist"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === "/admin/waitlist"
                    ? "bg-brand-50 text-brand-700 border-l-4 border-brand-600"
                    : "text-gray-700 hover:bg-gray-50"
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <span>Waiting List</span>
              </Link>
              <Link
                to="/admin/renewals"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === "/admin/renewals"
                    ? "bg-brand-50 text-brand-700 border-l-4 border-brand-600"
                    : "text-gray-700 hover:bg-gray-50"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Renewals</span>
              </Link>
              <Link
                to="/admin/results"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === "/admin/results"
                    ? "bg-brand-50 text-brand-700 border-l-4 border-brand-600"
                    : "text-gray-700 hover:bg-gray-50"
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
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
                <span>Results &amp; Exam</span>
              </Link>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}

function NotificationTicker() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function fetchNotifications() {
      try {
        const res = await apiClient.get("/notifications");
        if (!cancelled) setItems((res.data?.data || []).slice(0, 10));
      } catch (_) {
        if (!cancelled) setItems([]);
      }
    }
    if (user) fetchNotifications();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Always show the ticker row for admins, even if there are no notifications,
  // so all hall admins see a consistent layout.
  if (!user || user.role !== "admin") {
    if (!items.length) return null;
  }

  const hasItems = items.length > 0;
  const tickerMessage = hasItems
    ? items
        .map((n) => `${n.title || "Update"} - ${n.body || n.message || ""}`)
        .join("  |  ")
    : "No notifications yet";

  const duration = Math.max(12, tickerMessage.length / 5);

  return (
    <>
      <style>{`
        @keyframes uh-ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
      <div className="bg-gradient-to-r from-brand-600 to-accent-600 text-white text-sm shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-4 overflow-hidden">
          <div className="flex items-center gap-2">
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-semibold uppercase tracking-wider text-xs">
              Notice
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <div
              className="whitespace-nowrap font-medium"
              style={
                hasItems
                  ? { animation: `uh-ticker ${duration}s linear infinite` }
                  : undefined
              }
            >
              {tickerMessage}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ProtectedRoute({ children, roles }) {
  const { user, isAuthLoading } = useAuth();
  const location = useLocation();
  if (isAuthLoading) {
    return (
      <div className="py-10 text-center text-gray-500">Verifying access...</div>
    );
  }
  if (!user)
    return (
      <Navigate
        to="/login"
        state={{ from: `${location.pathname}${location.search || ""}` }}
        replace
      />
    );

  const dashboardPath = getDashboardPathForRole(user?.role);
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={dashboardPath} replace />;
  }
  return children;
}

function getDashboardPathForRole(role) {
  const r = String(role || "").toLowerCase();
  if (r === "admin") return "/admin";
  if (r === "examcontroller") return "/exam";
  if (r === "staff") return "/staff";
  return "/student";
}

function HomeRoute() {
  const { user, isAuthLoading } = useAuth();
  if (isAuthLoading) {
    return <div className="py-10 text-center text-gray-500">Loading...</div>;
  }
  if (user) {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }
  return <Home />;
}

function PublicOnlyRoute({ children }) {
  const { user, isAuthLoading } = useAuth();
  if (isAuthLoading) {
    return <div className="py-10 text-center text-gray-500">Loading...</div>;
  }
  if (user) {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }
  return children;
}

export default function App() {
  const { user } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const effectiveHallId = user ? api.getEffectiveHallId(user) : null;
  const hallObj = effectiveHallId ? api.getHallById(effectiveHallId) : null;
  const hallImg = getHallImage(hallObj);
  const bgStyle = {};

  const mainClassName = isHome
    ? "relative flex-1 w-full px-4 sm:px-6 py-8"
    : "relative flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8";

  return (
    <div
      className="min-h-screen flex flex-col relative bg-gray-50"
      style={bgStyle}
    >
      <Nav />
      <NotificationTicker />
      <main className={mainClassName}>
        <Routes>
          <Route index element={<HomeRoute />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/notifications"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/form"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/seatplans"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/applications"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/renewals"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/complaints"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/interviews"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/forms"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/disciplinary"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/seat-plan"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/waitlist"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/allocations"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-allocations"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/renewals"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/results"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/rooms"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/exam"
            element={
              <ProtectedRoute roles={["examcontroller"]}>
                <ExamLayout>
                  <ExamDashboard />
                </ExamLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/results"
            element={
              <ProtectedRoute roles={["examcontroller"]}>
                <ExamLayout>
                  <Results />
                </ExamLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/seat-plans"
            element={
              <ProtectedRoute roles={["examcontroller"]}>
                <ExamLayout>
                  <SeatPlans />
                </ExamLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/notifications"
            element={
              <ProtectedRoute roles={["examcontroller"]}>
                <ExamLayout>
                  <Notifications />
                </ExamLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff"
            element={
              <ProtectedRoute roles={["staff"]}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/notifications" element={<Notifications />} />
          <Route
            path="/complaints"
            element={
              <ProtectedRoute roles={["admin", "staff", "student"]}>
                <Complaints />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function Home() {
  const { user } = useAuth();
  const [selectedHall, setSelectedHall] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Ensure seed data is available
  api.ensureSeedData();

  const allHalls = api.listHalls();
  const order = ["ASH", "MUH", "BKH", "JSH", "NFH"];
  const seen = new Set();
  const halls = [];
  for (const hall of allHalls) {
    if (hall && hall.shortName && !seen.has(hall.shortName)) {
      halls.push(hall);
      seen.add(hall.shortName);
    }
  }
  halls.sort((a, b) => order.indexOf(a.shortName) - order.indexOf(b.shortName));

  // Slideshow effect - rotate through hall images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % halls.length);
    }, 4000); // Change image every 4 seconds
    return () => clearInterval(interval);
  }, [halls.length]);

  const handleHallClick = (hall) => setSelectedHall(hall);
  const closeModal = () => setSelectedHall(null);

  return (
    <section className="space-y-10">
      {/* Dynamic Image Showcase Section */}
      <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-soft-lg">
        {/* Background images with fade transitions */}
        {halls.map((hall, index) => (
          <div
            key={hall.id}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{
              backgroundImage: `url(${getHallImage(hall)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: index === currentImageIndex ? 1 : 0,
            }}
            aria-hidden={index !== currentImageIndex}
          />
        ))}

        {/* Semi-transparent overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />

        {/* Off-white content overlay for contrast */}
        <div className="absolute inset-0 bg-white/5" />

        {/* Content layer with proper z-index */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg mb-4">
            *****NSTU Halls of Residence*****
          </h1>
          <p className="text-lg md:text-xl text-white drop-shadow-md mb-8 max-w-2xl">
            Apply for halls online at Noakhali Science and Technology
            University$&&&&
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/login"
              className="px-8 py-3 bg-brand-600 text-white rounded-lg font-semibold shadow-lg hover:bg-brand-700 transition-all duration-200 transform hover:scale-105"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-brand-700 rounded-lg font-semibold shadow-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
            >
              Register
            </Link>
          </div>
        </div>

        {/* Slideshow indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
          {halls.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentImageIndex
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Image counter */}
        <div className="absolute top-6 right-6 z-10 bg-black/40 text-white px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
          {currentImageIndex + 1} / {halls.length}
        </div>
      </div>

      {/* Hall selection section */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Our Halls of Residence
            </h2>
            <p className="text-base text-gray-600 mt-2">
              Explore our residential halls and apply for them online.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {halls.map((hall) => {
            const isAdminHall =
              user?.role === "admin" && user?.hallId === hall.id;
            const Component = isAdminHall ? Link : "button";
            const props = isAdminHall
              ? { to: "/admin" }
              : { type: "button", onClick: () => handleHallClick(hall) };

            return (
              <Component
                key={hall.id}
                {...props}
                className="block group w-full text-left"
              >
                <div className="relative h-56 rounded-xl overflow-hidden bg-gray-200 shadow-soft hover:shadow-soft-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div
                    className="absolute inset-0 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundImage: `url(${getHallImage(hall)})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/70 transition-all duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <div className="text-lg font-bold leading-tight mb-2 drop-shadow-lg">
                      {hall.name}
                    </div>
                    <div className="text-xs text-white/95 font-medium">
                      {hall.shortName} • {hall.category}
                    </div>
                    <div className="text-xs text-white/80 mt-1">
                      Est. {hall.established}
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 bg-white rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
                    <span className="text-brand-700 text-xs font-semibold flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                      View
                    </span>
                  </div>
                </div>
              </Component>
            );
          })}
        </div>
      </div>

      {selectedHall && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-brand-600 to-brand-700 text-white px-6 py-5 flex items-center justify-between z-10 rounded-t-2xl">
              <h2 className="text-2xl font-bold">{selectedHall.name}</h2>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-2/5">
                  <div className="relative h-72 md:h-96 rounded-xl overflow-hidden shadow-soft-lg">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${getHallImage(selectedHall)})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <span className="inline-block bg-brand-100 text-brand-800 px-5 py-2 rounded-full text-sm font-bold">
                      {selectedHall.shortName}
                    </span>
                  </div>
                </div>

                <div className="md:w-3/5 space-y-6">
                  <div className="flex items-center gap-2 text-gray-600">
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-sm font-medium">
                      Established in {selectedHall.established}
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-brand-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Hall Details
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <DetailBullet
                          label="Category"
                          value={selectedHall.category}
                        />
                        <DetailBullet
                          label="Capacity"
                          value={`${selectedHall.capacity}+ students`}
                        />
                        <DetailBullet
                          label="Location"
                          value="NSTU Campus, Sonapur"
                        />
                        <DetailBullet
                          label="Established"
                          value={selectedHall.established}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-brand-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 012 2z"
                          />
                        </svg>
                        Contact Information
                      </h3>
                      <div className="space-y-4">
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-semibold">
                            Provost
                          </p>
                          <p className="font-bold text-gray-900 mb-4 text-lg">
                            {selectedHall.provost?.name || "Hall Provost"}
                          </p>
                          <div className="space-y-2.5 text-sm">
                            {selectedHall.provost?.phone && (
                              <a
                                href={`tel:${selectedHall.provost.phone}`}
                                className="flex items-center gap-3 text-brand-600 hover:text-brand-700 font-medium transition-colors"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                  />
                                </svg>
                                <span>{selectedHall.provost.phone}</span>
                              </a>
                            )}
                            {selectedHall.provost?.email && (
                              <a
                                href={`mailto:${selectedHall.provost.email}`}
                                className="flex items-center gap-3 text-brand-600 hover:text-brand-700 font-medium transition-colors"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 012 2z"
                                  />
                                </svg>
                                <span>{selectedHall.provost.email}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedHall.address && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-brand-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Address
                        </h3>
                        <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                          {selectedHall.address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-soft-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <svg
            className="w-7 h-7 text-brand-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          University Contact Information
        </h2>
        <div className="grid md:grid-cols-2 gap-8 text-sm">
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 text-base mb-4">
              Noakhali Science and Technology University
            </h3>
            <div className="space-y-2 text-gray-700">
              <p className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 mt-0.5 text-brand-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Sonapur, Noakhali-3814, Bangladesh</span>
              </p>
              <p className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-brand-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>Phone: +880-2334-496522</span>
              </p>
              <p className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-brand-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                <span>Fax: +880-2334-496523</span>
              </p>
              <p className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-brand-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 012 2z"
                  />
                </svg>
                <span>Email: registrar@office.nstu.edu.bd</span>
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 text-base mb-4">
              Important Links
            </h3>
            <div className="space-y-2.5">
              <a
                href="https://nstu.edu.bd"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium transition-colors group"
              >
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                <span>NSTU Official Website</span>
              </a>
              <a
                href="https://nstu.edu.bd/halls.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium transition-colors group"
              >
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                <span>Halls Information</span>
              </a>
              <a
                href="https://www.admission.nstu.edu.bd/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium transition-colors group"
              >
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                <span>Admission Portal</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DetailBullet({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-brand-300 transition-colors">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
