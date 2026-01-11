import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getSeatPlans,
  getExamResults,
  getFilterOptions,
} from "../../lib/examApi.js";

export default function ViewResults() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("results");
  const [results, setResults] = useState([]);
  const [seatPlans, setSeatPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    semester: "",
    academicYear: "",
    department: "",
  });
  const [filterOptions, setFilterOptions] = useState({
    departments: [],
    academicYears: [],
    semesters: [],
  });

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab, filters]);

  const loadFilterOptions = async () => {
    try {
      const res = await getFilterOptions();
      setFilterOptions(
        res.data || { departments: [], academicYears: [], semesters: [] }
      );
    } catch (error) {
      console.error("Failed to load filter options:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "results") {
        const res = await getExamResults(filters);
        setResults(res.data || []);
      } else {
        const res = await getSeatPlans(filters);
        setSeatPlans(res.data || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      alert(
        "Failed to load data: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({ semester: "", academicYear: "", department: "" });
  };

  return (
    <div
      className="rounded-lg shadow p-6"
      style={{ backgroundColor: "#013A63" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Exam Documents</h1>
          <p className="text-white mt-2">
            View uploaded results and seat plans
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadData}
            className="px-4 py-2 bg-[#2C7DA0]/40 backdrop-blur-md border border-[#2C7DA0]/50 rounded-full text-sm text-white font-medium hover:bg-[#123C69]/60 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold mb-3 text-gray-900">Filter Options</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Year
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm bg-[#2C7DA0] text-white font-medium shadow-md hover:bg-[#123C69] focus:outline-none cursor-pointer"
              value={filters.academicYear}
              onChange={(e) =>
                handleFilterChange("academicYear", e.target.value)
              }
            >
              <option value="">All Years</option>
              {filterOptions.academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm bg-[#123C69] text-white font-medium shadow-md hover:bg-[#0b3350] focus:outline-none cursor-pointer"
              value={filters.department}
              onChange={(e) => handleFilterChange("department", e.target.value)}
            >
              <option value="">All Departments</option>
              {filterOptions.departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semester
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm bg-[#2C7DA0] text-white font-medium shadow-md hover:bg-[#123C69] focus:outline-none cursor-pointer"
              value={filters.semester}
              onChange={(e) => handleFilterChange("semester", e.target.value)}
            >
              <option value="">All Semesters</option>
              {filterOptions.semesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(filters.semester || filters.academicYear || filters.department) && (
          <button
            onClick={clearFilters}
            className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-white rounded-t-lg">
        <nav className="flex gap-6 px-4">
          <button
            onClick={() => setActiveTab("results")}
            className={`pb-3 pt-4 px-4 border-b-2 font-semibold transition-colors ${
              activeTab === "results"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            Results ({results.length})
          </button>
          <button
            onClick={() => setActiveTab("seatPlans")}
            className={`pb-3 pt-4 px-4 border-b-2 font-semibold transition-colors ${
              activeTab === "seatPlans"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            Seat Plans ({seatPlans.length})
          </button>
        </nav>
      </div>

      {/* Results Tab */}
      {activeTab === "results" && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Exam Results</h2>
            <span className="text-sm text-gray-500">
              {results.length} documents
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-gray-300 mb-4"
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
              <p className="text-gray-500">No results available</p>
              <p className="text-sm text-gray-400 mt-2">
                {filters.semester || filters.academicYear || filters.department
                  ? "Try adjusting your filters"
                  : "Results will appear here once uploaded"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-blue-800 text-white">
                    <th className="text-left p-3 text-sm font-semibold">
                      Title
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      Department
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      Semester
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      Year
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      Published
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr
                      key={r.resultId}
                      className="border-b hover:bg-[#E6F2FA]"
                    >
                      <td className="p-3">
                        <p className="font-medium text-gray-900">{r.title}</p>
                        {r.description && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {r.description}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {r.department}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {r.semester}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {r.academicYear}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(r.publishedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <a
                          href={`${
                            import.meta.env.VITE_API_BASE_URL?.replace(
                              "/api",
                              ""
                            ) || "http://localhost:5000"
                          }${r.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-3 py-1.5 text-sm bg-brand-600 text-white hover:bg-brand-700 rounded transition-colors font-medium"
                        >
                          View PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Seat Plans Tab */}
      {activeTab === "seatPlans" && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Seat Plans</h2>
            <span className="text-sm text-gray-500">
              {seatPlans.length} documents
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : seatPlans.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-gray-300 mb-4"
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
              <p className="text-gray-500">No seat plans available</p>
              <p className="text-sm text-gray-400 mt-2">
                {filters.semester || filters.academicYear || filters.department
                  ? "Try adjusting your filters"
                  : "Seat plans will appear here once uploaded"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">
                      Exam Name
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">
                      Department
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">
                      Semester
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">
                      Year
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">
                      Exam Date
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {seatPlans.map((plan) => (
                    <tr key={plan.planId} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <p className="font-medium text-gray-900">
                          {plan.examName}
                        </p>
                        {plan.description && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {plan.description}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {plan.department}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {plan.semester}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {plan.academicYear}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(plan.examDate).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            plan.isVisible
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {plan.isVisible ? "Visible" : "Hidden"}
                        </span>
                      </td>
                      <td className="p-3">
                        <a
                          href={`${
                            import.meta.env.VITE_API_BASE_URL?.replace(
                              "/api",
                              ""
                            ) || "http://localhost:5000"
                          }${plan.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-3 py-1.5 text-sm bg-brand-600 text-white hover:bg-brand-700 rounded transition-colors font-medium"
                        >
                          View PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
