"use client";

import React, { useState, useEffect } from "react";
import {
  UserPlus,
  Trash2,
  Shield,
  UserCheck,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  X,
} from "lucide-react";

const ROLE_OPTIONS = [
  { id: "superadmin", label: "Super Admin", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { id: "admin", label: "Admin", color: "bg-red-50 text-red-700 border-red-200" },
  { id: "sales", label: "Sales", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "accounts", label: "Accounts", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "rto", label: "RTO / Registration", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
];

const BRANCH_OPTIONS = ["Sasaram", "Bihiya", "Buxas", "Mohaniya"];

export default function UserManagement({ currentAdmin }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // New user form state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: "sales",
    branch: BRANCH_OPTIONS[0],
  });
  const [submitting, setSubmitting] = useState(false);

  // Password reset modal state
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.username.trim() || !formData.password.trim() || !formData.name.trim()) {
      setError("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");

      setSuccess(`User "${formData.username}" created successfully with role "${formData.role}"!`);
      setFormData({
        username: "",
        password: "",
        name: "",
        role: "sales",
        branch: BRANCH_OPTIONS[0],
      });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Requirement 2: Delete login credentials while preserving profile and historical deal records
  const handleDeleteCredentials = async (userId, username) => {
    if (username === "admin" && currentAdmin?.username === "admin") {
      alert("You cannot remove credentials for the default admin account currently in use.");
      return;
    }

    const confirmMsg =
      `Are you sure you want to remove login credentials for "${username}"?\n\n` +
      `• The user account credentials will be deleted so they can no longer log in.\n` +
      `• Their staff profile, deal history, audit trail, and reports will REMAIN 100% INTACT.\n` +
      `• You can restore access anytime by resetting their password.`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user credentials");
      setSuccess(`Login credentials for "${username}" deleted. Profile data and deals remain preserved.`);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  // Requirement 2: Admin can reset anyone's password from console
  const openResetModal = (u) => {
    setResetModalUser(u);
    setNewPassword("");
    setResetError("");
    setShowNewPassword(false);
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$";
    let pwd = "";
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setShowNewPassword(true);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.trim().length < 5) {
      setResetError("Password must be at least 5 characters long.");
      return;
    }

    setResetting(true);
    setResetError("");
    const uid = resetModalUser._id || resetModalUser.id;

    try {
      const res = await fetch(`/api/users/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password", password: newPassword.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      setSuccess(`Password for user "${resetModalUser.username}" was reset successfully.`);
      setResetModalUser(null);
      fetchUsers();
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <img
            src="/punya-logo.png"
            alt="Punya Autowheels Pvt. Ltd."
            className="h-10 w-auto object-contain bg-white p-1 rounded-md border border-slate-200 shadow-sm"
          />
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Punya Autowheels Pvt. Ltd. · User Management
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Admin &amp; Super Admin console to configure users, assign roles (Super Admin, Admin, Sales, Accounts, RTO), reset passwords, and manage credentials.
            </p>
          </div>
        </div>

        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Users
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Create User Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-sm text-slate-800 uppercase tracking-wide">
              Create New Staff User
            </span>
          </div>

          <form onSubmit={handleCreateUser} autoComplete="off" className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-600 block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="Full employee name"
                autoComplete="off"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-600 block mb-1">
                Username *
              </label>
              <input
                type="text"
                required
                placeholder="Staff username"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-600 block mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                placeholder="Set password (min 5 characters)"
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-600 block mb-1">
                  Assigned Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-600 block mb-1">
                  Assigned Branch
                </label>
                <select
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  {BRANCH_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? "Registering User..." : "Register User Profile"}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Users Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-sm text-slate-800 uppercase tracking-wide">
                Configured Staff Users ({users.length})
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Loading users list...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No staff users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase">
                    <th className="py-2 px-3 font-semibold">User Details</th>
                    <th className="py-2 px-3 font-semibold">Role Profile</th>
                    <th className="py-2 px-3 font-semibold">Branch</th>
                    <th className="py-2 px-3 font-semibold">Status</th>
                    <th className="py-2 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const roleMeta = ROLE_OPTIONS.find((r) => r.id === u.role) || {
                      label: u.role,
                      color: "bg-slate-100 text-slate-700",
                    };
                    const uid = u._id || u.id;
                    const isDeactivated = u.credentialsDeleted || u.isActive === false;

                    return (
                      <tr key={uid} className={`hover:bg-slate-50/80 transition-colors ${isDeactivated ? "opacity-75 bg-slate-50/50" : ""}`}>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800">{u.name}</div>
                          <div className="font-mono text-[11px] text-slate-500">@{u.username}</div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${roleMeta.color}`}
                          >
                            {roleMeta.label}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-slate-600 font-medium">
                          {u.branch || "Sasaram"}
                        </td>

                        <td className="py-2.5 px-3">
                          {isDeactivated ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Login Disabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Reset Password Button */}
                            <button
                              onClick={() => openResetModal(u)}
                              title="Reset Password from Console"
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition-colors"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                              <span>Reset Password</span>
                            </button>

                            {/* Delete Login Credentials Button */}
                            {!isDeactivated && (
                              <button
                                onClick={() => handleDeleteCredentials(uid, u.username)}
                                title="Delete Login Credentials (Keep Data)"
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setResetModalUser(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  Reset Password from Console
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
              <div>
                Staff Member: <b className="text-slate-900">{resetModalUser.name}</b>
              </div>
              <div className="font-mono text-slate-500">
                Username: @{resetModalUser.username} · Role: {resetModalUser.role}
              </div>
              {resetModalUser.credentialsDeleted && (
                <div className="text-amber-600 font-semibold pt-1">
                  ⚠️ This account&apos;s login credentials were deleted. Setting a new password will re-enable login access.
                </div>
              )}
            </div>

            {resetError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase">
                    New Password *
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Auto Generate
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="Enter new password (min 5 chars)"
                    autoComplete="new-password"
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs transition-colors disabled:opacity-50"
                >
                  {resetting ? "Resetting..." : "Confirm & Save New Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
