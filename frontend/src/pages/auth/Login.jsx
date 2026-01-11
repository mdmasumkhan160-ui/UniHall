import React, { useMemo, useState } from "react";
import { useNavigate, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Login() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const roleDest = useMemo(() => {
    const r = String(user?.role || "").toLowerCase();
    if (r === "admin") return "/admin";
    if (r === "examcontroller") return "/exam";
    if (r === "staff") return "/staff";
    if (r === "student") return "/student";
    return "/";
  }, [user?.role]);

  if (user) {
    return <Navigate to={roleDest} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const u = await login(identifier.trim(), password);
      const role = String(u?.role || "").toLowerCase();
      const dest =
        role === "admin"
          ? "/admin"
          : role === "examcontroller"
          ? "/exam"
          : role === "staff"
          ? "/staff"
          : "/student";

      const from = location?.state?.from;
      const fromStr = typeof from === "string" ? from : "";

      const allowFrom =
        (role === "admin" && fromStr.startsWith("/admin")) ||
        (role === "student" && fromStr.startsWith("/student")) ||
        (role === "examcontroller" && fromStr.startsWith("/exam")) ||
        (role === "staff" && fromStr.startsWith("/staff"));

      nav(allowFrom && fromStr ? fromStr : dest, { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message || err.message || "Unable to login";
      setError(message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Card with modern styling */}
        <div className="card shadow-soft-lg overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500"></div>
          
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center relative">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to access your hall dashboard</p>
          </div>

          {/* Form */}
          <div className="px-8 pb-8 relative">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Email or Student ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
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
                  </div>
                  <input
                    className="input-field pl-11"
                    placeholder="your_email@student.nstu.edu.bd or MUH2225013M"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    className="input-field pl-11"
                    placeholder="Enter your password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3.5 text-base font-bold shadow-lg hover:shadow-xl"
              >
                Sign In
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
