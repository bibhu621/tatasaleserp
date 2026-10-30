"use client";

import React, { useState } from "react";
import { Lock, User, ArrowRight, AlertCircle, Eye, EyeOff, Building2, FileSpreadsheet, Wallet, ShieldCheck } from "lucide-react";

const BRANCH_LIST = [
  { name: "Sasaram", tag: "Headquarters" },
  { name: "Bihiya", tag: "Branch" },
  { name: "Buxas", tag: "Branch" },
  { name: "Mohaniya", tag: "Branch" },
];

const CORE_MODULES = [
  { title: "Commercial Deal Desk", desc: "Vehicle pricing, official term sheets, discount approvals & margin governance.", icon: FileSpreadsheet },
  { title: "Accounts & Audit", desc: "UTR reconciliation, cheque tracking, payment verification & ledger integrity.", icon: Wallet },
  { title: "Statutory & RTO", desc: "Insurance policies, temporary registration, HSRP & compliance tracking.", icon: ShieldCheck },
  { title: "Branch Network", desc: "Synchronized deal workflow across Sasaram, Bihiya, Buxas & Mohaniya.", icon: Building2 },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
.lg{--ink:#191714;--paper:#FAF8F3;--line:#DDD6C8;--mute:#7A7468;--acc:#D2481B;min-height:100vh;display:grid;grid-template-columns:1.15fr 1fr;font:14px/1.5 'Hanken Grotesk',sans-serif;color:var(--ink)}
.lg *{box-sizing:border-box}
.lg .disp{font-family:'Bricolage Grotesque',sans-serif;letter-spacing:-.02em}
.lg .mono{font-family:'JetBrains Mono',monospace}
.lg .flex{display:flex;align-items:center;gap:10px}
.lg .left{background:var(--ink);color:#F3EFE6;padding:36px 48px;display:flex;flex-direction:column;justify-content:space-between;gap:36px;position:relative;overflow:hidden}
.lg .left::after{content:"";position:absolute;right:-120px;bottom:-120px;width:380px;height:380px;border-radius:50%;border:56px solid #24211D;pointer-events:none}
.lg .brand{font-size:20px;font-weight:800;letter-spacing:.02em}
.lg .eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#E8A58A;font-weight:700}
.lg h1{font-size:clamp(32px,4.2vw,50px);line-height:1.05;font-weight:800;margin:10px 0 16px}
.lg h1 em{font-style:normal;color:var(--acc)}
.lg .lead{color:#A9A293;max-width:480px;font-size:14.5px;line-height:1.5}
.lg .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
.lg .chip{border:1px solid #3A362F;border-radius:99px;padding:5px 12px;font-size:12px;display:flex;align-items:center;gap:6px;color:#D9D3C5}
.lg .chip small{color:#7F796C;font-size:10px}
.lg .mods{display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:1px solid #34302A;position:relative;z-index:1}
.lg .mod{padding:16px 16px 4px 0;border-bottom:0}
.lg .mod b{display:flex;align-items:center;gap:8px;font-size:13.5px}
.lg .mod svg{color:var(--acc)}
.lg .mod p{margin:4px 0 12px;color:#8F897B;font-size:12px}
.lg .right{background:#EFEBE3;display:flex;flex-direction:column;justify-content:space-between;padding:28px 40px}
.lg .status{align-self:flex-end;font-size:12px;color:var(--mute);display:flex;align-items:center;gap:7px}
.lg .status i{width:8px;height:8px;border-radius:50%;background:#3E9B63;animation:pl 1.8s infinite}
@keyframes pl{50%{opacity:.35}}
.lg .card{width:100%;max-width:400px;margin:0 auto;background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:30px;box-shadow:0 1px 0 #fff inset,0 18px 40px -24px rgba(25,23,20,.35)}
.lg .card h2{font-size:26px;font-weight:800;margin:0}
.lg .card p{margin:4px 0 20px;color:var(--mute);font-size:13px}
.lg .lbl{display:block;font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--mute);font-weight:700;margin-bottom:5px}
.lg .inp{position:relative;margin-bottom:16px}
.lg .inp>svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--mute);pointer-events:none}
.lg .inp input{width:100%;padding:11px 40px 11px 38px;border:1px solid var(--line);border-radius:10px;background:#fff;font:inherit;color:var(--ink);outline:0;transition:.15s}
.lg .inp input:focus{border-color:var(--ink);box-shadow:0 0 0 3px rgba(25,23,20,.08)}
.lg .eye{position:absolute;right:0;top:0;bottom:0;padding:0 12px;background:none;border:0;color:var(--mute);cursor:pointer}
.lg .eye:hover{color:var(--ink)}
.lg .err{display:flex;gap:8px;align-items:center;background:#FBE5E1;color:#7C1D15;border:1px solid #EBBDB6;border-radius:10px;padding:10px 12px;font-size:12.5px;margin-bottom:16px}
.lg .go{width:100%;display:flex;justify-content:center;align-items:center;gap:8px;padding:12px;border:0;border-radius:10px;background:var(--ink);color:#fff;font:inherit;font-weight:700;cursor:pointer;transition:.15s}
.lg .go:hover{background:var(--acc)}.lg .go:disabled{opacity:.55;cursor:not-allowed;background:var(--ink)}
.lg .spin{width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:sp .7s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
.lg .foot{text-align:center;font-size:11.5px;color:var(--mute)}
@media(max-width:900px){.lg{grid-template-columns:1fr}.lg .left{padding:28px 24px}.lg .mods{display:none}.lg .right{padding:24px 18px}}
`;

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log in.");
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg">
      <style>{CSS}</style>

      <section className="left">
        <div className="flex" style={{ gap: 14 }}>
          <img
            src="/punya-logo.png"
            alt="Punya Autowheels Pvt. Ltd."
            style={{
              height: 48,
              width: "auto",
              objectFit: "contain",
              background: "#fff",
              padding: "4px 8px",
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          />
          <div>
            <div className="brand disp">Punya Autowheels Pvt. Ltd.</div>
            <div style={{ fontSize: 11.5, color: "#8F897B" }}>
              Channel Partner for Commercial Vehicles of Tata Motors
            </div>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="eyebrow">Authorized Tata Motors Dealership Portal</div>
          <h1 className="disp">
            Commercial Vehicle <em>Sales &amp; Operations ERP</em>
          </h1>
          <p className="lead">
            Official sales portal for Punya Autowheels Pvt. Ltd. — pricing quotation, bank audit verification, statutory RTO compliance, and deal management across our dealership network.
          </p>
          <div className="chips">
            {BRANCH_LIST.map((b) => (
              <span key={b.name} className="chip">
                <Building2 size={13} color="#D2481B" />
                {b.name}
                <small className="mono">{b.tag}</small>
              </span>
            ))}
          </div>
        </div>

        <div className="mods">
          {CORE_MODULES.map(({ title, desc, icon: Icon }) => (
            <div key={title} className="mod">
              <b>
                <Icon size={16} />
                {title}
              </b>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="right">
        <div className="status">
          <i />
          System Online
        </div>

        <div className="card">
          <h2 className="disp">Sign in</h2>
          <p>Punya Autowheels Pvt. Ltd. staff dealership portal.</p>

          {error && (
            <div className="err">
              <AlertCircle size={16} style={{ flex: "none" }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            <label className="lbl">Username</label>
            <div className="inp">
              <User size={16} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter staff username"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
              />
            </div>

            <label className="lbl">Password</label>
            <div className="inp">
              <Lock size={16} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="eye"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button type="submit" className="go" disabled={loading}>
              {loading ? (
                <span className="spin" />
              ) : (
                <>
                  <span>Sign In to ERP</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="foot">
          Punya Autowheels Pvt. Ltd. &copy; {new Date().getFullYear()} · All rights reserved.
        </div>
      </section>
    </div>
  );
}
