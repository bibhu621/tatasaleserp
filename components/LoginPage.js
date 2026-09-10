"use client";

import React, { useState } from "react";
import { Truck, ShieldCheck, Lock, User, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fillDemoAdmin = () => {
    setUsername("admin");
    setPassword("Admin@123");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log in.");
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ROLES_INFO = [
    { title: "Sales", badge: "Sales Portal", desc: "Create deals, quote pricing, log payments, request amendments.", color: "border-blue-500/30 text-blue-400 bg-blue-500/10" },
    { title: "Admin", badge: "Admin Control", desc: "Full dealership authority, pricing & expense approvals, user creation.", color: "border-amber-500/30 text-amber-400 bg-amber-500/10" },
    { title: "Accounts", badge: "Audit & Verify", desc: "Verify bank receipts, audit UTR/cheques, manage interest & retention.", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" },
    { title: "RTO / Reg.", badge: "Compliance", desc: "Manage Insurance, TR, HSRP & Registration spend against caps.", color: "border-purple-500/30 text-purple-400 bg-purple-500/10" },
    { title: "Claims", badge: "TML Settlement", desc: "Track OEM cash discount claims, upfront netting & claim receipts.", color: "border-orange-500/30 text-orange-400 bg-orange-500/10" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              DEALERSHIP ERP
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/20">
                Enterprise v2.0
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Commercial Vehicle Sales & Operations Platform
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>MongoDB Atlas Secured · RBAC Protected</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero / Overview Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-blue-400">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Multi-Role Operational Authority</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              One Unified Portal for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300">
                Sales, Accounts & Compliance
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
              Strict role-based segregation of responsibilities. Log in with your dedicated credentials to access your profile-specific dashboard with automated checks and balances.
            </p>

            {/* Profile Matrix Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {ROLES_INFO.map((r, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border bg-slate-900/50 backdrop-blur-sm ${r.color} transition-all hover:bg-slate-800/40`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-white">{r.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-current">
                      {r.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Login Card Column */}
          <div className="lg:col-span-5">
            <div className="relative">
              {/* Glow Accent */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur-xl"></div>

              <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl p-6 sm:p-8 space-y-6 backdrop-blur-xl">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Authorized Sign In
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter your username and password to access your role workspace.
                  </p>
                </div>

                {/* Default Admin Quick-Fill Banner */}
                <div className="bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 rounded-xl p-3.5 text-xs text-blue-200 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      Default Admin Ready
                    </div>
                    <div className="text-slate-300 font-mono text-[11px]">
                      Username: <b className="text-white">admin</b> · Pass: <b className="text-white">Admin@123</b>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fillDemoAdmin}
                    className="shrink-0 text-xs font-semibold px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow"
                  >
                    Use Admin
                  </button>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. admin or your username"
                        autoComplete="username"
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder-slate-500 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder-slate-500 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 px-4 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? (
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <span>Sign In to Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center pt-1">
                  <p className="text-[11px] text-slate-500">
                    Need new staff accounts? Log in as Admin to create and manage user credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500">
        Dealership Commercial Vehicles ERP &copy; {new Date().getFullYear()} · Multi-Profile Access Control
      </footer>
    </div>
  );
}
