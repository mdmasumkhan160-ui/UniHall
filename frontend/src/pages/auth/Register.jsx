import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

// Department code (2 digits) -> Department name
// Update this map to match your university's official department codes.
const DEPARTMENT_CODE_TO_NAME = {
  "01": "CSTE",
  "02": "FIMS",
  "03": "Pharmacy",
  "04": "ACCE",
  "05": "MBG",
  "06": "A. Math",
  "07": "ENG",
  "08": "FTNS",
  "09": "ESDM",
  10: "DBA",
  11: "ICE",
  12: "Economics",
  13: "BGE",
  14: "Agri",
  15: "Stat",
  16: "Political Science",
  17: "EEE",
  18: "OCN",
  19: "Education",
  20: "Sociology",
  21: "THM",
  22: "MIS",
  23: "BMB",
  24: "IIS",
  25: "IIT",
  26: "Bangla",
  27: "Law",
  28: "Zoology",
  29: "Educational Administration",
  30: "Social Work",
  31: "Physics",
  32: "Chemistry",
  33: "SWES",
};

// Parse student ID: MUH2225013M -> MUH (hall) + 22 (session) + 25 (dept) + 013 (roll) + M/F (gender)
function parseStudentId(id) {
  if (!id || typeof id !== "string") return null;
  const normalized = id.trim().toUpperCase();
  // Format: HALLSESSIONDEPTROLL (e.g., MUH2225007M = MUH + 22 + 25 + 007 + M)
  const match = normalized.match(/^([A-Z]{3})(\d{2})(\d{2})(\d{3})([A-Z])$/);
  if (!match) return null;

  const sessionCode = match[2];
  const sessionEnd = Number(sessionCode);
  const sessionYear = Number.isFinite(sessionEnd)
    ? `${2000 + sessionEnd - 1}-${2000 + sessionEnd}`
    : null;

  const suffix = match[5];
  const gender = suffix === "M" ? "Male" : suffix === "F" ? "Female" : suffix;

  return {
    hall: match[1], // MUH, ASH, etc.
    session: sessionCode, // 22, 23, etc.
    sessionYear, // 2021-2022 (derived)
    dept: match[3], // 25 (department code)
    deptName: DEPARTMENT_CODE_TO_NAME[match[3]] || null,
    roll: match[4], // 013
    suffix, // M/F
    gender, // Male/Female
  };
}

// Validate student ID format
function validateStudentId(id) {
  const parsed = parseStudentId(id);
  if (!parsed) return "Invalid Student ID.";
  return null;
}

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(1); // 1: Form, 2: OTP
  const [programLevel, setProgramLevel] = useState("undergraduate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [studentId, setStudentId] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [error, setError] = useState("");
  const [idInfo, setIdInfo] = useState(null);

  const isUndergrad =
    String(programLevel || "").toLowerCase() === "undergraduate";

  const handleIdChange = (value) => {
    const normalized = String(value || "").toUpperCase();
    setStudentId(normalized);
    if (String(programLevel || "").toLowerCase() === "undergraduate") {
      setIdInfo(parseStudentId(normalized));
    } else {
      setIdInfo(null);
    }
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (password.length < 6)
        throw new Error("Password must be at least 6 characters");
      if (password !== confirm) throw new Error("Passwords do not match");
      if (!/^[^@]+@student\.nstu\.edu\.bd$/i.test(email))
        throw new Error("Use @student.nstu.edu.bd email");
      const isUndergrad =
        String(programLevel || "").toLowerCase() === "undergraduate";
      if (!studentId) throw new Error("Student ID is required");
      if (isUndergrad) {
        const idError = validateStudentId(studentId);
        if (idError) throw new Error(idError);
      }

      // Generate mock OTP (6 digits)
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(mockOtp);

      alert(
        `Mock OTP sent to ${email}\n\nYour OTP is: ${mockOtp}\n\n(In production, this would be sent via email)`
      );

      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  };

  const verifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (otp !== generatedOtp)
        throw new Error("Invalid OTP. Please try again.");

      const isUndergrad =
        String(programLevel || "").toLowerCase() === "undergraduate";

      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        studentId: studentId.trim().toUpperCase(),
        programLevel,
      });
      nav(isUndergrad ? "/student" : "/profile");
    } catch (err) {
      const message =
        err?.response?.data?.message || err.message || "Registration failed";
      setError(message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="card shadow-soft-lg overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500"></div>

          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center relative">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl flex items-center justify-center shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-gray-600">Join NSTU Hall Management System</p>
          </div>

          {/* Progress Indicator */}
          <div className="px-8 pb-6 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shadow-md transition-all ${
                    step >= 1
                      ? "bg-gradient-to-r from-brand-600 to-brand-700 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  1
                </div>
                <span
                  className={`text-sm font-semibold ${
                    step >= 1 ? "text-brand-700" : "text-gray-400"
                  }`}
                >
                  Information
                </span>
              </div>
              <div className="flex-1 h-2 mx-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r from-brand-600 to-brand-700 rounded-full transition-all duration-500 ${
                    step >= 2 ? "w-full" : "w-0"
                  }`}
                ></div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shadow-md transition-all ${
                    step >= 2
                      ? "bg-gradient-to-r from-brand-600 to-brand-700 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  2
                </div>
                <span
                  className={`text-sm font-semibold ${
                    step >= 2 ? "text-brand-700" : "text-gray-400"
                  }`}
                >
                  Verify
                </span>
              </div>
            </div>
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

            {step === 1 ? (
              <form onSubmit={sendOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Program Level
                  </label>
                  <select
                    value={programLevel}
                    onChange={(e) => {
                      const next = e.target.value;
                      setProgramLevel(next);
                      if (String(next).toLowerCase() !== "undergraduate") {
                        setStudentId("");
                        setIdInfo(null);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  >
                    <option value="undergraduate">Undergraduate</option>
                    <option value="masters">Master's</option>
                    <option value="phd">PhD</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    For Master's/PhD, you can complete student details after
                    registration.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Full Name
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
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {isUndergrad ? "Student ID" : "University ID"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <input
                      className={`w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        isUndergrad ? "font-mono" : ""
                      }`}
                      placeholder={
                        isUndergrad ? "MUH2225013M" : "Enter your university ID"
                      }
                      value={studentId}
                      onChange={(e) => handleIdChange(e.target.value)}
                      required
                    />
                  </div>

                  {isUndergrad && studentId && !idInfo && (
                    <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Invalid Student ID.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <input
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="your_email@student.nstu.edu.bd"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Create a password (min 6 characters)"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <input
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Re-enter your password"
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Send OTP
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={verifyOtpAndRegister} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-blue-600 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">
                        OTP Sent
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        A 6-digit OTP has been sent to <strong>{email}</strong>
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        Check the alert popup for your mock OTP
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                    Enter Verification Code
                  </label>
                  <input
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition text-center text-3xl tracking-[0.5em] font-semibold"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    maxLength={6}
                    autoFocus
                    required
                  />
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp("");
                      setError("");
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors border-2 border-gray-200"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    Verify & Register
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
