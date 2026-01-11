import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/apiClient.js";

const STATIC_BASE_URL = String(
  api?.defaults?.baseURL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

function resolvePublicAssetUrl(value) {
  if (!value) return null;
  const raw = String(value);
  if (raw.startsWith("data:")) return raw;
  if (raw.startsWith("/uploads/")) return `${STATIC_BASE_URL}${raw}`;
  return raw;
}

const ROLE_LABELS = {
  student: "Student",
  admin: "Administrator",
  staff: "Staff",
  examcontroller: "Exam Controller",
};

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
      {label}
    </span>
    <span className="text-sm font-medium text-gray-900 text-right sm:text-left">
      {value ?? "N/A"}
    </span>
  </div>
);

const Section = ({ title, children }) => (
  <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
    <header>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    </header>
    <div className="space-y-4 text-sm text-gray-700">{children}</div>
  </section>
);

function normalizeDepartmentToFullName(value) {
  if (value == null) return value;
  const trimmed = String(value).trim();
  if (!trimmed) return trimmed;

  // Handle legacy values like "CSTE : Computer Science..."
  const colonIndex = trimmed.indexOf(":");
  if (colonIndex !== -1) {
    const after = trimmed.slice(colonIndex + 1).trim();
    return after || trimmed;
  }

  // Handle short-form only values
  const map = {
    CSTE: "Computer Science and Telecommunication Engineering",
    FIMS: "Fisheries and Marine Science",
    ACCE: "Applied Chemistry and Chemical Engineering",
    MBG: "Microbiology",
    "A. MATH": "Applied Mathematics",
    ENG: "English",
    FTNS: "Food Technology and Nutrition Science",
    ESDM: "Environmental Science and Disaster Management",
    DBA: "Business Administration",
    ICE: "Information and Communication Engineering",
    PHARMACY: "Pharmacy",
    ECONOMICS: "Economics",
    "POLITICAL SCIENCE": "Political Science",
    EDUCATION: "Education",
    SOCIOLOGY: "Sociology",
    LAW: "Law",
    ZOOLOGY: "Zoology",
    "EDUCATIONAL ADMINISTRATION": "Educational Administration",
    "SOCIAL WORK": "Social Work",
    PHYSICS: "Physics",
    CHEMISTRY: "Chemistry",
    BGE: "Biotechnology and Genetic Engineering",
    AGRI: "Agriculture",
    STAT: "Statistics",
    EEE: "Electrical and Electronic Engineering",
    OCN: "Oceanography",
    THM: "Tourism and Hospitality Management",
    MIS: "Management Information Systems",
    BMB: "Biochemistry and Molecular Biology",
    IIS: "Institute of Information Sciences",
    IIT: "Institute of Information Technology",
    BANGLA: "Department of Bangla",
    SWES: "Soil, Water and Environment Science",
  };

  const upper = trimmed.toUpperCase();
  return map[upper] || trimmed;
}

export default function Profile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [formState, setFormState] = useState({
    name: "",
    phone: "",
    address: "",
    department: "",
    universityId: "",
    designation: "",
    officeLocation: "",
    photoData: null,
    studentIdCardData: null,
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [studentIdCardPreview, setStudentIdCardPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const roleLabel = useMemo(
    () => ROLE_LABELS[user?.role] ?? user?.role ?? "",
    [user]
  );
  const canEditProfile = useMemo(
    () => (user?.role ?? "") === "student",
    [user]
  );

  useEffect(() => {
    if (!user) return;

    async function fetchProfile() {
      setIsLoading(true);
      setError("");
      try {
        const { data } = await api.get("/profile");
        if (data?.data) {
          setProfileData(data.data);
          hydrateForm(data.data);
        }
      } catch (err) {
        const message =
          err.response?.data?.message || "Failed to load profile information";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  function hydrateForm(payload) {
    const nextForm = {
      name: payload.user?.name || "",
      phone: payload.profile?.phone || "",
      address: payload.profile?.address || "",
      department: payload.profile?.department || "",
      universityId: payload.profile?.universityId || "",
      designation: payload.profile?.designation || "",
      officeLocation: payload.profile?.officeLocation || "",
      photoData: null,
      studentIdCardData: null,
    };
    setFormState(nextForm);
    setPhotoPreview(resolvePublicAssetUrl(payload.profile?.photoUrl) || null);
    setStudentIdCardPreview(null);
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      setPhotoPreview(dataUrl);
      setFormState((current) => ({ ...current, photoData: dataUrl }));
    };
    reader.readAsDataURL(file);
  }

  function handleStudentIdCardChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(
        "Student ID card file is too large. Please upload a file up to 10 MB."
      );
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      setStudentIdCardPreview(dataUrl);
      setFormState((current) => ({ ...current, studentIdCardData: dataUrl }));
    };
    reader.readAsDataURL(file);
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  }

  async function handleSave() {
    if (!profileData) return;

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = {};
      const trimmedName = formState.name.trim();
      if (trimmedName && trimmedName !== profileData.user?.name) {
        payload.name = trimmedName;
      }

      const profilePayload = {};
      if (formState.photoData) {
        profilePayload.photoData = formState.photoData;
      }
      if (formState.studentIdCardData) {
        profilePayload.studentIdCardData = formState.studentIdCardData;
      }

      if (user?.role === "student") {
        // Masters/PhD must fill University ID, but we never auto-extract info from it.
        if (isGraduateStudent) {
          const candidate = formState.universityId.trim().toUpperCase();
          if (!candidate || candidate.startsWith("PENDING")) {
            setError("University ID is required for Master's/PhD students.");
            setIsSaving(false);
            return;
          }
        }

        const phone = formState.phone.trim();
        if (phone) profilePayload.phone = phone;

        const address = formState.address.trim();
        if (address) profilePayload.address = address;

        // Only masters/phd students can manually set these fields.
        if (isGraduateStudent) {
          const department = formState.department.trim();
          if (department) profilePayload.department = department;

          const universityId = formState.universityId.trim();
          if (universityId) profilePayload.universityId = universityId;
        }
      } else if (user?.role === "admin") {
        profilePayload.designation = formState.designation.trim() || null;
        profilePayload.officeLocation = formState.officeLocation.trim() || null;
        profilePayload.phone = formState.phone.trim() || null;
      }

      if (Object.keys(profilePayload).length) {
        payload.profile = profilePayload;
      }

      if (!payload.name && !payload.profile) {
        setSuccessMessage("Nothing to update");
        setIsEditing(false);
        setIsSaving(false);
        return;
      }

      const { data } = await api.put("/profile", payload);
      if (data?.data) {
        setProfileData(data.data);
        hydrateForm(data.data);
        setSuccessMessage("Profile updated successfully");
      } else {
        setSuccessMessage("Profile updated");
      }
      setIsEditing(false);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update profile";
      setError(message);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  }

  function handleCancel() {
    if (profileData) {
      hydrateForm(profileData);
    }
    setIsEditing(false);
    setError("");
  }

  function resetPasswordState(clearSuccess = false) {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordError("");
    if (clearSuccess) {
      setPasswordSuccess("");
    }
  }

  function handlePasswordFieldChange(event) {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    if (isPasswordSaving) return;

    setPasswordError("");
    setPasswordSuccess("");

    const currentPassword = passwordForm.currentPassword.trim();
    const newPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match");
      return;
    }

    try {
      setIsPasswordSaving(true);
      await api.put("/profile/password", {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess("Password updated successfully");
      resetPasswordState(false);
      setIsChangingPassword(false);
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to update password";
      setPasswordError(message);
    } finally {
      setIsPasswordSaving(false);
    }
  }

  function handlePasswordCancel() {
    resetPasswordState(true);
    setIsChangingPassword(false);
  }

  if (!user) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-600">
        Please log in to view your profile.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-600">
        Loading profile...
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
        {error}
      </div>
    );
  }

  const profile = profileData?.profile || {};
  const isStudent = user?.role === "student";
  const isAdmin = user?.role === "admin";
  const isGraduateStudent =
    isStudent &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      String(user?.userId || user?.id || "")
    );
  const isUndergradStudent = isStudent && !isGraduateStudent;
  const departmentFullName = normalizeDepartmentToFullName(profile?.department);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="relative group">
              {photoPreview ? (
                <img
                  src={resolvePublicAssetUrl(photoPreview)}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-brand-600 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                  {profileData?.user?.name?.charAt(0)?.toUpperCase() ||
                    user.name?.charAt(0)?.toUpperCase() ||
                    "?"}
                </div>
              )}
              {canEditProfile && (
                <>
                  <label
                    htmlFor="photo-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  >
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </label>
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Account
              </p>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">
                {profileData?.user?.name || user.name}
              </h1>
              <p className="text-sm text-gray-600 mt-1">{roleLabel}</p>
              <p className="text-sm text-gray-600">
                {profileData?.user?.email || user.email}
              </p>
            </div>
          </div>
          {canEditProfile && (
            <div className="flex gap-2">
              {!isEditing ? (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setSuccessMessage("");
                  }}
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition disabled:opacity-70"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancel}
                    type="button"
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm">
          {successMessage}
        </div>
      )}

      {profileData ? (
        <Section title="Profile Details">
          {canEditProfile && isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  name="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              {isStudent && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      University ID
                    </label>
                    <input
                      name="universityId"
                      value={formState.universityId}
                      onChange={handleInputChange}
                      disabled={isUndergradStudent}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      placeholder="e.g., MUH2225007M"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {isUndergradStudent
                        ? "Undergraduate University ID is derived from your roll."
                        : "Master's/PhD can set this later."}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      name="phone"
                      value={formState.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      name="address"
                      value={formState.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    {isUndergradStudent ? (
                      <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                        {departmentFullName || "N/A"}
                      </div>
                    ) : (
                      <input
                        name="department"
                        value={formState.department}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        placeholder="Department"
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {isUndergradStudent
                        ? "Derived automatically from your roll."
                        : "You can update this manually."}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student ID Card (upload)
                    </label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleStudentIdCardChange}
                      className="w-full"
                    />
                    {studentIdCardPreview && (
                      <p className="text-xs text-gray-500 mt-1">
                        Selected file ready to upload.
                      </p>
                    )}

                    {!studentIdCardPreview && profile?.studentIdCardUrl && (
                      <a
                        className="text-xs text-brand-700 underline mt-2 inline-block"
                        href={`${STATIC_BASE_URL}${profile.studentIdCardUrl}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View currently uploaded ID
                      </a>
                    )}
                  </div>
                </>
              )}

              {isAdmin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Designation
                    </label>
                    <input
                      name="designation"
                      value={formState.designation}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                      {departmentFullName || "N/A"}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Managed centrally by administration.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Office Location
                    </label>
                    <input
                      name="officeLocation"
                      value={formState.officeLocation}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      name="phone"
                      value={formState.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <InfoRow
                label="Full Name"
                value={profileData?.user?.name || user.name}
              />
              <InfoRow
                label="Email"
                value={profileData?.user?.email || user.email}
              />
              {isStudent && (
                <>
                  <InfoRow
                    label="University ID"
                    value={profile?.universityId}
                  />
                  <InfoRow
                    label="Student ID Card"
                    value={
                      profile?.studentIdCardUrl ? (
                        <a
                          className="text-brand-700 underline"
                          href={`${STATIC_BASE_URL}${profile.studentIdCardUrl}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View uploaded ID
                        </a>
                      ) : (
                        "Not uploaded"
                      )
                    }
                  />
                  <InfoRow
                    label="Session"
                    value={
                      profile?.session ||
                      profile?.sessionYear ||
                      profileData?.user?.session ||
                      "N/A"
                    }
                  />
                  <InfoRow label="Department" value={departmentFullName} />
                  <InfoRow label="Phone" value={profile?.phone} />
                  <InfoRow label="Address" value={profile?.address} />
                </>
              )}
              {isAdmin && (
                <>
                  <InfoRow label="Designation" value={profile?.designation} />
                  <InfoRow label="Department" value={departmentFullName} />
                  <InfoRow
                    label="Office Location"
                    value={profile?.officeLocation}
                  />
                  <InfoRow label="Phone" value={profile?.phone} />
                </>
              )}
              <InfoRow
                label="Hall"
                value={
                  profile?.hallName ||
                  profile?.hallId ||
                  profileData?.user?.hallId ||
                  "N/A"
                }
              />
              <InfoRow
                label="Last Login"
                value={
                  profileData?.user?.lastLogin
                    ? new Date(profileData.user.lastLogin).toLocaleString()
                    : "N/A"
                }
              />
            </div>
          )}
        </Section>
      ) : (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-6">
          Profile details are not available for this role yet.
        </div>
      )}

      {user && (
        <Section title="Security">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Update your password to keep your account secure.
            </p>
            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm">
                {passwordSuccess}
              </div>
            )}
            {isChangingPassword ? (
              <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordFieldChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordFieldChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordFieldChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                {passwordError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
                    {passwordError}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isPasswordSaving}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition disabled:opacity-70"
                  >
                    {isPasswordSaving ? "Updating..." : "Update Password"}
                  </button>
                  <button
                    type="button"
                    onClick={handlePasswordCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  resetPasswordState(true);
                  setIsChangingPassword(true);
                }}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Change Password
              </button>
            )}
          </div>
        </Section>
      )}

      {!canEditProfile && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-6 text-sm">
          Editing is currently available for student accounts only.
        </div>
      )}
    </div>
  );
}
