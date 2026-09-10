"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, Shield, UserCheck, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";

const ROLE_OPTIONS = [
  { id: "sales", label: "Sales", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "admin", label: "Admin", color: "bg-red-50 text-red-700 border-red-200" },
  { id: "accounts", label: "Accounts", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "rto", label: "RTO / Registration", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "claims", label: "Claims", color: "bg-amber-50 text-amber-700 border-amber-200" },
];

const BRANCH_OPTIONS = ["Sasaram (Rohtas)", "Bihiya (Bhojpur)", "Other"];

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

  const handleDeleteUser = async (userId, username) => {
    if (username === "admin") {
      alert("The master default admin account cannot be deleted.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      setSuccess(`User "${username}" deleted.`);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            User Access & Profile Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin console to create users, assign specific roles, set passwords, and manage dealership credentials.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
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

          <form onSubmit={handleCreateUser} className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-600 block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
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
                placeholder="e.g. ramesh_sales"
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
                placeholder="Minimum 5 characters"
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
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-600"
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
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {BRANCH_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating User..." : "Register User"}
            </button>
          </form>
        </div>

        {/* Existing Users Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-sm text-slate-800 uppercase tracking-wide">
                Configured Users ({users.length})
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
                    const isSuperAdmin = u.username === "admin";

                    return (
                      <tr key={uid} className="hover:bg-slate-50/80 transition-colors">
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
                          {u.branch || "All Branches"}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          {isSuperAdmin ? (
                            <span className="text-[10px] uppercase font-mono text-slate-400 px-2 py-1 bg-slate-100 rounded">
                              Master Admin
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDeleteUser(uid, u.username)}
                              title="Delete User"
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
    </div>
  );
}
