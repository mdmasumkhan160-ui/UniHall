import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Notifications from "../shared/Notifications.jsx";
import Profile from "../shared/Profile.jsx";
import Complaints from "../shared/Complaints.jsx";
import StudentApplications from "./StudentApplications.jsx";
import StudentSeatPlans from "./StudentSeatPlans.jsx";
import FormFill from "./FormFill.jsx";
import StudentRenewals from "./StudentRenewals.jsx";
import apiClient from "../../lib/apiClient.js";

function SidebarLink({ to, label, icon, currentPath, onClick }) {
  const active = currentPath === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
        active
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
          : "bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/60 hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
      )}
      {typeof icon === "string" ? (
        <span
          className={`text-xl transition-transform duration-300 ${
            active
              ? "scale-110"
              : "opacity-70 group-hover:opacity-100 group-hover:scale-110"
          }`}
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : (
        icon
      )}
      <span className={active ? "font-semibold" : ""}>{label}</span>
      {!active && (
        <svg
          className="ml-auto w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      )}
    </Link>
  );
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const path = location.pathname || "";

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [allocationEligible, setAllocationEligible] = useState(false);
  const [eligibility, setEligibility] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadEligibility() {
      try {
        const res = await apiClient.get("/renewals/student/eligibility");
        const data = res.data?.data;
        const eligible = Boolean(data?.eligible);
        if (active) {
          setAllocationEligible(eligible);
          setEligibility(data || null);
        }
      } catch (e) {
        if (active) {
          setAllocationEligible(false);
          setEligibility(null);
        }
      }
    }
    loadEligibility();
    return () => {
      active = false;
    };
  }, []);

  const expiryLabel = useMemo(() => {
    const iso = eligibility?.expiresAt;
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString();
  }, [eligibility]);

  const ActiveSection = useMemo(() => {
    if (path.startsWith("/student/profile")) return <Profile />;
    if (path.startsWith("/student/applications"))
      return <StudentApplications />;
    if (path.startsWith("/student/seatplans")) return <StudentSeatPlans />;
    if (path.startsWith("/student/form")) return <FormFill />;
    if (path.startsWith("/student/renewals")) return <StudentRenewals />;
    if (path.startsWith("/student/complaints")) return <Complaints />;
    return <Notifications />;
  }, [path]);

  return (
    <div
      className="relative flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] overflow-hidden rounded-3xl"
      style={{ backgroundColor: "#123456" }}
    >
      {/* Left sidebar navigation (desktop) */}
      <aside
        className="hidden lg:block w-full lg:w-80 flex-shrink-0 overflow-hidden rounded-2xl max-h-[calc(100vh-8rem)] shadow-lg"
        style={{ backgroundColor: "#123456" }}
      >
        <div
          className="shadow-sm p-6 overflow-y-auto h-full"
          style={{ backgroundColor: "transparent" }}
        >
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white">Student Portal</h3>
          </div>

          {allocationEligible && expiryLabel ? (
            <div className="mb-6 rounded-xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-200/60 px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-amber-700 font-bold mb-1.5 uppercase tracking-wide">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Seat Expiry
              </div>
              <div className="text-lg font-bold text-amber-900">
                {expiryLabel}
              </div>
              <div className="text-xs text-amber-700 mt-1">
                Please renew before expiry
              </div>
            </div>
          ) : null}

          <nav className="space-y-2">
            <SidebarLink
              to="/student/profile"
              label="Profile"
              icon="👤"
              currentPath={path}
            />
            <SidebarLink
              to="/student"
              label="Notice"
              icon="📢"
              currentPath={path}
            />
            <SidebarLink
              to="/student/form"
              label="Application Form"
              icon="📝"
              currentPath={path}
            />
            <SidebarLink
              to="/student/applications"
              label="My Applications"
              icon="📄"
              currentPath={path}
            />
            <SidebarLink
              to="/student/seatplans"
              label="Exam Seat Plans"
              icon="🪑"
              currentPath={path}
            />
            {allocationEligible && (
              <>
                <div className="pt-3 pb-1">
                  <div className="text-xs font-bold text-white/50 uppercase tracking-wider px-4">
                    Allocated Services
                  </div>
                </div>
                <SidebarLink
                  to="/student/renewals"
                  label="Renewals"
                  icon="🔁"
                  currentPath={path}
                />
                <SidebarLink
                  to="/student/complaints"
                  label="Complaints"
                  icon="⚠️"
                  currentPath={path}
                />
              </>
            )}
          </nav>
        </div>
      </aside>

      {/* Mobile menu button + overlay */}
      <div className="lg:hidden">
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 text-white flex items-center justify-center text-lg font-bold shadow-md">
              {String(user?.name || "S")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold text-slate-800 truncate">
                {user?.name || "Student"}
              </div>
              <div className="text-xs text-slate-500 truncate">
                Student Portal
              </div>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            onClick={() => setIsMenuOpen(true)}
          >
            <span className="text-xl" aria-hidden="true">
              ☰
            </span>
            <span className="font-semibold">Menu</span>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside
            className="absolute top-0 left-0 h-full w-80 max-w-full shadow-2xl overflow-y-auto"
            style={{ backgroundColor: "#123456" }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Student Portal
                  </h3>
                </div>
                <button
                  type="button"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 hover:text-white text-2xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ×
                </button>
              </div>

              {allocationEligible && expiryLabel ? (
                <div className="mb-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200/60 px-4 py-3 shadow-sm">
                  <div className="text-xs text-amber-700 font-bold uppercase tracking-wide mb-1">
                    Seat Expiry
                  </div>
                  <div className="text-base font-bold text-amber-900">
                    {expiryLabel}
                  </div>
                </div>
              ) : null}

              <nav className="space-y-2">
                <SidebarLink
                  to="/student/profile"
                  label="Profile"
                  icon="👤"
                  currentPath={path}
                  onClick={() => setIsMenuOpen(false)}
                />
                <SidebarLink
                  to="/student"
                  label="Notice"
                  icon="📢"
                  currentPath={path}
                  onClick={() => setIsMenuOpen(false)}
                />
                <SidebarLink
                  to="/student/form"
                  label="Application Form"
                  icon="📝"
                  currentPath={path}
                  onClick={() => setIsMenuOpen(false)}
                />
                <SidebarLink
                  to="/student/applications"
                  label="My Applications"
                  icon="📄"
                  currentPath={path}
                  onClick={() => setIsMenuOpen(false)}
                />
                <SidebarLink
                  to="/student/seatplans"
                  label="Exam Seat Plans"
                  icon="🪑"
                  currentPath={path}
                  onClick={() => setIsMenuOpen(false)}
                />
                {allocationEligible && (
                  <>
                    <div className="pt-3 pb-1">
                      <div className="text-xs font-bold text-white/50 uppercase tracking-wider px-4">
                        Allocated Services
                      </div>
                    </div>
                    <SidebarLink
                      to="/student/renewals"
                      label="Renewals"
                      icon="🔁"
                      currentPath={path}
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <SidebarLink
                      to="/student/complaints"
                      label="Complaints"
                      icon="⚠️"
                      currentPath={path}
                      onClick={() => setIsMenuOpen(false)}
                    />
                  </>
                )}
              </nav>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div
        className="flex-1 overflow-hidden min-h-0 rounded-2xl shadow-lg"
        style={{ backgroundColor: "#123456" }}
      >
        {/* Content area */}
        <div
          className="p-6 min-h-[calc(100vh-20rem)] overflow-y-auto h-full backdrop-blur-xl"
          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
        >
          {ActiveSection}
        </div>
      </div>
    </div>
  );
}
