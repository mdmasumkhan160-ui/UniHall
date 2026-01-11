import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import * as api from "../../lib/mockApi.js";
import apiClient from "../../lib/apiClient.js";
import { getHallImage } from "../../lib/hallImages.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Applications from "./Applications.jsx";
import Forms from "./Forms.jsx";
import DisciplinaryRecords from "./DisciplinaryRecords.jsx";
import SeatPlan from "./SeatPlan.jsx";
import Waitlist from "./Waitlist.jsx";
import ManageAllocations from "./ManageAllocations.jsx";
import ManageAllocatedSeats from "./ManageAllocatedSeats.jsx";
import Renewals from "./Renewals.jsx";
import ViewResults from "./ViewResults.jsx";
import Notifications from "../shared/Notifications.jsx";
import Complaints from "../shared/Complaints.jsx";
import CreateHallRooms from "./CreateHallRooms.jsx";
import Interviews from "./Interviews.jsx";

export default function AdminDashboard() {
  const { user } = useAuth();
  const hallId = user?.hallId;
  const hall = hallId ? api.getHallById(hallId) : null;
  const hallName = hall?.name || "Your Hall";
  const location = useLocation();

  const [overviewStats, setOverviewStats] = useState({
    totalSeats: 0,
    allocatedSeats: 0,
    availableSeats: 0,
    openComplaints: 0,
    totalComplaints: 0,
    solvedComplaints: 0,
    pendingComplaints: 0,
  });

  const [hallPeopleStats, setHallPeopleStats] = useState({
    registeredStudents: 0,
    allocatedStudents: 0,
    sessionFunnel: [],
  });

  const [menuBadges, setMenuBadges] = useState({
    applications: 0,
    interviews: 0,
    allocations: 0,
    waitlist: 0,
    renewals: 0,
  });

  const [dashboardForms, setDashboardForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [formFunnel, setFormFunnel] = useState({
    applications: 0,
    allocated: 0,
    waiting: 0,
  });
  const [formSessionFunnel, setFormSessionFunnel] = useState([]);
  const HALL_ALLOTTED_ONLY_KEY = "__HALL_ALLOTTED_ONLY__";

  useEffect(() => {
    if (!hallId) return;

    let cancelled = false;
    let intervalId = null;

    const normalizeApplicationStage = (status, interview) => {
      const raw = String(status || "submitted");
      const lowered = raw.toLowerCase();
      const mapped =
        lowered === "interview scheduled"
          ? "scheduled"
          : lowered === "seat allocated" ||
            lowered === "allocated" ||
            lowered === "allotted" ||
            lowered === "alloted"
          ? "alloted"
          : lowered === "selected"
          ? "scheduled"
          : lowered === "under review"
          ? "submitted"
          : lowered;
      return mapped === "submitted" && interview ? "scheduled" : mapped;
    };

    const countNotScheduledApplications = (apps) => {
      const list = Array.isArray(apps) ? apps : [];
      return list.reduce((acc, app) => {
        const interview = app?.interview || null;
        const stage = normalizeApplicationStage(app?.status, interview);
        if (stage === "alloted" || stage === "not-alloted") return acc;
        const notScheduled =
          !interview && stage !== "scheduled" && stage !== "rejected";
        return acc + (notScheduled ? 1 : 0);
      }, 0);
    };

    async function loadMenuBadges() {
      try {
        const [
          formsRes,
          interviewsRes,
          candidatesRes,
          waitlistRes,
          renewalsRes,
        ] = await Promise.all([
          apiClient.get("/forms"),
          apiClient.get("/interviews"),
          apiClient.get("/allocations/candidates"),
          apiClient.get("/waitlist"),
          apiClient.get("/renewals"),
        ]);

        const forms = formsRes?.data?.data || [];
        const activeForm = forms.find((f) => !!f?.isActive) || forms[0] || null;

        let applicationsNotScheduled = 0;
        if (activeForm?.id) {
          try {
            const appsRes = await apiClient.get(
              `/forms/${encodeURIComponent(activeForm.id)}/applications`
            );
            const apps = appsRes?.data?.data || [];
            applicationsNotScheduled = countNotScheduledApplications(apps);
          } catch (_) {
            applicationsNotScheduled = 0;
          }
        }

        const interviews = interviewsRes?.data?.data || [];
        const candidates = candidatesRes?.data?.data || [];
        const waitlist = waitlistRes?.data?.data || [];
        const renewals = renewalsRes?.data?.data || [];
        const pendingRenewals = (
          Array.isArray(renewals) ? renewals : []
        ).filter(
          (r) => String(r?.status || "").toUpperCase() === "PENDING"
        ).length;

        if (!cancelled) {
          setMenuBadges({
            applications: applicationsNotScheduled,
            interviews: Array.isArray(interviews) ? interviews.length : 0,
            allocations: Array.isArray(candidates) ? candidates.length : 0,
            waitlist: Array.isArray(waitlist) ? waitlist.length : 0,
            renewals: pendingRenewals,
          });
        }
      } catch (_) {
        if (!cancelled) {
          setMenuBadges({
            applications: 0,
            interviews: 0,
            allocations: 0,
            waitlist: 0,
            renewals: 0,
          });
        }
      }
    }

    function handleFocus() {
      loadMenuBadges();
    }

    loadMenuBadges();
    intervalId = window.setInterval(loadMenuBadges, 15000);
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [hallId]);

  useEffect(() => {
    if (!hallId) return;

    let cancelled = false;

    async function loadDashboardForms() {
      try {
        const res = await apiClient.get("/forms");
        const formsRaw = res?.data?.data || [];

        const normalized = (Array.isArray(formsRaw) ? formsRaw : [])
          .map((f) => ({
            id: f?.id,
            title: f?.formTitle || f?.title || "Untitled Form",
            isActive: !!f?.isActive,
          }))
          .filter((f) => !!f.id);

        if (cancelled) return;

        setDashboardForms(normalized);
        setSelectedFormId((prev) => {
          if (prev) return prev;
          return HALL_ALLOTTED_ONLY_KEY;
        });
      } catch (_) {
        if (!cancelled) {
          setDashboardForms([]);
          setSelectedFormId(HALL_ALLOTTED_ONLY_KEY);
        }
      }
    }

    loadDashboardForms();
    return () => {
      cancelled = true;
    };
  }, [hallId]);

  useEffect(() => {
    if (!hallId || !selectedFormId) return;

    let cancelled = false;
    let intervalId = null;

    async function loadFormFunnel() {
      try {
        if (selectedFormId === HALL_ALLOTTED_ONLY_KEY) {
          const hallSeries = Array.isArray(hallPeopleStats.sessionFunnel)
            ? hallPeopleStats.sessionFunnel
            : [];
          const totalAllocated = hallSeries.reduce(
            (acc, s) => acc + Math.max(0, Number(s?.allocated || 0)),
            0
          );

          if (!cancelled) {
            setFormFunnel({
              applications: 0,
              allocated: totalAllocated,
              waiting: 0,
            });
            setFormSessionFunnel(
              hallSeries.map((s) => ({
                sessionYear: s?.sessionYear || "Unknown",
                applications: 0,
                allocated: Number(s?.allocated || 0),
                waiting: 0,
              }))
            );
          }
          return;
        }

        const [funnelRes, sessionRes] = await Promise.all([
          apiClient.get(
            `/dashboard/forms/${encodeURIComponent(selectedFormId)}/funnel`
          ),
          apiClient.get(
            `/dashboard/forms/${encodeURIComponent(
              selectedFormId
            )}/session-funnel`
          ),
        ]);

        const data = funnelRes?.data?.data || {};
        const sessionData = sessionRes?.data?.data || {};
        const sessionRaw = Array.isArray(sessionData?.sessionFunnel)
          ? sessionData.sessionFunnel
          : [];
        const normalizedSession = sessionRaw
          .map((x) => ({
            sessionYear: x?.sessionYear || "Unknown",
            applications: Number(x?.applications || 0),
            allocated: Number(x?.allocated || 0),
            waiting: Number(x?.waiting || 0),
          }))
          .filter(
            (x) =>
              Number.isFinite(x.applications) &&
              Number.isFinite(x.allocated) &&
              Number.isFinite(x.waiting) &&
              x.applications >= 0 &&
              x.allocated >= 0 &&
              x.waiting >= 0
          );

        if (!cancelled) {
          setFormFunnel({
            applications: Number(data?.applications || 0),
            allocated: Number(data?.allocated || 0),
            waiting: Number(data?.waiting || 0),
          });
          setFormSessionFunnel(normalizedSession);
        }
      } catch (_) {
        if (!cancelled) {
          setFormFunnel({ applications: 0, allocated: 0, waiting: 0 });
          setFormSessionFunnel([]);
        }
      }
    }

    function handleFocus() {
      loadFormFunnel();
    }

    loadFormFunnel();
    intervalId = window.setInterval(loadFormFunnel, 15000);
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [hallId, selectedFormId, hallPeopleStats.sessionFunnel]);

  // Load profile photo
  const [profilePhoto] = useState(() => {
    return localStorage.getItem(`profile_photo_${user?.id}`) || null;
  });

  useEffect(() => {
    if (!hallId) return;

    let cancelled = false;
    let intervalId = null;

    const BLOCKED_ROOM_STATUSES = new Set([
      "MAINTENANCE",
      "UNDER_REPAIR",
      "RESERVED",
    ]);

    function isOpenComplaintStatus(status) {
      const s = String(status || "").toLowerCase();
      return s === "pending" || s === "working";
    }

    function isResolvedComplaintStatus(status) {
      const s = String(status || "").toLowerCase();
      return s === "resolved";
    }

    async function loadOverview() {
      try {
        const [roomsRes, complaintsRes, hallRes] = await Promise.all([
          apiClient.get("/rooms"),
          apiClient.get("/complaints"),
          apiClient.get("/dashboard/hall-overview"),
        ]);

        const rooms = roomsRes?.data?.data || [];
        const complaints = complaintsRes?.data?.data || [];

        const usableRooms = (Array.isArray(rooms) ? rooms : []).filter((r) => {
          const status = String(r?.status || "").toUpperCase();
          return !BLOCKED_ROOM_STATUSES.has(status);
        });

        const totalSeats = usableRooms.reduce(
          (acc, r) => acc + Math.max(0, Number(r?.capacity || 0)),
          0
        );
        const allocatedSeats = usableRooms.reduce(
          (acc, r) => acc + Math.max(0, Number(r?.currentOccupancy || 0)),
          0
        );
        const availableSeats = usableRooms.reduce((acc, r) => {
          const cap = Math.max(0, Number(r?.capacity || 0));
          const occ = Math.max(0, Number(r?.currentOccupancy || 0));
          return acc + Math.max(0, cap - occ);
        }, 0);

        const openComplaints = (
          Array.isArray(complaints) ? complaints : []
        ).filter((c) => isOpenComplaintStatus(c?.status)).length;

        const totalComplaints = Array.isArray(complaints)
          ? complaints.length
          : 0;
        const solvedComplaints = (
          Array.isArray(complaints) ? complaints : []
        ).filter((c) => isResolvedComplaintStatus(c?.status)).length;
        const pendingComplaints = (
          Array.isArray(complaints) ? complaints : []
        ).filter((c) => isOpenComplaintStatus(c?.status)).length;

        const hallData = hallRes?.data?.data || {};
        const funnelRaw = Array.isArray(hallData?.sessionFunnel)
          ? hallData.sessionFunnel
          : [];
        const sessionFunnel = funnelRaw
          .map((x) => ({
            sessionYear: x?.sessionYear || "Unknown",
            applications: Number(x?.applications || 0),
            allocated: Number(x?.allocated || 0),
            waiting: Number(x?.waiting || 0),
          }))
          .filter(
            (x) =>
              Number.isFinite(x.applications) &&
              Number.isFinite(x.allocated) &&
              Number.isFinite(x.waiting) &&
              x.applications >= 0 &&
              x.allocated >= 0 &&
              x.waiting >= 0
          );

        if (!cancelled) {
          setOverviewStats({
            totalSeats,
            allocatedSeats,
            availableSeats,
            openComplaints,
            totalComplaints,
            solvedComplaints,
            pendingComplaints,
          });

          setHallPeopleStats({
            registeredStudents: Number(hallData?.registeredStudents || 0),
            allocatedStudents: Number(hallData?.allocatedStudents || 0),
            sessionFunnel,
          });
        }
      } catch (_) {
        if (!cancelled) {
          setOverviewStats({
            totalSeats: 0,
            allocatedSeats: 0,
            availableSeats: 0,
            openComplaints: 0,
            totalComplaints: 0,
            solvedComplaints: 0,
            pendingComplaints: 0,
          });

          setHallPeopleStats({
            registeredStudents: 0,
            allocatedStudents: 0,
            sessionFunnel: [],
          });
        }
      }
    }

    function handleFocus() {
      loadOverview();
    }

    loadOverview();
    intervalId = window.setInterval(loadOverview, 15000);
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [hallId]);

  const path = location.pathname || "";
  const isDashboard = path === "/admin";
  let ActiveSection = null;
  if (path.startsWith("/admin/forms")) {
    ActiveSection = <Forms />;
  } else if (path.startsWith("/admin/applications")) {
    ActiveSection = <Applications />;
  } else if (path.startsWith("/admin/allocations")) {
    ActiveSection = <ManageAllocations />;
  } else if (path.startsWith("/admin/manage-allocations")) {
    ActiveSection = <ManageAllocatedSeats />;
  } else if (path.startsWith("/admin/disciplinary")) {
    ActiveSection = <DisciplinaryRecords />;
  } else if (path.startsWith("/admin/seat-plan")) {
    ActiveSection = <SeatPlan />;
  } else if (path.startsWith("/admin/waitlist")) {
    ActiveSection = <Waitlist />;
  } else if (path.startsWith("/admin/renewals")) {
    ActiveSection = <Renewals />;
  } else if (path.startsWith("/admin/results")) {
    ActiveSection = <ViewResults />;
  } else if (path.startsWith("/admin/notifications")) {
    ActiveSection = <Notifications />;
  } else if (path.startsWith("/admin/complaints")) {
    ActiveSection = <Complaints />;
  } else if (path.startsWith("/admin/rooms")) {
    ActiveSection = <CreateHallRooms />;
  } else if (path.startsWith("/admin/interviews")) {
    ActiveSection = <Interviews />;
  }

  return (
    <div
      className="relative w-full flex flex-col lg:flex-row gap-4 h-[calc(100vh-6rem)] overflow-hidden rounded-3xl p-4"
      style={{ backgroundColor: "#123456" }}
    >
      {/* Left sidebar navigation (desktop) */}
      <aside
        className="hidden lg:block w-80 p-4 lg:h-[calc(100vh-6rem)] lg:sticky lg:top-20 flex-shrink-0 overflow-y-auto shadow-lg rounded-2xl border border-white/10"
        style={{ backgroundColor: "#123456" }}
      >
        <h2 className="text-xs font-bold text-white mb-5 uppercase tracking-wider px-1">
          Admin portal
        </h2>
        <nav className="space-y-2 text-sm">
          <SidebarLink
            to="/admin"
            label="Dashboard"
            icon="🏠"
            currentPath={location.pathname}
          />
          <SidebarLink
            to="/admin/forms"
            label="Forms"
            icon="📝"
            currentPath={location.pathname}
          />
          <SidebarLink
            to="/admin/applications"
            label="Applications"
            icon="📄"
            currentPath={location.pathname}
            badge={menuBadges.applications}
          />
          <SidebarLink
            to="/admin/interviews"
            label="Interviews"
            icon="📅"
            currentPath={location.pathname}
            badge={menuBadges.interviews}
          />
          <SidebarLink
            to="/admin/allocations"
            label="Seat Allocation"
            icon="🛏️"
            currentPath={location.pathname}
            badge={menuBadges.allocations}
          />
          <SidebarLink
            to="/admin/manage-allocations"
            label="Manage Allocation"
            icon="⚙️"
            currentPath={location.pathname}
          />
          <SidebarLink
            to="/admin/disciplinary"
            label="Disciplinary Records"
            icon="⚠️"
            currentPath={location.pathname}
          />
          <SidebarLink
            to="/admin/notifications"
            label="Push Notifications"
            icon="📢"
            currentPath={location.pathname}
          />
          <SidebarLink
            to="/admin/complaints"
            label="Complaints"
            icon="🧾"
            currentPath={location.pathname}
          />
          <SidebarLink
            to="/admin/rooms"
            label="Create Hall Rooms"
            icon="🏢"
            currentPath={location.pathname}
          />
          <SidebarLink
            to="/admin/waitlist"
            label="Waiting List"
            icon="📊"
            currentPath={location.pathname}
            badge={menuBadges.waitlist}
          />
          <SidebarLink
            to="/admin/renewals"
            label="Renewals"
            icon="♻️"
            currentPath={location.pathname}
            badge={menuBadges.renewals}
          />
          <SidebarLink
            to="/admin/results"
            label="Results & Exam"
            icon="🎓"
            currentPath={location.pathname}
          />
        </nav>
      </aside>

      {/* Main content: header + summary graph */}
      <div className="flex-1 space-y-6 overflow-y-auto min-h-0 rounded-2xl bg-slate-50 p-6 shadow-sm">
        {isDashboard && (
          <>
            {/* Hall Header */}
            {hall && (
              <div className="relative overflow-hidden rounded-xl shadow-lg min-h-[180px]">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${getHallImage(hall)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20" />
                <div className="relative p-6 text-white flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-gray-200 uppercase tracking-wide">
                      Hall Administration Portal
                    </div>
                    <div className="text-3xl md:text-4xl font-bold mb-1 mt-1">
                      {hall.name}
                    </div>
                    <div className="text-sm md:text-base font-bold text-gray-200 flex flex-wrap gap-3">
                      <span>Est. {hall.established}</span>
                      <span></span>
                      <span>{hall.category}</span>
                      <span></span>
                      <span>Capacity: {hall.capacity} students</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover shadow-lg border border-white/70"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 text-white flex items-center justify-center text-xl font-bold shadow-lg border border-white/70">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-right">
                      <div className="text-base font-bold">
                        {user.name.split(" - ")[0]}
                      </div>
                      <div className="text-sm font-bold text-gray-200">
                        {hallName}  Administrator
                      </div>
                      <Link
                        to="/profile"
                        className="mt-1 inline-flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-sm font-medium rounded-full border border-cyan-500 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary graph */}
            <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Hall Overview
                  </h2>
                  <p className="text-xs text-gray-500">
                    Visual summary of key metrics for this hall.
                  </p>
                </div>

                <div className="w-52 sm:w-72">
                  <select
                    value={selectedFormId}
                    onChange={(e) => setSelectedFormId(e.target.value)}
                    className="w-full text-sm border border-purple-300 rounded-md px-2 py-1 bg-purple-100 hover:bg-purple-200 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer"
                    aria-label="Select application form"
                  >
                    <option value={HALL_ALLOTTED_ONLY_KEY}>
                      All Allotted (Hall)
                    </option>
                    {dashboardForms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <StatsChart
                stats={overviewStats}
                sessionFunnel={
                  formSessionFunnel.length > 0
                    ? formSessionFunnel
                    : hallPeopleStats.sessionFunnel
                }
                funnelTotals={formFunnel}
                dashboardForms={dashboardForms}
                defaultFormId={
                  selectedFormId === HALL_ALLOTTED_ONLY_KEY
                    ? ""
                    : selectedFormId
                }
              />

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        Seat Utilization
                      </div>
                      <div className="text-xs text-gray-500">
                        Allocated vs available seats
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-6">
                    <DonutChart
                      segments={[
                        {
                          label: "Allocated",
                          value: overviewStats.allocatedSeats,
                          className: "stroke-purple-500",
                        },
                        {
                          label: "Available",
                          value: overviewStats.availableSeats,
                          className: "stroke-blue-500",
                        },
                      ]}
                    />
                    <div className="flex-1 space-y-2 text-sm">
                      <LegendRow
                        label="Allocated"
                        value={overviewStats.allocatedSeats}
                        swatchClassName="bg-purple-500"
                      />
                      <LegendRow
                        label="Available"
                        value={overviewStats.availableSeats}
                        swatchClassName="bg-blue-500"
                      />
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total</span>
                        <span className="font-semibold text-gray-900">
                          {overviewStats.totalSeats}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        Complaints Summary
                      </div>
                      <div className="text-xs text-gray-500">
                        Total vs solved vs pending
                      </div>
                    </div>
                    <div className="text-sm text-gray-700">
                      <span className="text-gray-500">Total:</span>{" "}
                      <span className="font-semibold text-gray-900">
                        {overviewStats.totalComplaints}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <HorizontalBar
                      label="Pending"
                      value={overviewStats.pendingComplaints}
                      max={Math.max(1, overviewStats.totalComplaints)}
                      barClassName="bg-orange-500"
                    />
                    <HorizontalBar
                      label="Solved"
                      value={overviewStats.solvedComplaints}
                      max={Math.max(1, overviewStats.totalComplaints)}
                      barClassName="bg-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {ActiveSection && <div className="space-y-4">{ActiveSection}</div>}
      </div>
    </div>
  );
}

function SidebarLink({ to, label, icon, currentPath, badge }) {
  const active = currentPath === to;
  const showBadge = Number.isFinite(Number(badge)) && Number(badge) > 0;
  return (
    <Link
      to={to}
      className={`group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md"
          : "bg-white text-gray-700 hover:bg-brand-50 hover:text-brand-700"
      }`}
    >
      {typeof icon === "string" ? (
        <span
          className={`text-lg ${
            active
              ? "grayscale-0"
              : "grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100"
          }`}
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : (
        <span
          className={
            active ? "text-white" : "text-gray-500 group-hover:text-brand-600"
          }
        >
          {icon}
        </span>
      )}
      <span className="flex-1">{label}</span>
      {showBadge && (
        <span
          className={`inline-flex items-center justify-center min-w-[1.75rem] px-2 py-0.5 text-xs font-bold rounded-full ${
            active
              ? "bg-white/20 text-white border border-white/30"
              : "bg-brand-100 text-brand-700 border border-brand-200"
          }`}
        >
          {Number(badge)}
        </span>
      )}
    </Link>
  );
}

function StatsChart({
  stats,
  sessionFunnel,
  funnelTotals,
  dashboardForms = [],
  defaultFormId = "",
}) {
  const summaryItems = [
    {
      key: "totalSeats",
      label: "Total Seats",
      value: stats.totalSeats,
      color: "bg-emerald-500",
    },
    {
      key: "allocatedSeats",
      label: "Allocated Seats",
      value: stats.allocatedSeats,
      color: "bg-purple-500",
    },
    {
      key: "availableSeats",
      label: "Available Seats",
      value: stats.availableSeats,
      color: "bg-blue-500",
    },
    {
      key: "openComplaints",
      label: "Open Complaints",
      value: stats.openComplaints,
      color: "bg-orange-500",
    },
  ];

  const series = Array.isArray(sessionFunnel) ? sessionFunnel : [];
  const max = Math.max(
    1,
    ...series.flatMap((s) => [
      Number(s?.applications || 0),
      Number(s?.allocated || 0),
      Number(s?.waiting || 0),
    ])
  );

  const bars = [
    { key: "applications", label: "Applications", color: "bg-emerald-500" },
    { key: "allocated", label: "Allocated", color: "bg-indigo-500" },
    { key: "waiting", label: "Waiting", color: "bg-orange-500" },
  ];

  const totals = funnelTotals || { applications: 0, allocated: 0, waiting: 0 };

  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [residentFilters, setResidentFilters] = useState({
    departments: [],
    sessions: [],
  });
  const [downloadDepartment, setDownloadDepartment] = useState("");
  const [downloadSession, setDownloadSession] = useState("");
  const [downloadFormId, setDownloadFormId] = useState(defaultFormId || "");

  useEffect(() => {
    if (!defaultFormId) return;
    setDownloadFormId((prev) => (prev ? prev : defaultFormId));
  }, [defaultFormId]);

  useEffect(() => {
    if (!downloadOpen) return;

    let cancelled = false;
    async function loadFilterOptions() {
      try {
        const res = await apiClient.get("/dashboard/residents/filters");
        const data = res?.data?.data || {};
        const departments = Array.isArray(data?.departments)
          ? data.departments
          : [];
        const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
        if (!cancelled) {
          setResidentFilters({ departments, sessions });
        }
      } catch (_) {
        if (!cancelled) {
          setResidentFilters({ departments: [], sessions: [] });
        }
      }
    }
    loadFilterOptions();
    return () => {
      cancelled = true;
    };
  }, [downloadOpen]);

  async function downloadResidentsPdf() {
    setDownloadError("");
    setDownloadLoading(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const params = {};
      if (downloadDepartment) params.department = downloadDepartment;
      if (downloadSession) params.sessionYear = downloadSession;
      if (downloadFormId) params.formId = downloadFormId;

      const res = await apiClient.get("/dashboard/residents", { params });
      const payload = res?.data?.data || {};
      const residents = Array.isArray(payload?.residents)
        ? payload.residents
        : [];

      const titleParts = ["Hall Residents"];
      if (downloadFormId) {
        const formTitle = dashboardForms.find(
          (f) => f.id === downloadFormId
        )?.title;
        if (formTitle) titleParts.push(`Form: ${formTitle}`);
      }
      if (downloadDepartment) titleParts.push(`Dept: ${downloadDepartment}`);
      if (downloadSession) titleParts.push(`Session: ${downloadSession}`);

      const headerLabels = [
        "Student ID",
        "Name",
        "Department",
        "Session",
        "Total Score",
        "Room (Floor)",
      ];

      const bodyRows = residents.map((r) => {
        const roomNumber = r?.room?.roomNumber || "";
        const floorNumber =
          r?.room?.floorNumber != null ? String(r.room.floorNumber) : "";
        const roomText = roomNumber
          ? `${roomNumber}${floorNumber ? ` (Floor ${floorNumber})` : ""}`
          : "";

        return [
          String(r?.studentId || ""),
          String(r?.name || ""),
          String(r?.department || ""),
          String(r?.session || ""),
          r?.totalScore != null && Number.isFinite(Number(r.totalScore))
            ? String(Number(r.totalScore))
            : "",
          roomText,
        ];
      });

      const date = new Date().toISOString().slice(0, 10);
      const filename = `hall-residents-${date}.pdf`;

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      doc.setFontSize(14);
      doc.text(titleParts.join(" | "), 40, 40);
      doc.setFontSize(10);
      doc.setTextColor(90);
      doc.text(`Generated: ${date}`, 40, 58);
      doc.setTextColor(0);

      autoTable(doc, {
        head: [headerLabels],
        body: bodyRows,
        startY: 75,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [245, 248, 250] },
        margin: { left: 40, right: 40 },
      });

      doc.save(filename);
    } catch (e) {
      setDownloadError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to download residents"
      );
    } finally {
      setDownloadLoading(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 items-stretch">
      <div className="flex-1 md:border-r md:border-gray-100 md:pr-4">
        <div>
          <div className="text-sm font-semibold text-gray-900">
            Applications / Allocated / Waiting (Last 7 Sessions)
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Counts are grouped by student session year
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-600">
          {bars.map((b) => (
            <div key={b.key} className="inline-flex items-center gap-2">
              <span
                className={`inline-block w-3 h-3 rounded-sm ${b.color}`}
                aria-hidden="true"
              />
              <span>{b.label}</span>
              <span className="font-semibold text-gray-900">
                {Number(totals?.[b.key] || 0)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 h-56 overflow-x-auto md:overflow-visible">
          {series.length === 0 ? (
            <div className="text-sm text-gray-500">No data yet.</div>
          ) : (
            <div className="flex items-end justify-start md:justify-between gap-6 min-w-max">
              {series.map((item) => (
                <div
                  key={item.sessionYear}
                  className="w-28 sm:w-32 md:w-auto flex-none md:flex-1 flex flex-col items-center justify-end gap-2"
                >
                  <div className="w-full grid grid-cols-3 gap-2 items-end">
                    {bars.map((b) => {
                      const value = Number(item?.[b.key] || 0);
                      const ratio = value / max;
                      const height =
                        value > 0 ? Math.max(6, Math.round(ratio * 100)) : 0;
                      return (
                        <div
                          key={b.key}
                          className="flex flex-col items-center justify-end gap-1"
                        >
                          <div className="text-[10px] text-gray-500">
                            {value}
                          </div>
                          <div className="w-full h-28 sm:h-32 rounded-t-md bg-gray-100 overflow-hidden flex items-end">
                            <div
                              className={`${b.color} w-full transition-all`}
                              style={{ height: `${height}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div
                    className="text-[11px] text-center font-semibold text-gray-700 leading-tight mt-1"
                    title={item.sessionYear}
                  >
                    {String(item.sessionYear || "Unknown")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full md:w-56 space-y-3 text-sm">
        {summaryItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-3 h-3 rounded-sm ${item.color}`}
                aria-hidden="true"
              />
              <span className="text-gray-700">{item.label}</span>
            </div>
            <span className="font-semibold text-gray-900">{item.value}</span>
          </div>
        ))}

        <div className="pt-3 mt-3 border-t border-gray-100">
          <div className="border border-emerald-200/60 rounded-xl bg-emerald-50/60 p-4 shadow-sm">
            <button
              type="button"
              onClick={() => setDownloadOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-3 text-left"
              aria-expanded={downloadOpen}
            >
              <span className="text-sm font-semibold text-gray-900">
                Download information
              </span>
              <span className="text-xs text-gray-500">
                {downloadOpen ? "Hide" : "Show"}
              </span>
            </button>

            <div className="mt-1 text-xs text-emerald-800/80">
              Export current hall residents as PDF (.pdf)
            </div>

            {downloadOpen && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={downloadDepartment}
                    onChange={(e) => setDownloadDepartment(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-md px-2 py-2 bg-white"
                    aria-label="Filter by department"
                  >
                    <option value="">All departments</option>
                    {residentFilters.departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Session
                  </label>
                  <select
                    value={downloadSession}
                    onChange={(e) => setDownloadSession(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-md px-2 py-2 bg-white"
                    aria-label="Filter by session"
                  >
                    <option value="">All sessions</option>
                    {residentFilters.sessions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Application Form
                  </label>
                  <select
                    value={downloadFormId}
                    onChange={(e) => setDownloadFormId(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-md px-2 py-2 bg-white"
                    aria-label="Filter by application form"
                  >
                    <option value="">All forms</option>
                    {dashboardForms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.title}
                      </option>
                    ))}
                  </select>
                </div>

                {downloadError ? (
                  <div className="rounded border border-red-200 bg-red-50 px-2 py-2 text-xs text-red-700">
                    {downloadError}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={downloadResidentsPdf}
                  disabled={downloadLoading}
                  className="w-full px-3 py-2 text-sm font-semibold rounded-md text-white disabled:opacity-60 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-md hover:shadow-lg transition-all"
                >
                  {downloadLoading ? "Preparing…" : "Download PDF (.pdf)"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendRow({ label, value, swatchClassName }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-3 h-3 rounded-sm ${swatchClassName}`}
          aria-hidden="true"
        />
        <span className="text-gray-700">{label}</span>
      </div>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function HorizontalBar({ label, value, max, barClassName }) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  const safeMax =
    Number.isFinite(Number(max)) && Number(max) > 0 ? Number(max) : 1;
  const ratio = Math.min(1, safeValue / safeMax);
  const pct = Math.max(3, Math.round(ratio * 100));

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">{safeValue}</span>
      </div>
      <div className="mt-2 h-3 rounded bg-gray-100 overflow-hidden">
        <div
          className={`${barClassName} h-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DonutChart({ segments }) {
  const list = Array.isArray(segments) ? segments : [];
  const total = list.reduce(
    (acc, s) => acc + Math.max(0, Number(s?.value || 0)),
    0
  );
  const size = 120;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  let offset = 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        className="stroke-gray-100"
      />

      {total > 0 &&
        list.map((s) => {
          const value = Math.max(0, Number(s?.value || 0));
          const length = (value / total) * c;
          const dash = `${length} ${c - length}`;
          const dashOffset = -offset;
          offset += length;
          return (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="butt"
              className={s.className}
              strokeDasharray={dash}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}

      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-gray-900"
        style={{ fontSize: 14, fontWeight: 700 }}
      >
        {total}
      </text>
      <text
        x="50%"
        y="62%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-gray-500"
        style={{ fontSize: 11 }}
      >
        seats
      </text>
    </svg>
  );
}
