"use client";
import React, { useState, useEffect, useRef } from "react";
import { Truck, ClipboardCheck, Wallet, BarChart3, Plus, ChevronRight, ChevronDown, CheckCircle2, XCircle, Clock, PackageCheck, ArrowLeft, LogOut, AlertTriangle, FileText, Filter, RefreshCw, Search, ShieldCheck, Lock, Users, Printer, RotateCcw } from "lucide-react";
import LoginPage from "@/components/LoginPage";
import UserManagement from "@/components/UserManagement";
import ReportsDashboard from "@/components/ReportsDashboard";
import DealPrintSheet from "@/components/DealPrintSheet";
import { isDealForUser, filterDealsForUser } from "@/lib/dealUtils";

/* ====================================================================== */
/*  Theme — warm paper + ink, one vermilion accent                         */
/* ====================================================================== */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
.erp{--bg:#EFEBE3;--paper:#FAF8F3;--ink:#191714;--mute:#7A7468;--line:#DDD6C8;--acc:#D2481B;--ok:#25683A;--bad:#A8281F;--warn:#9A5B00;min-height:100vh;background:var(--bg);color:var(--ink);font:14px/1.45 'Hanken Grotesk',sans-serif}
.erp *{box-sizing:border-box}
.erp button{font:inherit;cursor:pointer}
.erp .disp{font-family:'Bricolage Grotesque',sans-serif;letter-spacing:-.01em}
.erp .mono{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums}
.erp .mute{color:var(--mute)}.erp .sm{font-size:12px}.erp .ok{color:var(--ok)}.erp .bad{color:var(--bad)}.erp .warn{color:var(--warn)}
.erp .flex{display:flex;align-items:center;gap:8px}.erp .wrapf{flex-wrap:wrap}.erp .between{justify-content:space-between}.erp .grow{flex:1}.erp .min{min-width:0}
.erp .stack>*+*{margin-top:12px}.erp .stack-s>*+*{margin-top:6px}
.erp .center{text-align:center;padding:56px 0;color:var(--mute)}
.erp .spin{width:26px;height:26px;border:2px solid var(--acc);border-top-color:transparent;border-radius:50%;animation:sp .8s linear infinite;margin:0 auto 10px}
@keyframes sp{to{transform:rotate(360deg)}}

.erp .top{background:var(--ink);color:#F3EFE6;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:20}
.erp .mark{width:34px;height:34px;border-radius:8px;background:var(--acc);display:grid;place-items:center;color:#fff}
.erp .brand{font-size:18px;font-weight:800;letter-spacing:.02em}
.erp .env{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#A9A293;border:1px solid #3A362F;padding:2px 8px;border-radius:99px}
.erp .who{text-align:right;line-height:1.25}.erp .who small{color:#A9A293;font-size:11px;letter-spacing:.08em;text-transform:uppercase}
.erp .dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:6px}
.erp .out{background:transparent;color:#F3EFE6;border:1px solid #4A453C;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:600;display:inline-flex;gap:6px;align-items:center}
.erp .out:hover{background:#2A2722}
.erp .tabs{display:flex;background:var(--paper);border-bottom:1px solid var(--line);overflow-x:auto;position:sticky;top:58px;z-index:10;padding:0 12px}
.erp .tab{background:none;border:0;border-bottom:3px solid transparent;padding:13px 14px;font-weight:600;color:var(--mute);display:flex;gap:7px;align-items:center;white-space:nowrap}
.erp .tab:hover{color:var(--ink)}.erp .tab.on{color:var(--ink);border-color:var(--acc)}
.erp .wrap{max-width:1040px;margin:0 auto;padding:22px 18px}

.erp .card{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:16px}
.erp .h{font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:17px;letter-spacing:-.01em}
.erp .lbl{font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--mute);font-weight:700}

.erp .btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;border:1px solid var(--line);background:#fff;color:var(--ink);font-weight:600;font-size:13px;transition:.15s}
.erp .btn:hover{border-color:var(--ink)}
.erp .btn.pri{background:var(--ink);border-color:var(--ink);color:#fff}.erp .btn.pri:hover{background:#34302A}
.erp .btn.acc{background:var(--acc);border-color:var(--acc);color:#fff}.erp .btn.acc:hover{background:#B33B14}
.erp .btn.go{background:var(--ok);border-color:var(--ok);color:#fff}.erp .btn.go:hover{filter:brightness(.9)}
.erp .btn.no{color:var(--bad);border-color:#E7BDB7;background:#fff}.erp .btn.no:hover{background:#FBEDEA;border-color:var(--bad)}
.erp .btn.xs{padding:4px 9px;font-size:12px;border-radius:6px}
.erp .btn:disabled{opacity:.4;cursor:not-allowed}
.erp .lnk{background:none;border:0;padding:0;font-size:12px;font-weight:700;color:var(--ink);text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--line)}
.erp .lnk:hover{text-decoration-color:currentColor}.erp .lnk.ok{color:var(--ok)}.erp .lnk.bad{color:var(--bad)}.erp .lnk.mu{color:var(--mute)}

.erp .fld{display:flex;flex-direction:column;gap:4px}
.erp .inp{display:flex;align-items:center;border:1px solid var(--line);border-radius:8px;background:#fff;transition:.15s}
.erp .inp:focus-within{border-color:var(--ink);box-shadow:0 0 0 3px rgba(25,23,20,.08)}
.erp .inp i{font-style:normal;color:var(--mute);padding-left:10px}
.erp .inp input,.erp .inp select{width:100%;border:0;outline:0;background:transparent;padding:8px 10px;color:var(--ink);font:inherit;border-radius:8px}
.erp .inp.ro{background:#F1EDE4;border-style:dashed}.erp .inp.ro input{color:#5E594E}
.erp .sel{border:1px solid var(--line);border-radius:8px;background:#fff;padding:7px 10px;font:inherit;color:var(--ink);outline:0}
.erp .sel:focus{border-color:var(--ink)}

.erp .chip{display:inline-flex;align-items:center;gap:6px;padding:3px 10px 3px 8px;border-radius:99px;font-size:12px;font-weight:700;background:var(--b);color:var(--c)}
.erp .tag{font-size:10.5px;font-weight:600;padding:1px 7px;border-radius:4px;background:#EAE5D8;color:#4A453C}
.erp .tag.br{background:#F6DDD1;color:#8C2F0E}

.erp .sec{background:var(--paper);border:1px solid var(--line);border-radius:12px;overflow:hidden}
.erp .sec-h{width:100%;display:flex;justify-content:space-between;align-items:center;padding:13px 16px;background:none;border:0;text-align:left}
.erp .sec-h:hover{background:#F3EFE5}
.erp .sec-h .bar{width:4px;height:26px;border-radius:2px;margin-right:12px}
.erp .sec-b{padding:4px 16px 18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}
.erp .span{grid-column:1/-1}

.erp .row{width:100%;text-align:left;background:var(--paper);border:1px solid var(--line);border-left:4px solid var(--c,var(--line));border-radius:10px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;transition:.15s}
.erp .row:hover{border-color:var(--ink);border-left-color:var(--c);transform:translateX(2px)}
.erp .row .rt{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.erp .row .rt b{font-size:15px}
.erp .row .rs{margin-top:3px;font-size:12px;color:var(--mute);display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.erp .qrow{width:100%;text-align:left;background:#fff;border:1px solid var(--line);border-radius:8px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;gap:10px}
.erp .qrow:hover{border-color:var(--ink)}
.erp .search{position:relative}.erp .search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--mute)}
.erp .search input{width:100%;padding:10px 12px 10px 36px;border:1px solid var(--line);border-radius:10px;background:#fff;font:inherit;outline:0}
.erp .search input:focus{border-color:var(--ink)}

.erp .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}
.erp .stat{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:12px 14px}
.erp .stat b{display:block;font-size:22px;margin-top:2px;font-family:'Bricolage Grotesque',sans-serif;font-variant-numeric:tabular-nums}
.erp .banner{display:flex;gap:10px;align-items:flex-start;padding:11px 14px;border-radius:10px;font-size:13px;background:#FBF0D6;color:#6E4300;border:1px solid #EBD39A}
.erp .banner.bad{background:#FBE5E1;color:#7C1D15;border-color:#EBBDB6}
.erp .banner.info{background:#EAE5D8;color:#3A362F;border-color:var(--line)}
.erp .banner svg{flex:none;margin-top:2px}

.erp .tbl{width:100%;border-collapse:collapse;font-size:13px}
.erp .tbl th{text-align:left;font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--mute);padding:6px 8px;border-bottom:1px solid var(--line)}
.erp .tbl td{padding:9px 8px;border-bottom:1px solid #EAE5D8}
.erp .tblwrap{overflow-x:auto}
.erp .seg{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px}
.erp .seg button{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:11px 13px;border-radius:10px;border:1.5px solid var(--line);background:#fff;font-weight:600;color:#4A453C;text-align:left}
.erp .seg button:hover{border-color:var(--ink)}
.erp .seg button.on{border-color:var(--acc);background:#FCEEE7;color:#8C2F0E;box-shadow:0 0 0 3px rgba(210,72,27,.12)}
.erp .ring{width:16px;height:16px;border-radius:50%;border:1.5px solid #C5BEAE;flex:none}
.erp .sub{background:#F1EDE4;border:1px solid #E6E0D2;border-radius:8px;padding:10px}
.erp .xp{border:1px solid var(--line);border-radius:10px;padding:12px;background:#fff}
.erp .xp.done{background:#EEF6F0;border-color:#BFDCC7}
.erp .ent{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;background:var(--paper);border:1px solid #EAE5D8;border-radius:6px;padding:6px 10px}

.erp .dock{position:fixed;left:0;right:0;bottom:0;background:var(--paper);border-top:1px solid var(--line);padding:12px 20px;display:flex;justify-content:space-between;align-items:center;gap:10px;z-index:15;box-shadow:0 -6px 20px rgba(25,23,20,.06)}
.erp .scrim{position:fixed;inset:0;background:rgba(25,23,20,.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:50;padding:16px}
.erp .modal{background:var(--paper);border-radius:14px;width:100%;max-width:400px;max-height:90vh;overflow-y:auto;padding:20px;box-shadow:0 24px 60px rgba(0,0,0,.35)}
.erp .modal.lg{max-width:540px;padding:0}
.erp .mhead{background:var(--ink);color:#F3EFE6;padding:18px 22px;display:flex;justify-content:space-between;align-items:flex-start}
.erp .mhead button{background:none;border:0;color:#A9A293}
.erp .mbody{padding:22px}
.erp .two{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
@media print {
  .erp { background: #fff !important; color: #000 !important; }
  .erp .top, .erp .tabs, .no-print, button, nav { display: none !important; }
  .erp .wrap { max-width: 100% !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
  .print-only { display: block !important; }
}
`;

/* ====================================================================== */
/*  Constants                                                              */
/* ====================================================================== */

const BRANCHES = ["Sasaram", "Bihiya", "Buxas", "Mohaniya"];
const BRANCH_SUB = { Sasaram: "Sasaram (Rohtas HQ)", Bihiya: "Bihiya (Bhojpur)", Buxas: "Buxas (Buxar)", Mohaniya: "Mohaniya (Kaimur)" };

function normalizeBranch(b) {
  if (!b) return "Sasaram";
  const l = String(b).toLowerCase().trim();
  return l.includes("bihiya") ? "Bihiya" : l.includes("buxa") ? "Buxas" : l.includes("mohan") ? "Mohaniya" : l.includes("sasaram") ? "Sasaram" : b;
}
const matchBranch = (db, fb) => !fb || fb === "all" ? true : !db ? false : normalizeBranch(db).toLowerCase() === fb.toLowerCase();
function formatParty(c) {
  if (!c) return "Untitled customer";
  const comp = (c.companyName || "").trim(), name = (c.name || "").trim();
  return comp && name ? `${comp} (${name})` : comp || name || "Untitled customer";
}

const ROLES = [
  { id: "superadmin", label: "Super Admin", desc: "Full control: reopen & edit deals anytime, user management & system settings", color: "#8E1D13" },
  { id: "admin", label: "Admin", desc: "Review, see and approve pricing, overages & deals", color: "#D2481B" },
  { id: "sales", label: "Sales", desc: "Create deals, quote pricing, log receipts", color: "#3B82C4" },
  { id: "accounts", label: "Accounts", desc: "Verify payments, office-use fields", color: "#3E9B63" },
  { id: "rto", label: "RTO / Registration", desc: "Feed insurance/HSRP/TR/registration spend", color: "#8E5FC7" },
];
const STATUS = { DRAFT: "draft", PENDING: "pending_approval", REJECTED: "rejected", APPROVED: "approved", DELIVERED: "delivered", CLOSED: "closed" };
const STATUS_META = {
  draft: { label: "Draft", color: "#6F6A5E", bg: "#ECE8DE", icon: FileText },
  pending_approval: { label: "Pending Approval", color: "#9A5B00", bg: "#F8E9C8", icon: Clock },
  rejected: { label: "Rejected", color: "#A8281F", bg: "#F8DAD5", icon: XCircle },
  approved: { label: "Approved · Collecting Payment", color: "#17595A", bg: "#D7EBEA", icon: Wallet },
  delivered: { label: "Delivered", color: "#5B3A86", bg: "#E6DDF2", icon: PackageCheck },
  closed: { label: "Closed", color: "#25683A", bg: "#D9EDDD", icon: Lock },
};
const EXPENSE_CATEGORIES = [
  { id: "insurance", label: "Insurance", pricingField: "insurance" },
  { id: "hsrp", label: "Choice No + HSRP", pricingField: "choiceHsrp" },
  { id: "tr", label: "Temporary Registration", pricingField: "tr" },
  { id: "registration", label: "Registration", pricingField: "registration" },
];
const EXPENSE_STATUS_META = {
  posted: { label: "Posted", color: "#25683A", bg: "#D9EDDD" },
  pending_approval: { label: "Awaiting Admin approval", color: "#9A5B00", bg: "#F8E9C8" },
  rejected: { label: "Rejected", color: "#A8281F", bg: "#F8DAD5" },
};
const ADJ_META = { approved: ["Approved", "#25683A", "#D9EDDD"], rejected: ["Rejected", "#A8281F", "#F8DAD5"], pending: ["Awaiting Admin approval", "#9A5B00", "#F8E9C8"] };
const PAYMENT_MODES = ["Cash", "Cheque", "NEFT/RTGS", "Financer Disbursement", "Exchange Vehicle"];
const ADMIN_ONLY_PAYMENT_MODE = "Advance Adjustment";

const CUSTOMER_FIELDS = [["companyName", "Company Name"], ["gstNo", "GST No. (Optional)"], ["name", "Customer Name"], ["soWo", "S/o, W/o, D/o"], ["dob", "DOB / Age"], ["pan", "PAN No."], ["aadhar", "Aadhar No."], ["mobile", "Mobile"], ["address", "Address"], ["po", "P.O."], ["ps", "P.S."], ["district", "District"], ["pin", "PIN"], ["state", "State"]];
const VEHICLE_FIELDS = [["model", "Model"], ["colour", "Colour"], ["bodyType", "Body type"], ["chassisNo", "Chassis No."], ["engineNo", "Engine No."], ["fuelType", "Fuel type"], ["dod", "DOD"], ["dse", "DSE"], ["dsm", "DSM"], ["financerName", "Financer name"], ["rto", "RTO"]];
// "=" prefix → computed read-only row, "@" → the user-defined discounts editor
const PRICE_ROWS = [["exshowroom", "Exshowroom price"], ["tmlDiscount", "Less: TML cash discount"], ["dealerDiscount", "Less: Dealer discount"], ["vasNfaDiscount", "Less: VAS NFA discount"], ["@otherDiscounts"], ["=netPrice", "Net price of vehicle"], ["=tcs", "Add: TCS 1% (Auto on Net > ₹10L)"], ["tr", "Add: TR"], ["insurance", "Add: Insurance"], ["registration", "Add: Registration"], ["permit", "Add: Permit"], ["fleetedgeVltd", "Add: Fleetedge/VLTD"], ["vasAmc", "Add: VAS (AMC/FMS)"], ["bodyFabCharge", "Add: Body fabrication chg"], ["choiceHsrp", "Add: Choice No + HSRP"], ["transportation", "Add: Transportation"], ["=totalOnRoad", "Total on-road price"], ["exchangeBonus", "Less: Exchange bonus"], ["=netOnRoad", "NET ON-ROAD PRICE"]];
const OFFICE_FIELDS = [["remarks", "Remarks"], ["bodyFabName", "Body fab. name"], ["interestCost", "Interest cost"], ["retentionVehicle", "Retention on vehicle"], ["retentionBody", "Retention on body"], ["retentionVas", "Retention on VAS"], ["retentionOthers", "Retention on others"]];
const blank = list => Object.fromEntries(list.map(([k]) => [k, ""]));
const emptyCustomer = () => blank(CUSTOMER_FIELDS);
const emptyVehicle = () => blank(VEHICLE_FIELDS);
const emptyPricing = () => ({ ...blank(PRICE_ROWS.filter(r => !/^[=@]/.test(r[0]))), otherDiscounts: [], tcs: 0 });
const emptyOfficeUse = () => blank(OFFICE_FIELDS);

const stamp = () => new Date().toISOString();
const today = () => stamp().slice(0, 10);
const logEntry = (by, role, note) => ({ at: stamp(), by, role, note });

function newDeal(branch, actor, initialCustomer = {}) {
  const selectedBranch = normalizeBranch(branch) || "Sasaram";
  const isSales = actor?.role === "sales";
  return {
    id: "D" + Date.now().toString(36).toUpperCase(),
    branch: selectedBranch,
    status: STATUS.DRAFT,
    createdBy: actor?.name || "Sales",
    createdById: actor?.id || "",
    createdByUsername: actor?.username || "",
    createdAt: stamp(),
    customer: { ...emptyCustomer(), ...initialCustomer },
    vehicle: {
      ...emptyVehicle(),
      dse: isSales ? (actor?.name || actor?.username || "") : "",
    },
    pricing: emptyPricing(),
    officeUse: emptyOfficeUse(),
    approval: { status: STATUS.DRAFT, by: "", at: "", remarks: "" },
    paymentLog: [],
    refundLog: [],
    expenses: [],
    amendments: [],
    adjustments: [],
    expenseClosed: { insurance: false, hsrp: false, tr: false, registration: false },
    activity: [logEntry(actor?.name || "Sales", actor?.role || "sales", `Deal created for ${selectedBranch} branch`)],
  };
}

const num = v => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));
const sum = (arr, f = x => x) => (arr || []).reduce((s, x) => s + num(f(x)), 0);
const inr = v => "₹" + Math.round(num(v)).toLocaleString("en-IN");

function describe(v) {
  if (Array.isArray(v)) return v.length ? `${v.length} line(s) totaling ${inr(sum(v, o => o.amount))}` : "none";
  if (v === "" || v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}
const describeChanges = ch => ch.map(c => `${c.section}.${c.field}: ${describe(c.oldValue)} → ${describe(c.newValue)}`).join("; ");
// Older entries only had a `verified` boolean.
const paymentStatus = e => e.status || (e.verified ? "verified" : "pending");

function calc(deal) {
  const p = deal?.pricing || {};
  const otherDiscountsTotal = sum(p.otherDiscounts || [], o => o.amount);
  const netPrice = num(p.exshowroom) - num(p.tmlDiscount) - num(p.dealerDiscount) - num(p.vasNfaDiscount) - otherDiscountsTotal;
  const tcs = netPrice > 1000000 ? Math.round(netPrice * 0.01) : 0;
  const adds = tcs + sum(["tr", "insurance", "registration", "permit", "fleetedgeVltd", "vasAmc", "bodyFabCharge", "choiceHsrp", "transportation"], k => p[k]);
  const totalOnRoad = netPrice + adds;
  const netOnRoad = totalOnRoad - num(p.exchangeBonus);
  const totalCollected = sum((deal?.paymentLog || []).filter(e => paymentStatus(e) !== "rejected"), e => e.amount);
  const totalRefunded = sum((deal?.refundLog || []).filter(e => paymentStatus(e) !== "rejected"), e => e.amount);
  const netCollected = totalCollected - totalRefunded;
  const adj = s => sum((deal?.adjustments || []).filter(a => a.status === s), a => a.amount);
  const approvedAdjustments = adj("approved"), pendingAdjustments = adj("pending");
  return {
    netPrice,
    tcs,
    totalOnRoad,
    netOnRoad,
    totalCollected,
    totalRefunded,
    netCollected,
    approvedAdjustments,
    pendingAdjustments,
    balance: netOnRoad - netCollected - approvedAdjustments,
    otherDiscountsTotal,
  };
}
const expenseCap = (deal, cat) => num(deal.pricing[EXPENSE_CATEGORIES.find(c => c.id === cat)?.pricingField]);
const postedSpend = (expenses, cat, excludeId = null) => sum((expenses || []).filter(e => e.category === cat && e.status === "posted" && e.id !== excludeId), e => e.amount);

function advanceAdjustedOut(deals, sourceDealId, excludeEntryId = null) {
  return sum(deals.flatMap(d => d.paymentLog || []).filter(e => e.mode === ADMIN_ONLY_PAYMENT_MODE && e.sourceDealId === sourceDealId && e.id !== excludeEntryId), e => e.amount);
}
function availableAdvance(deals, src, excludeEntryId = null) {
  const c = calc(src);
  return Math.max(0, Math.max(0, c.totalCollected - c.netOnRoad) - advanceAdjustedOut(deals, src.id, excludeEntryId));
}
// Flatten a per-deal list (paymentLog / expenses / ...) with deal context attached.
const flat = (deals, key, pred = () => true) =>
  deals.flatMap(d => (d[key] || []).filter(pred).map(e => ({ ...e, dealId: d.id, customer: formatParty(d.customer), branch: normalizeBranch(d.branch), chassis: d.vehicle.chassisNo })));
// Immutable "patch one entry in a list" updater.
const patchIn = (key, id, patch) => p => ({ ...p, [key]: (p[key] || []).map(e => (e.id === id ? { ...e, ...patch } : e)) });
const dealSub = e => `${e.branch} · ${e.dealId}${e.chassis ? ` · Chassis ${e.chassis}` : ""}`;

/* ====================================================================== */
/*  Primitives                                                             */
/* ====================================================================== */

function Field({ label, value, onChange, readOnly, prefix, onCommit }) {
  const start = useRef(value);
  return (
    <label className="fld">
      <span className="lbl">{label}</span>
      <span className={`inp ${readOnly ? "ro" : ""}`}>
        {prefix && <i>{prefix}</i>}
        <input
          value={value ?? ""} readOnly={readOnly}
          onFocus={() => { start.current = value; }}
          onChange={e => onChange?.(e.target.value)}
          onBlur={() => { if (onCommit && start.current !== value) onCommit(start.current, value); }}
        />
      </span>
    </label>
  );
}

function Section({ title, subtitle, children, defaultOpen = true, accent = "#191714" }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sec">
      <button className="sec-h" onClick={() => setOpen(!open)}>
        <span className="flex">
          <span className="bar" style={{ background: accent }} />
          <span><span className="h" style={{ display: "block" }}>{title}</span>{subtitle && <span className="sm mute">{subtitle}</span>}</span>
        </span>
        <ChevronDown size={16} style={{ color: accent, transform: open ? "rotate(180deg)" : "none", transition: ".2s" }} />
      </button>
      {open && <div className="sec-b">{children}</div>}
    </div>
  );
}

const Chip = ({ color, bg, icon: Icon, children }) => (
  <span className="chip" style={{ "--c": color, "--b": bg }}>{Icon && <Icon size={13} />}{children}</span>
);
const StatusBadge = ({ status }) => { const m = STATUS_META[status] || STATUS_META.draft; return <Chip {...m}>{m.label}</Chip>; };
const Banner = ({ kind = "", icon: Icon = AlertTriangle, children }) => <div className={`banner ${kind}`}><Icon size={16} /><div>{children}</div></div>;
const Card = ({ title, icon: Icon, right, children }) => (
  <div className="card">
    <div className="flex between wrapf" style={{ marginBottom: 12 }}>
      <div className="flex">{Icon && <Icon size={17} color="#8E5FC7" />}<span className="h">{title}</span></div>{right}
    </div>
    {children}
  </div>
);
const Empty = ({ children }) => <div className="mute sm" style={{ fontStyle: "italic", padding: "6px 0" }}>{children}</div>;

// In-app popup form — replaces window.prompt()/alert(), which sandboxed frames block.
function ModalForm({ title, message, fields, onClose, onSubmit }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map(f => [f.name, f.defaultValue ?? ""])));
  const [error, setError] = useState("");
  const submit = () => { const err = onSubmit(values); err ? setError(err) : onClose(); };
  const setV = (name, v) => setValues(s => ({ ...s, [name]: v }));
  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal stack" onClick={e => e.stopPropagation()}>
        <div className="h" style={{ fontSize: 20 }}>{title}</div>
        {message && <div className="sm mute">{message}</div>}
        {fields.filter(f => !f.showIf || f.showIf(values)).map(f => (
          <label key={f.name} className="fld">
            <span className="lbl">{f.label}</span>
            {f.type === "select" ? (
              <select className="sel" value={values[f.name]} onChange={e => setV(f.name, e.target.value)}>
                {f.options.length === 0 && <option value="">None available</option>}
                {f.options.map(o => <option key={o} value={o}>{f.optionLabels?.[o] || o}</option>)}
              </select>
            ) : (
              <span className="inp">
                <input autoFocus={f.autoFocus} type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                  value={values[f.name]} onChange={e => setV(f.name, e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
              </span>
            )}
          </label>
        ))}
        {error && <Banner kind="bad">{error}</Banner>}
        <div className="flex" style={{ justifyContent: "flex-end", paddingTop: 6 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn pri" onClick={submit}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

function OtherDiscountsEditor({ value, onChange, readOnly, onCommit }) {
  const list = value || [];
  const box = useRef(null), snap = useRef(null), capturing = useRef(false);
  const update = (id, patch) => onChange(list.map(o => (o.id === id ? { ...o, ...patch } : o)));
  const change = next => { onChange(next); onCommit?.(list, next); };
  return (
    <div
      ref={box} className="span stack-s"
      onFocusCapture={() => { if (!capturing.current) { capturing.current = true; snap.current = list; } }}
      onBlurCapture={e => {
        if (box.current && !box.current.contains(e.relatedTarget)) {
          capturing.current = false;
          if (onCommit && JSON.stringify(snap.current) !== JSON.stringify(list)) onCommit(snap.current, list);
        }
      }}
    >
      <div className="flex between">
        <span className="lbl">Other discounts (user-defined)</span>
        {!readOnly && <button className="lnk" onClick={() => change([...list, { id: "OD" + Date.now().toString(36), label: "", amount: "" }])}>+ Add discount line</button>}
      </div>
      {list.length === 0 && <Empty>No additional discounts.</Empty>}
      {list.map(o => (
        <div key={o.id} className="flex wrapf sub">
          <span className={`inp grow ${readOnly ? "ro" : ""}`} style={{ minWidth: 150 }}>
            <input placeholder="Discount label (e.g. Festival offer)" value={o.label} readOnly={readOnly} onChange={e => update(o.id, { label: e.target.value })} />
          </span>
          <span className={`inp ${readOnly ? "ro" : ""}`} style={{ width: 140 }}>
            <i>₹</i><input type="number" value={o.amount} readOnly={readOnly} onChange={e => update(o.id, { amount: e.target.value })} />
          </span>
          {!readOnly && <button className="lnk bad" onClick={() => change(list.filter(x => x.id !== o.id))}>Remove</button>}
        </div>
      ))}
    </div>
  );
}

/* ====================================================================== */
/*  Deal editor                                                            */
/* ====================================================================== */

function DealEditor({ deal: d, deals, session, onUpdate, onBack, onDelete }) {
  const { role } = session;
  const isSuperAdmin = role === "superadmin";
  const isAdmin = role === "admin";
  const isAccounts = role === "accounts";
  const isSales = role === "sales";
  const isRto = role === "rto";
  const isAdminOrSuper = isAdmin || isSuperAdmin;
  const chassis = d.vehicle.chassisNo;
  const hasPendingAmendment = (d.amendments || []).some(a => a.status === "pending");
  const [editMode, setEditMode] = useState(false);
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Status flags
  const preApproval = d.status === STATUS.DRAFT || d.status === STATUS.REJECTED;
  const postApproval = d.status === STATUS.APPROVED || d.status === STATUS.DELIVERED;
  const isClosed = d.status === STATUS.CLOSED;

  // Requirement 1: Super Admin has privilege to reopen and edit deal anytime.
  // Admin can ONLY see and approve (no direct arbitrary editing).
  const canTouch = isSuperAdmin
    ? (preApproval || editMode)
    : isSales && !hasPendingAmendment && (preApproval || (postApproval && editMode));

  const gated = !isSuperAdmin; // Only Super Admin bypasses amendment staging completely!

  const snapshot = () => ({
    customer: { ...emptyCustomer(), ...(d.customer || {}) },
    vehicle: { ...emptyVehicle(), ...(d.vehicle || {}) },
    pricing: { ...emptyPricing(), ...(d.pricing || {}) },
  });
  const [coreDraft, setCoreDraft] = useState(snapshot);
  const coreDirty = gated && JSON.stringify(coreDraft) !== JSON.stringify(snapshot());

  const activePricing = coreDraft?.pricing || d.pricing;
  const c = calc({ ...d, pricing: activePricing });

  useEffect(() => {
    setCoreDraft(snapshot());
    setEditMode(false);
  }, [d.id]);

  // Every change saves immediately through onUpdate; nothing lives only in this component.
  const withLog = (patchFn, note) => onUpdate(prev => ({ ...patchFn(prev), activity: [...(prev.activity || []), logEntry(session.name, role, note)] }));
  const set = (section, field, value) => onUpdate(prev => ({ ...prev, [section]: { ...(prev[section] || {}), [field]: value } }));
  const commitFieldChange = (section, field, o, n) => { if (JSON.stringify(o) !== JSON.stringify(n)) withLog(p => p, `Changed ${section}.${field}: ${describe(o)} → ${describe(n)}`); };

  const editCore = (section, field, value) => {
    if (section === "pricing") {
      setCoreDraft(prev => {
        const nextPricing = { ...prev.pricing, [field]: value };
        const otherTot = sum(nextPricing.otherDiscounts || [], o => o.amount);
        const net = num(nextPricing.exshowroom) - num(nextPricing.tmlDiscount) - num(nextPricing.dealerDiscount) - num(nextPricing.vasNfaDiscount) - otherTot;
        nextPricing.tcs = net > 1000000 ? Math.round(net * 0.01) : 0;
        return { ...prev, pricing: nextPricing };
      });
      if (!gated) {
        onUpdate(prev => {
          const nextPricing = { ...(prev.pricing || {}), [field]: value };
          const otherTot = sum(nextPricing.otherDiscounts || [], o => o.amount);
          const net = num(nextPricing.exshowroom) - num(nextPricing.tmlDiscount) - num(nextPricing.dealerDiscount) - num(nextPricing.vasNfaDiscount) - otherTot;
          nextPricing.tcs = net > 1000000 ? Math.round(net * 0.01) : 0;
          return { ...prev, pricing: nextPricing };
        });
      }
      return;
    }
    setCoreDraft(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    if (!gated) set(section, field, value);
  };
  const editCoreCommit = (section, field, o, n) => { if (!gated) commitFieldChange(section, field, o, n); };
  const discardEdits = () => { setCoreDraft(snapshot()); setEditMode(false); };

  // Super Admin direct saving anytime
  const saveSuperAdminEdits = () => {
    withLog(p => {
      const nextPricing = { ...(p.pricing || {}), ...(coreDraft.pricing || {}) };
      const otherTot = sum(nextPricing.otherDiscounts || [], o => o.amount);
      const net = num(nextPricing.exshowroom) - num(nextPricing.tmlDiscount) - num(nextPricing.dealerDiscount) - num(nextPricing.vasNfaDiscount) - otherTot;
      nextPricing.tcs = net > 1000000 ? Math.round(net * 0.01) : 0;
      return {
        ...p,
        customer: { ...(p.customer || {}), ...(coreDraft.customer || {}) },
        vehicle: { ...(p.vehicle || {}), ...(coreDraft.vehicle || {}) },
        pricing: nextPricing,
      };
    }, "Super Admin updated deal fields directly");
    setEditMode(false);
  };

  // Requirement 1: Reopen deal anytime (Super Admin exclusive)
  const reopenDeal = () => {
    setModal({
      title: "Reopen Deal (Super Admin)",
      message: `Reopen deal ${d.id} for full editing or further transactions. This privilege is exclusive to Super Admin.`,
      fields: [
        {
          name: "targetStatus",
          label: "Reopen Status",
          type: "select",
          options: [STATUS.APPROVED, STATUS.DRAFT],
          optionLabels: {
            [STATUS.APPROVED]: "Approved (Collecting Payments & Operations)",
            [STATUS.DRAFT]: "Draft (Full Editing Mode)",
          },
          defaultValue: STATUS.APPROVED,
        },
        {
          name: "reason",
          label: "Reason for Reopening",
          autoFocus: true,
        },
      ],
      onSubmit: v => {
        const nextStatus = v.targetStatus || STATUS.APPROVED;
        const reason = v.reason ? `: ${v.reason}` : "";
        withLog(
          p => ({ ...p, status: nextStatus }),
          `Deal reopened to "${STATUS_META[nextStatus]?.label || nextStatus}" by Super Admin${reason}`
        );
        setEditMode(true);
      },
    });
  };

  const requestAmendment = () => {
    const changes = ["customer", "vehicle", "pricing"].flatMap(section =>
      Object.keys(coreDraft[section])
        .filter(field => JSON.stringify(coreDraft[section][field]) !== JSON.stringify(d[section][field]))
        .map(field => ({ section, field, oldValue: d[section][field], newValue: coreDraft[section][field] })));
    if (!changes.length) return setEditMode(false);
    const amendment = { id: "A" + Date.now().toString(36), changes, requestedBy: session.name, requestedAt: stamp(), status: "pending" };
    withLog(p => ({ ...p, amendments: [...(p.amendments || []), amendment] }), `Requested approval for ${changes.length} field change(s) — ${describeChanges(changes)}`);
    setEditMode(false);
  };

  const reviewAmendment = (id, approved) => {
    const am = (d.amendments || []).find(a => a.id === id);
    if (!am) return;
    withLog(p => {
      let next = { ...p };
      if (approved) am.changes.forEach(ch => { next = { ...next, [ch.section]: { ...next[ch.section], [ch.field]: ch.newValue } }; });
      return { ...next, amendments: p.amendments.map(a => (a.id === id ? { ...a, status: approved ? "approved" : "rejected", reviewedBy: session.name, reviewedAt: stamp() } : a)) };
    }, `${approved ? "Approved" : "Rejected"} field change request — ${describeChanges(am.changes)}`);
  };

  const submitForApproval = () => {
    const validBranch = normalizeBranch(d.branch);
    if (!validBranch || !BRANCHES.includes(validBranch)) {
      alert("⚠️ Branch selection is mandatory! Please select one of the 4 branches (Sasaram, Bihiya, Buxas, or Mohaniya) before submitting for approval.");
      return;
    }
    withLog(p => ({ ...p, branch: validBranch, status: STATUS.PENDING, approval: { status: STATUS.PENDING, by: "", at: "", remarks: "" } }), "Submitted pricing for admin approval");
  };
  const approve = () => withLog(p => ({ ...p, status: STATUS.APPROVED, approval: { status: "approved", by: session.name, at: stamp(), remarks: "" } }), "Pricing approved");
  const reject = () => setModal({
    title: "Reject pricing",
    fields: [{ name: "remarks", label: "Reason (shown to Sales)", autoFocus: true }],
    onSubmit: v => withLog(p => ({ ...p, status: STATUS.REJECTED, approval: { status: "rejected", by: session.name, at: stamp(), remarks: v.remarks || "" } }), "Pricing rejected" + (v.remarks ? `: ${v.remarks}` : "")),
  });

  const markDelivered = () => withLog(p => ({ ...p, status: STATUS.DELIVERED }), "Marked as delivered");
  const closeDeal = () => withLog(p => ({ ...p, status: STATUS.CLOSED }), "Closed deal — all customer commitments completed");

  // Payment Logging
  const addPayment = () => {
    const modeOptions = isAdminOrSuper ? [...PAYMENT_MODES, ADMIN_ONLY_PAYMENT_MODE] : PAYMENT_MODES;
    const advances = deals.filter(dl => dl.id !== d.id).map(dl => {
      const avail = availableAdvance(deals, dl);
      return { id: dl.id, avail, label: `${formatParty(dl.customer)} · ${normalizeBranch(dl.branch)} · Chassis ${dl.vehicle.chassisNo || "—"} · Available ${inr(avail)}` };
    }).filter(x => x.avail > 0);
    setModal({
      title: "Log customer payment",
      fields: [
        { name: "date", label: "Date of receipt", type: "date", defaultValue: today(), autoFocus: true },
        { name: "amount", label: "Amount received (₹)", type: "number" },
        { name: "mode", label: "Payment mode", type: "select", options: modeOptions, defaultValue: "Cash" },
        { name: "sourceDealId", label: "Source deal (whose advance is being adjusted)", type: "select", options: advances.map(x => x.id), optionLabels: Object.fromEntries(advances.map(x => [x.id, x.label])), defaultValue: advances[0]?.id || "", showIf: v => v.mode === ADMIN_ONLY_PAYMENT_MODE },
        { name: "reference", label: "Reference / UTR / Cheque No. (optional)", showIf: v => v.mode !== ADMIN_ONLY_PAYMENT_MODE },
      ],
      onSubmit: v => {
        const amount = parseFloat(v.amount);
        if (!amount || isNaN(amount) || amount <= 0) return "Enter a valid amount.";
        if (!v.date) return "Pick a date of receipt.";
        const adv = v.mode === ADMIN_ONLY_PAYMENT_MODE;
        let sourceLabel = "";
        if (adv) {
          if (!isAdminOrSuper) return "Only Admin/Super Admin can use Advance Adjustment.";
          const source = deals.find(dl => dl.id === v.sourceDealId);
          if (!source) return "Select a valid source deal.";
          const avail = availableAdvance(deals, source);
          if (amount > avail) return `Exceeds available advance on that deal (${inr(avail)}).`;
          sourceLabel = ` from advance on ${formatParty(source.customer) || source.id}`;
        }
        const entry = {
          id: "P" + Date.now().toString(36), date: v.date, amount, mode: v.mode,
          reference: adv ? "" : v.reference || "", sourceDealId: adv ? v.sourceDealId : undefined,
          enteredBy: session.name,
          status: isAccounts ? "verified" : "pending", verifiedBy: isAccounts ? session.name : undefined,
        };
        withLog(p => ({ ...p, paymentLog: [...(p.paymentLog || []), entry] }), `Logged payment ${inr(amount)} via ${v.mode}${sourceLabel} (received ${v.date})${isAccounts ? " — recorded as received" : ""}`);
      },
    });
  };
  const payLabel = id => { const e = (d.paymentLog || []).find(x => x.id === id); return e ? `${inr(e.amount)} via ${e.mode}` : ""; };
  const verifyPayment = id => withLog(patchIn("paymentLog", id, { status: "verified", verifiedBy: session.name }), `Verified payment ${payLabel(id)}`);
  const rejectPayment = id => {
    const e = (d.paymentLog || []).find(x => x.id === id);
    setModal({
      title: "Reject this payment",
      message: e ? `${inr(e.amount)} via ${e.mode}, received ${e.date}` : undefined,
      fields: [{ name: "reason", label: "Reason (e.g. cheque bounced, amount mismatch)", autoFocus: true }],
      onSubmit: v => withLog(patchIn("paymentLog", id, { status: "rejected", rejectedBy: session.name, rejectionReason: v.reason || "" }), `Rejected payment ${payLabel(id)}${v.reason ? ": " + v.reason : ""}`),
    });
  };

  // Requirement 4: Customer Refund log with options: Customer, Body Fabricator, Retention Amount
  const addRefund = () => {
    const refundOptions = ["Customer", "Body Fabricator", "Retention Amount"];
    setModal({
      title: "Log customer refund",
      fields: [
        { name: "date", label: "Date of refund", type: "date", defaultValue: today(), autoFocus: true },
        { name: "refundType", label: "Refund to / Option", type: "select", options: refundOptions, defaultValue: "Customer" },
        { name: "amount", label: "Amount refunded (₹)", type: "number" },
        { name: "mode", label: "Refund payment mode", type: "select", options: PAYMENT_MODES, defaultValue: "Cash" },
        { name: "reference", label: "Reference / UTR / Cheque No. (optional)" },
        { name: "remarks", label: "Remarks / Reason (optional)" },
      ],
      onSubmit: v => {
        const amount = parseFloat(v.amount);
        if (!amount || isNaN(amount) || amount <= 0) return "Enter a valid amount.";
        if (!v.date) return "Pick a date of refund.";
        if (!v.refundType) return "Select a refund option.";
        const entry = {
          id: "R" + Date.now().toString(36),
          date: v.date,
          refundType: v.refundType,
          amount,
          mode: v.mode,
          reference: v.reference || "",
          remarks: v.remarks || "",
          enteredBy: session.name,
          status: isAccounts ? "verified" : "pending",
          verifiedBy: isAccounts ? session.name : undefined,
        };
        withLog(
          p => ({ ...p, refundLog: [...(p.refundLog || []), entry] }),
          `Logged refund of ${inr(amount)} to ${v.refundType} via ${v.mode}${v.reference ? ` (Ref: ${v.reference})` : ""}${isAccounts ? " — recorded as verified" : ""}`
        );
      },
    });
  };
  const refundLabel = id => {
    const e = (d.refundLog || []).find(x => x.id === id);
    return e ? `${inr(e.amount)} (${e.refundType || "Customer"}) via ${e.mode}` : "";
  };
  const verifyRefund = id => withLog(patchIn("refundLog", id, { status: "verified", verifiedBy: session.name }), `Verified refund ${refundLabel(id)}`);
  const rejectRefund = id => {
    const e = (d.refundLog || []).find(x => x.id === id);
    setModal({
      title: "Reject this refund",
      message: e ? `${inr(e.amount)} to ${e.refundType || "Customer"} via ${e.mode}, dated ${e.date}` : undefined,
      fields: [{ name: "reason", label: "Reason (e.g. invalid claim, account mismatch)", autoFocus: true }],
      onSubmit: v => withLog(patchIn("refundLog", id, { status: "rejected", rejectedBy: session.name, rejectionReason: v.reason || "" }), `Rejected refund ${refundLabel(id)}${v.reason ? ": " + v.reason : ""}`),
    });
  };

  // Adjustments
  const addAdjustment = () => setModal({
    title: "Add receipt adjustment",
    fields: [
      { name: "amount", label: "Adjustment amount (₹)", type: "number", autoFocus: true },
      { name: "reason", label: "Reason (e.g. rounding off, final negotiated discount)" },
      { name: "date", label: "Date", type: "date", defaultValue: today() },
    ],
    onSubmit: v => {
      const amount = parseFloat(v.amount);
      if (!amount || isNaN(amount) || amount <= 0) return "Enter a valid amount.";
      const entry = { id: "ADJ" + Date.now().toString(36), amount, reason: v.reason || "", date: v.date || today(), enteredBy: session.name, status: "pending" };
      withLog(p => ({ ...p, adjustments: [...(p.adjustments || []), entry] }), `Requested receipt adjustment ${inr(amount)}${v.reason ? ": " + v.reason : ""} — awaiting Admin approval`);
    },
  });
  const reviewAdjustment = (id, approved) => {
    const e = (d.adjustments || []).find(a => a.id === id);
    withLog(patchIn("adjustments", id, { status: approved ? "approved" : "rejected", approvedBy: session.name }), `${approved ? "Approved" : "Rejected"} receipt adjustment ${e ? inr(e.amount) : ""}`);
  };

  // RTO Expenses
  const addExpense = category => setModal({
    title: `Log ${EXPENSE_CATEGORIES.find(x => x.id === category)?.label} expense`,
    fields: [{ name: "amount", label: "Amount actually spent (₹)", type: "number", autoFocus: true }, { name: "remarks", label: "Remarks (vendor, invoice no.) — optional" }],
    onSubmit: v => {
      const amount = parseFloat(v.amount);
      if (!amount || isNaN(amount) || amount <= 0) return "Enter a valid amount.";
      withLog(p => {
        const status = postedSpend(p.expenses, category) + amount > expenseCap(p, category) ? "pending_approval" : "posted";
        return { ...p, expenses: [...(p.expenses || []), { id: "E" + Date.now().toString(36), category, amount, remarks: v.remarks || "", status, enteredBy: session.name, createdAt: stamp() }] };
      }, `Logged ${category} expense ${inr(amount)}`);
    },
  });
  const reviewExpense = (id, approved) => {
    const e = (d.expenses || []).find(x => x.id === id);
    withLog(patchIn("expenses", id, { status: approved ? "posted" : "rejected", approvedBy: session.name }), `${approved ? "Approved" : "Rejected"} over-receipt expense ${e ? EXPENSE_CATEGORIES.find(x => x.id === e.category)?.label + " " + inr(e.amount) : ""}`);
  };
  const setCategoryDone = (category, done) => {
    const label = EXPENSE_CATEGORIES.find(x => x.id === category)?.label;
    withLog(p => ({ ...p, expenseClosed: { ...(p.expenseClosed || {}), [category]: done } }),
      done ? `Marked ${label} as done — spent ${inr(postedSpend(d.expenses, category))} of ${inr(expenseCap(d, category))} collected` : `Reopened ${label} for further entries`);
  };

  const priceSub = d.status === STATUS.PENDING ? "Locked — awaiting Admin decision" : isClosed ? (isSuperAdmin ? "Closed — Super Admin can reopen & edit anytime" : "Locked — deal is closed") : postApproval ? (editMode ? "Editing active" : isSuperAdmin ? "Super Admin can edit anytime" : "Locked — click Edit to request amendment") : "Sales enters";
  const canLogPayment = (isSales || isAccounts || isAdminOrSuper) && (postApproval || isSuperAdmin);
  const pendingAmendments = (d.amendments || []).filter(a => a.status === "pending");
  const balanceDue = c.balance > 0;

  return (
    <>
      <DealPrintSheet deal={d} totals={calc(d)} showOffice={isAdminOrSuper || isAccounts} session={session} />
      <div className="stack no-print" style={{ paddingBottom: 90 }}>
        <div className="flex between wrapf">
          <button className="lnk mu flex" onClick={onBack}><ArrowLeft size={15} /> All deals</button>
          <div className="flex">
            <button className="btn pri xs" onClick={() => {
              const prev = document.title;
              document.title = `Term Sheet - ${formatParty(d.customer)} - ${d.id}`;
              window.addEventListener("afterprint", () => { document.title = prev; }, { once: true });
              window.print();
            }}><Printer size={14} /> Print term sheet</button>
            {chassis && <span className="tag mono" style={{ padding: "4px 9px" }}>Chassis: {chassis}</span>}
            <StatusBadge status={d.status} />
          </div>
        </div>

        <div className="stats">
          <div className="stat"><span className="lbl">Net on-road</span><b>{inr(c.netOnRoad)}</b></div>
          <div className="stat"><span className="lbl">Total collected</span><b>{inr(c.totalCollected)}</b></div>
          {c.totalRefunded > 0 && <div className="stat"><span className="lbl">Total refunded</span><b className="bad">{inr(c.totalRefunded)}</b></div>}
          <div className="stat" style={{ borderColor: balanceDue ? "#E3B79F" : "#BFDCC7" }}><span className="lbl">Balance</span><b className={balanceDue ? "warn" : "ok"}>{inr(c.balance)}</b></div>
        </div>

        {d.approval.status === "rejected" && d.approval.remarks && <Banner kind="bad"><b>Admin rejected this pricing:</b> {d.approval.remarks}</Banner>}
        {d.status === STATUS.PENDING && <Banner>Submitted for approval — Customer, Vehicle, and Pricing are awaiting review. {isSuperAdmin ? "As Super Admin, you can edit or decision anytime." : isAdmin ? "You can review and approve or reject below." : "Awaiting Admin decision."}</Banner>}
        {d.status === STATUS.DRAFT && (isSales || isAdminOrSuper) && <div className="flex" style={{ justifyContent: "flex-end" }}><button className="btn no xs" onClick={() => setConfirmDelete(true)}>Delete this draft</button></div>}

        {pendingAmendments.length > 0 && (
          <div className="card stack-s" style={{ background: "#FBF0D6", borderColor: "#EBD39A" }}>
            <div className="h">Field change request awaiting approval</div>
            {pendingAmendments.map(a => (
              <div key={a.id} className="xp">
                <div className="sm mute" style={{ marginBottom: 4 }}>Requested by {a.requestedBy} on {new Date(a.requestedAt).toLocaleString("en-IN")}</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {a.changes.map((ch, i) => (
                    <li key={i}><span className="tag mono">{ch.section}.{ch.field}</span> {typeof ch.oldValue === "object" ? "(list)" : String(ch.oldValue) || "—"} → <b>{typeof ch.newValue === "object" ? "(list)" : String(ch.newValue) || "—"}</b></li>
                  ))}
                </ul>
                {isAdminOrSuper ? (
                  <div className="flex" style={{ marginTop: 8 }}>
                    <button className="btn go xs" onClick={() => reviewAmendment(a.id, true)}>Approve</button>
                    <button className="btn no xs" onClick={() => reviewAmendment(a.id, false)}>Reject</button>
                  </div>
                ) : <div className="sm mute" style={{ marginTop: 6 }}>Waiting on Admin review.</div>}
              </div>
            ))}
          </div>
        )}

        {/* Super Admin Edit & Reopen Controls */}
        {isSuperAdmin && (
          <div className="card flex between wrapf" style={{ padding: 12, background: "#FAF5FF", borderColor: "#D8B4FE" }}>
            {!editMode ? (
              <>
                <div className="sm" style={{ maxWidth: 580 }}>
                  <b style={{ color: "#6B21A8" }}>Super Admin Privilege:</b> You have exclusive privilege to reopen and edit this deal anytime.
                </div>
                <div className="flex">
                  {(d.status === STATUS.CLOSED || d.status === STATUS.DELIVERED) && (
                    <button className="btn acc" onClick={reopenDeal}><RotateCcw size={14} /> Reopen Deal</button>
                  )}
                  <button className="btn pri" onClick={() => setEditMode(true)}>Edit Deal Anytime</button>
                </div>
              </>
            ) : (
              <>
                <div className="sm" style={{ maxWidth: 580 }}>
                  <b style={{ color: "#6B21A8" }}>Super Admin Direct Editing:</b> Edit any customer, vehicle, pricing or retention fields below.
                </div>
                <div className="flex">
                  <button className="btn" onClick={discardEdits}>Discard changes</button>
                  <button className="btn acc" onClick={saveSuperAdminEdits}>Save Super Admin Changes</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Sales post-approval amendment request */}
        {isSales && postApproval && !hasPendingAmendment && (
          <div className="card flex between wrapf" style={{ padding: 12 }}>
            {!editMode ? (
              <>
                <div className="sm" style={{ maxWidth: 560 }}>Customer, Vehicle, and Pricing are locked now that this deal is approved. Only edit if something was entered wrong — it will need Admin approval.</div>
                <button className="btn pri" onClick={() => setEditMode(true)}>Request Edit</button>
              </>
            ) : (
              <>
                <div className="sm" style={{ maxWidth: 560 }}>Editing unlocked. Make your changes below, then submit for Admin approval.</div>
                <div className="flex">
                  <button className="btn" onClick={discardEdits}>Discard changes</button>
                  <button className="btn acc" onClick={requestAmendment} disabled={!coreDirty}>Submit for approval</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Admin Review notice: Admin can only see and approve */}
        {isAdmin && postApproval && (
          <div className="card sm mute" style={{ padding: 10, background: "#F9F8F5" }}>
            <b>Admin Review Mode:</b> As Administrator, you can view all deal specifications and approve pricing, amendments, or payments. Reopening or arbitrary direct editing is reserved for Super Admin.
          </div>
        )}

        {/* Mandatory branch selection */}
        <div className="card stack-s" style={{ borderColor: "#E3B79F" }}>
          <div className="flex between wrapf">
            <div>
              <div className="flex"><span className="tag br">Step 1 · Mandatory</span><span className="h">Dealership branch</span></div>
              <div className="sm mute" style={{ marginTop: 2 }}>Branch options mandatory to select in Sasaram, Bihiya, Buxas, Mohaniya.</div>
            </div>
            <span className="sm">Selected: <b style={{ color: "var(--acc)" }}>{normalizeBranch(d.branch) || "None"}</b></span>
          </div>
          {canTouch ? (
            <div className="seg">
              {BRANCHES.map(b => {
                const on = normalizeBranch(d.branch) === b;
                return (
                  <button key={b} type="button" className={on ? "on" : ""} onClick={() => { if (!on) withLog(prev => ({ ...prev, branch: b }), `Updated branch to "${b}"`); }}>
                    <span>{b}</span>{on ? <CheckCircle2 size={16} color="#D2481B" /> : <span className="ring" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="sub flex"><span className="lbl">Branch:</span><b>{normalizeBranch(d.branch)}</b><span className="sm mute" style={{ marginLeft: "auto" }}>Locked after approval</span></div>
          )}
        </div>

        <Section title="Customer & Company Details" subtitle="Customer details" accent="#3B82C4">
          {CUSTOMER_FIELDS.map(([k, l]) => <Field key={k} label={l} value={coreDraft.customer[k]} onChange={v => editCore("customer", k, v)} onCommit={(o, n) => editCoreCommit("customer", k, o, n)} readOnly={!canTouch} />)}
        </Section>

        <Section title="Vehicle" subtitle="Vehicle details" accent="#3E9B63">
          {VEHICLE_FIELDS.map(([k, l]) => <Field key={k} label={l} value={coreDraft.vehicle[k]} onChange={v => editCore("vehicle", k, v)} onCommit={(o, n) => editCoreCommit("vehicle", k, o, n)} readOnly={!canTouch} />)}
        </Section>

        <Section title="On-road price" subtitle={priceSub} accent="#D2481B">
          {PRICE_ROWS.map(([k, l]) =>
            k === "@otherDiscounts" ? (
              <OtherDiscountsEditor key={k} value={coreDraft.pricing.otherDiscounts} onChange={list => editCore("pricing", "otherDiscounts", list)} onCommit={(o, n) => editCoreCommit("pricing", "otherDiscounts", o, n)} readOnly={!canTouch} />
            ) : k[0] === "=" ? (
              <Field key={k} label={l} prefix="₹" value={c[k.slice(1)].toFixed(0)} readOnly />
            ) : (
              <Field key={k} label={l} prefix="₹" value={coreDraft.pricing[k]} onChange={v => editCore("pricing", k, v)} onCommit={(o, n) => editCoreCommit("pricing", k, o, n)} readOnly={!canTouch} />
            ))}
        </Section>

        {/* Customer payment log */}
        <Card title="Customer payment log" right={canLogPayment && <button className="btn pri xs" onClick={addPayment}><Plus size={14} /> Log payment</button>}>
          {(d.paymentLog || []).length === 0 ? <Empty>No payments logged yet.</Empty> : (
            <div className="tblwrap">
              <table className="tbl">
                <thead><tr>{["Date of receipt", "Mode", "Reference", "Amount", "Entered by", "Status", ""].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {(d.paymentLog || []).map(e => {
                    const st = paymentStatus(e);
                    const src = e.mode === ADMIN_ONLY_PAYMENT_MODE && e.sourceDealId && deals.find(dl => dl.id === e.sourceDealId);
                    return (
                      <tr key={e.id}>
                        <td className="mono">{e.date}</td>
                        <td>{e.mode}{src && <div className="sm mute">from {formatParty(src.customer) || src.id}</div>}</td>
                        <td className="mono">{e.reference || "—"}</td>
                        <td className="mono"><b>{inr(e.amount)}</b></td>
                        <td>{e.enteredBy}</td>
                        <td>
                          {st === "verified" && <span className="ok flex" style={{ fontWeight: 700 }}><CheckCircle2 size={14} /> Verified</span>}
                          {st === "pending" && <span className="warn">Unverified</span>}
                          {st === "rejected" && <span className="bad flex" style={{ fontWeight: 700 }}><XCircle size={14} /> Rejected{e.rejectionReason ? `: ${e.rejectionReason}` : ""}</span>}
                        </td>
                        <td>{isAccounts && st === "pending" && <div className="flex"><button className="lnk ok" onClick={() => verifyPayment(e.id)}>Verify</button><button className="lnk bad" onClick={() => rejectPayment(e.id)}>Reject</button></div>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex wrapf sm" style={{ gap: 18, marginTop: 12 }}>
            <span><span className="mute">Total collected: </span><b>{inr(c.totalCollected)}</b></span>
            {c.approvedAdjustments > 0 && <span><span className="mute">Approved adjustments: </span><b>{inr(c.approvedAdjustments)}</b></span>}
            {c.pendingAdjustments > 0 && <span className="warn">Pending adjustments: <b>{inr(c.pendingAdjustments)}</b></span>}
            <span><span className="mute">Net on-road price: </span><b>{inr(c.netOnRoad)}</b></span>
            <span><span className="mute">Balance: </span><b className={balanceDue ? "warn" : "ok"}>{inr(c.balance)}</b></span>
          </div>
          {(d.adjustments || []).length > 0 && (
            <div className="stack-s" style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
              <div className="lbl">Receipt adjustments</div>
              {d.adjustments.map(a => {
                const [label, color, bg] = ADJ_META[a.status] || ADJ_META.pending;
                return (
                  <div key={a.id} className="ent">
                    <div><b>{inr(a.amount)}</b> <span className="mute">— {a.reason || "no reason given"} · {a.date} · by {a.enteredBy}</span></div>
                    <div className="flex">
                      <Chip color={color} bg={bg}>{label}</Chip>
                      {isAdminOrSuper && a.status === "pending" && <><button className="lnk ok" onClick={() => reviewAdjustment(a.id, true)}>Approve</button><button className="lnk bad" onClick={() => reviewAdjustment(a.id, false)}>Reject</button></>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {canLogPayment && <button className="lnk" style={{ marginTop: 12 }} onClick={addAdjustment}>+ Add receipt adjustment (rounding off, last-minute discount)</button>}
        </Card>

        {/* Requirement 4: Customer Refund log just below Customer payment log */}
        <Card
          title="Customer Refund log"
          right={canLogPayment && <button className="btn pri xs" onClick={addRefund}><Plus size={14} /> Log refund</button>}
        >
          {(d.refundLog || []).length === 0 ? <Empty>No refunds logged yet.</Empty> : (
            <div className="tblwrap">
              <table className="tbl">
                <thead><tr>{["Date of refund", "Refund to / Option", "Mode", "Reference", "Amount", "Entered by", "Status", ""].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {(d.refundLog || []).map(e => {
                    const st = paymentStatus(e);
                    return (
                      <tr key={e.id}>
                        <td className="mono">{e.date}</td>
                        <td>
                          <span
                            className="tag"
                            style={{
                              fontWeight: 700,
                              background: e.refundType === "Body Fabricator" ? "#EBF3FF" : e.refundType === "Retention Amount" ? "#FEF3C7" : "#F3E8FF",
                              color: e.refundType === "Body Fabricator" ? "#1D4ED8" : e.refundType === "Retention Amount" ? "#B45309" : "#6D28D9",
                            }}
                          >
                            {e.refundType || "Customer"}
                          </span>
                          {e.remarks && <div className="sm mute">{e.remarks}</div>}
                        </td>
                        <td>{e.mode}</td>
                        <td className="mono">{e.reference || "—"}</td>
                        <td className="mono"><b className="bad">{inr(e.amount)}</b></td>
                        <td>{e.enteredBy}</td>
                        <td>
                          {st === "verified" && <span className="ok flex" style={{ fontWeight: 700 }}><CheckCircle2 size={14} /> Verified</span>}
                          {st === "pending" && <span className="warn">Unverified</span>}
                          {st === "rejected" && <span className="bad flex" style={{ fontWeight: 700 }}><XCircle size={14} /> Rejected{e.rejectionReason ? `: ${e.rejectionReason}` : ""}</span>}
                        </td>
                        <td>{isAccounts && st === "pending" && <div className="flex"><button className="lnk ok" onClick={() => verifyRefund(e.id)}>Verify</button><button className="lnk bad" onClick={() => rejectRefund(e.id)}>Reject</button></div>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex wrapf sm" style={{ gap: 18, marginTop: 12 }}>
            <span><span className="mute">Total refunded: </span><b className="bad">{inr(c.totalRefunded)}</b></span>
            <span><span className="mute">Net customer collections: </span><b>{inr(c.netCollected)}</b></span>
            <span><span className="mute">Net on-road price: </span><b>{inr(c.netOnRoad)}</b></span>
            <span><span className="mute">Effective balance: </span><b className={balanceDue ? "warn" : "ok"}>{inr(c.balance)}</b></span>
          </div>
        </Card>

        {(isRto || isAdminOrSuper) && (
          <Card title="RTO / Registration expenses" icon={ShieldCheck}>
            <div className="sm mute" style={{ marginBottom: 12 }}>Referenced by chassis no. <b>{chassis || "—"}</b>. Capped at what was collected for each head — going over needs Admin approval.</div>
            <div className="stack-s">
              {EXPENSE_CATEGORIES.map(cat => {
                const cap = num(d.pricing[cat.pricingField]);
                const entries = (d.expenses || []).filter(e => e.category === cat.id);
                const posted = sum(entries.filter(e => e.status === "posted"), e => e.amount);
                const remaining = cap - posted;
                const closed = !!(d.expenseClosed || {})[cat.id];
                return (
                  <div key={cat.id} className={`xp ${closed ? "done" : ""}`}>
                    <div className="flex between wrapf">
                      <div>
                        <div className="flex" style={{ fontWeight: 700 }}>{cat.label}{closed && <Chip color="#25683A" bg="#D9EDDD" icon={CheckCircle2}>Done</Chip>}</div>
                        <div className="sm mute">Collected {inr(cap)} · Spent {inr(posted)} · <span className={remaining < 0 ? "warn" : ""} style={remaining < 0 ? { fontWeight: 700 } : {}}>{remaining < 0 ? `Over by ${inr(-remaining)}` : `Retained ${inr(remaining)}`}</span></div>
                      </div>
                      {isRto && d.status !== STATUS.DRAFT && !closed && (
                        <div className="flex">
                          <button className="btn pri xs" onClick={() => addExpense(cat.id)}><Plus size={13} /> Add expense</button>
                          <button className="btn xs" onClick={() => setCategoryDone(cat.id, true)}>Mark as done</button>
                        </div>
                      )}
                      {isAdminOrSuper && closed && <button className="lnk mu" onClick={() => setCategoryDone(cat.id, false)}>Reopen</button>}
                    </div>
                    {entries.length > 0 && (
                      <div className="stack-s" style={{ marginTop: 8 }}>
                        {entries.map(e => (
                          <div key={e.id} className="ent">
                            <div><b>{inr(e.amount)}</b> <span className="mute">by {e.enteredBy}{e.remarks && ` — ${e.remarks}`}</span></div>
                            <div className="flex">
                              <Chip {...EXPENSE_STATUS_META[e.status]}>{EXPENSE_STATUS_META[e.status].label}</Chip>
                              {isAdminOrSuper && e.status === "pending_approval" && <><button className="lnk ok" onClick={() => reviewExpense(e.id, true)}>Approve</button><button className="lnk bad" onClick={() => reviewExpense(e.id, false)}>Reject</button></>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {(isAdminOrSuper || isAccounts) && (
          <Section title="Office use" subtitle="Admin / Accounts" defaultOpen={false} accent="#7A7468">
            {OFFICE_FIELDS.map(([k, l]) => (
              <Field key={k} label={l} prefix={k !== "remarks" && k !== "bodyFabName" ? "₹" : undefined} value={d.officeUse[k]} onChange={v => set("officeUse", k, v)} onCommit={(o, n) => commitFieldChange("officeUse", k, o, n)} readOnly={d.status === STATUS.CLOSED && !isSuperAdmin} />
            ))}
          </Section>
        )}

        <div className="dock">
          <span className="sm mute">Changes save automatically.</span>
          <div className="flex">
            {preApproval && (
              <>
                {isSales && <button className="btn acc" onClick={submitForApproval}>Submit for approval</button>}
                {isAdminOrSuper && (
                  <button
                    className="btn acc"
                    onClick={() => withLog(p => ({ ...p, status: STATUS.APPROVED, approval: { status: "approved", by: session.name, at: stamp(), remarks: isSuperAdmin ? "Directly approved by Super Admin" : "Directly approved by Admin" } }), isSuperAdmin ? "Pricing approved directly by Super Admin" : "Pricing approved directly by Admin")}
                  >
                    Approve &amp; Activate deal
                  </button>
                )}
              </>
            )}
            {isAdminOrSuper && d.status === STATUS.PENDING && (
              <>
                <button className="btn no" onClick={reject}>Reject</button>
                <button className="btn go" onClick={approve}>Approve pricing</button>
              </>
            )}
            {isAdminOrSuper && d.status === STATUS.APPROVED && (
              <button className="btn pri" onClick={markDelivered}>Mark delivered</button>
            )}
            {isAdminOrSuper && postApproval && (
              <button className="btn go" onClick={closeDeal} disabled={balanceDue} title={balanceDue ? "Balance must be cleared before closing" : ""}>
                Close deal
              </button>
            )}
            {/* Super Admin Reopen Button */}
            {isSuperAdmin && (d.status === STATUS.CLOSED || d.status === STATUS.DELIVERED || d.status === STATUS.APPROVED) && (
              <button className="btn acc" onClick={reopenDeal} title="Reopen deal anytime (Super Admin)">
                <RotateCcw size={14} /> Reopen Deal
              </button>
            )}
            {!isAdminOrSuper && postApproval && !balanceDue && <span className="sm mute">Balance cleared — waiting on Admin to close.</span>}
            {!isAdminOrSuper && d.status === STATUS.DELIVERED && balanceDue && <span className="sm mute">Delivered — balance still pending (e.g. financer payment).</span>}
          </div>
        </div>

        {modal && <ModalForm {...modal} onClose={() => setModal(null)} />}
        {confirmDelete && (
          <ModalForm title="Delete this draft?" message={`This permanently removes deal ${d.id}${chassis ? ` (chassis ${chassis})` : ""}. This can't be undone.`} fields={[]} onSubmit={() => { onDelete(); }} onClose={() => setConfirmDelete(false)} />
        )}
      </div>
    </>
  );
}

/* ====================================================================== */
/*  Deals list                                                             */
/* ====================================================================== */

function DealsList({ deals, session, onOpen, onNew }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [query, setQuery] = useState("");
  const isSales = session?.role === "sales";
  const visibleDeals = isSales ? filterDealsForUser(deals, session) : deals;
  const q = query.trim().toLowerCase();
  const filtered = visibleDeals.filter(d =>
    (statusFilter === "all" || d.status === statusFilter) &&
    (branchFilter === "all" || matchBranch(d.branch, branchFilter)) &&
    (!q || [d.id, d.vehicle?.chassisNo, d.customer?.name, d.customer?.companyName, d.customer?.gstNo, d.vehicle?.model, d.branch].filter(Boolean).some(v => v.toLowerCase().includes(q))));
  return (
    <div className="stack">
      <div className="search">
        <Search size={16} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={isSales ? "Search my deals by customer, company, GST, chassis, model, branch, or deal ID…" : "Search by customer, company, GST, chassis, model, branch, or deal ID…"}
        />
      </div>
      <div className="flex between wrapf">
        <div className="flex wrapf">
          <Filter size={16} color="#7A7468" />
          <select className="sel" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="sel" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
            <option value="all">All branches</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          {isSales && (
            <span className="tag" style={{ background: "#E8F0FE", color: "#1967D2", fontWeight: 700, padding: "5px 10px" }}>
              My Deals ({filtered.length} of {visibleDeals.length})
            </span>
          )}
        </div>
        {onNew && (session.role === "sales" || session.role === "admin" || session.role === "superadmin") && <button className="btn acc" onClick={onNew}><Plus size={15} /> New deal</button>}
      </div>
      {filtered.length === 0 ? <div className="center">{isSales ? "You have no deals matching these filters yet." : "No deals match these filters yet."}</div> : (
        <div className="stack-s">
          {filtered.slice().reverse().map(d => {
            const c = calc(d);
            return (
              <button key={d.id} className="row" style={{ "--c": STATUS_META[d.status]?.color }} onClick={() => onOpen(d.id)}>
                <div className="min">
                  <div className="rt">
                    <b>{formatParty(d.customer)}</b>
                    {d.customer?.gstNo && <span className="tag mono">GST: {d.customer.gstNo}</span>}
                    <span className="sm mute">{d.vehicle.model || "No model set"}</span>
                  </div>
                  <div className="rs">
                    <span className="tag br">{normalizeBranch(d.branch)}</span>
                    <span className="mono">{d.id}</span>
                    {d.vehicle.chassisNo && <span>· Chassis <span className="mono">{d.vehicle.chassisNo}</span></span>}
                    <span>· Net {inr(c.netOnRoad)} · Balance {inr(c.balance)}</span>
                    {c.totalRefunded > 0 && <span className="bad">· Refunded {inr(c.totalRefunded)}</span>}
                  </div>
                </div>
                <div className="flex"><StatusBadge status={d.status} /><ChevronRight size={16} color="#B8B1A2" /></div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ====================================================================== */
/*  Approvals (Admin / Super Admin) · Payments to verify · Audit trail    */
/* ====================================================================== */

function Queue({ title, items, onOpen }) {
  return (
    <div className="card">
      <div className="h" style={{ marginBottom: 10 }}>{title}</div>
      {items.length === 0 ? <Empty>Nothing pending.</Empty> : (
        <div className="stack-s">
          {items.map(i => (
            <button key={i.key} className="qrow" onClick={() => onOpen(i.dealId)}>
              <div><div style={{ fontWeight: 600 }}>{i.title}</div><div className="sm mute">{i.sub}</div></div>
              <ChevronRight size={16} color="#B8B1A2" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Approvals({ deals, onOpen }) {
  const queues = [
    ["Pricing awaiting approval", deals.filter(d => d.status === STATUS.PENDING).map(d => ({
      key: d.id, dealId: d.id,
      title: <>{formatParty(d.customer)} <span className="sm mute" style={{ fontWeight: 400 }}>{d.vehicle.model}</span></>,
      sub: `${normalizeBranch(d.branch)} · ${d.id}${d.vehicle.chassisNo ? ` · Chassis ${d.vehicle.chassisNo}` : ""}`,
    }))],
    ["Field changes awaiting approval", flat(deals, "amendments", a => a.status === "pending").map(a => ({
      key: a.id, dealId: a.dealId, title: `${a.changes.length} field change(s) — ${a.customer || "Untitled"}`, sub: `${dealSub(a)} · requested by ${a.requestedBy}`,
    }))],
    ["Expenses over receipt — awaiting approval", flat(deals, "expenses", e => e.status === "pending_approval").map(e => ({
      key: e.id, dealId: e.dealId, title: `${EXPENSE_CATEGORIES.find(c => c.id === e.category)?.label} — ${inr(e.amount)}`,
      sub: `${e.customer} · ${e.branch}${e.chassis ? ` · Chassis ${e.chassis}` : ""} · by ${e.enteredBy}`,
    }))],
    ["Receipt adjustments awaiting approval", flat(deals, "adjustments", a => a.status === "pending").map(a => ({
      key: a.id, dealId: a.dealId, title: `${inr(a.amount)} — ${a.customer || "Untitled"}`, sub: `${dealSub(a)} · ${a.reason || "no reason given"} · by ${a.enteredBy}`,
    }))],
  ];
  return <div className="stack">{queues.map(([title, items]) => <Queue key={title} title={title} items={items} onOpen={onOpen} />)}</div>;
}

function PaymentsToVerify({ deals, onVerify, onReject, onOpen }) {
  const [rejectModal, setRejectModal] = useState(null);
  const pending = flat(deals, "paymentLog", e => paymentStatus(e) === "pending").sort((a, b) => new Date(a.date) - new Date(b.date));
  return (
    <div className="stack">
      <div className="card">
        <div className="h" style={{ marginBottom: 10 }}>Payments awaiting verification</div>
        {pending.length === 0 ? <div className="center" style={{ padding: "32px 0", fontStyle: "italic" }}>Nothing pending.</div> : (
          <div className="stack-s">
            {pending.map(e => (
              <div key={e.id} className="qrow" style={{ cursor: "default", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{inr(e.amount)} via {e.mode} — {e.customer || "Untitled customer"}</div>
                  <div className="sm mute">{e.branch}{e.chassis && ` · Chassis ${e.chassis}`} · received {e.date} · entered by {e.enteredBy}{e.reference ? ` · Ref ${e.reference}` : ""}</div>
                </div>
                <div className="flex">
                  <button className="lnk mu" onClick={() => onOpen(e.dealId)}>View deal</button>
                  <button className="btn go xs" onClick={() => onVerify(e.dealId, e.id)}>Verify</button>
                  <button className="btn no xs" onClick={() => setRejectModal({ dealId: e.dealId, paymentId: e.id, entry: e })}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {rejectModal && (
        <ModalForm title="Reject this payment" message={`${inr(rejectModal.entry.amount)} via ${rejectModal.entry.mode}, received ${rejectModal.entry.date}`}
          fields={[{ name: "reason", label: "Reason (e.g. cheque bounced, amount mismatch)", autoFocus: true }]}
          onSubmit={v => { onReject(rejectModal.dealId, rejectModal.paymentId, v.reason || ""); }} onClose={() => setRejectModal(null)} />
      )}
    </div>
  );
}

function AuditTrail({ deals, onOpen }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const entries = flat(deals, "activity").sort((a, b) => new Date(b.at) - new Date(a.at));
  const filtered = q ? entries.filter(e => [e.dealId, e.chassis, e.customer, e.by, e.note].filter(Boolean).some(v => v.toLowerCase().includes(q))) : entries;
  return (
    <div className="stack">
      <div className="search">
        <Search size={16} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by chassis number, customer, deal ID, or who made the change…" />
      </div>
      <div className="card">
        {filtered.length === 0 ? <div className="center" style={{ padding: "32px 0", fontStyle: "italic" }}>No activity to show.</div> : (
          <div className="stack-s" style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 4 }}>
            {filtered.map((e, i) => (
              <button key={i} className="qrow" style={{ display: "block" }} onClick={() => onOpen(e.dealId)}>
                <div className="flex between wrapf sm mute">
                  <span>{new Date(e.at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="mono">{e.dealId}{e.chassis && ` · Chassis ${e.chassis}`}</span>
                </div>
                <div style={{ margin: "3px 0" }}><b>{e.by}</b> <span className="mute">({e.role})</span> — {e.note}</div>
                <div className="sm mute">{e.customer || "Untitled customer"} · {e.branch}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ====================================================================== */
/*  New deal modal (branch is the mandatory first step)                    */
/* ====================================================================== */

function NewDealModal({ isOpen, onClose, onCreate, session }) {
  const initBranch = () => normalizeBranch(session?.branch) || "Sasaram";
  const [branch, setBranch] = useState(initBranch);
  const [f, setF] = useState({ companyName: "", gstNo: "", name: "", mobile: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) { setBranch(initBranch()); setF({ companyName: "", gstNo: "", name: "", mobile: "" }); setError(""); }
  }, [isOpen, session]);
  if (!isOpen) return null;

  const submit = e => {
    e.preventDefault();
    if (!branch) return setError("Please select a mandatory dealership branch.");
    onCreate(branch, { companyName: f.companyName.trim(), gstNo: f.gstNo.trim().toUpperCase(), name: f.name.trim(), mobile: f.mobile.trim() });
  };
  const input = (key, label, placeholder, extra = {}) => (
    <label className="fld">
      <span className="lbl">{label}</span>
      <span className="inp"><input type="text" autoComplete="off" value={f[key]} placeholder={placeholder} {...extra} onChange={e => setF(s => ({ ...s, [key]: extra.upper ? e.target.value.toUpperCase() : e.target.value }))} /></span>
    </label>
  );

  return (
    <div className="scrim">
      <div className="modal lg">
        <div className="mhead">
          <div className="flex" style={{ gap: 14 }}>
            <img
              src="/punya-logo.png"
              alt="Punya Autowheels Pvt. Ltd."
              style={{ height: 42, width: "auto", objectFit: "contain", background: "#fff", padding: "2px 6px", borderRadius: 6 }}
            />
            <div>
              <div className="flex sm" style={{ color: "#E8A58A", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700 }}>
                Punya Autowheels Pvt. Ltd. · New Deal
              </div>
              <div className="h" style={{ fontSize: 22, marginTop: 2 }}>Initialize Deal Sheet</div>
              <div className="sm" style={{ color: "#A9A293" }}>Select mandatory dealership branch (Sasaram, Bihiya, Buxas, Mohaniya).</div>
            </div>
          </div>
          <button type="button" onClick={onClose}><XCircle size={20} /></button>
        </div>
        <form className="mbody stack" onSubmit={submit} autoComplete="off">
          {error && <Banner kind="bad">{error}</Banner>}
          <div className="stack-s">
            <div className="flex between"><span className="lbl" style={{ color: "var(--ink)" }}>1. Dealership branch <span className="bad">* mandatory</span></span></div>
            <div className="seg">
              {BRANCHES.map(b => (
                <button key={b} type="button" className={branch === b ? "on" : ""} onClick={() => { setBranch(b); setError(""); }}>
                  <span><b style={{ display: "block" }}>{b}</b><span className="sm mute" style={{ fontWeight: 500 }}>{BRANCH_SUB[b]}</span></span>
                  {branch === b ? <CheckCircle2 size={18} color="#D2481B" /> : <span className="ring" />}
                </button>
              ))}
            </div>
          </div>
          <div className="stack-s" style={{ paddingTop: 12, borderTop: "1px solid var(--line)" }}>
            <div className="flex between"><span className="lbl" style={{ color: "var(--ink)" }}>2. Company name &amp; customer info</span><span className="sm mute">Can also edit in deal editor</span></div>
            <div className="two">
              {input("companyName", "Company Name", "Company / Firm name")}
              {input("gstNo", "GST No. (Optional)", "15-digit GSTIN", { upper: true, className: "mono" })}
              {input("name", "Customer / Contact Name", "Full contact name")}
              {input("mobile", "Mobile Number", "10-digit mobile number")}
            </div>
          </div>
          <div className="flex" style={{ justifyContent: "flex-end", paddingTop: 12, borderTop: "1px solid var(--line)" }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn acc" disabled={!branch}>Create Deal &amp; Open <ChevronRight size={15} /></button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ====================================================================== */
/*  App shell                                                              */
/* ====================================================================== */

const ROLE_TABS = {
  superadmin: [["list", "All Deals", ClipboardCheck], ["approvals", "Approvals", ShieldCheck], ["toverify", "To Verify", CheckCircle2], ["reports", "Reports", BarChart3], ["audit", "Audit Trail", FileText], ["users", "User Management", Users]],
  admin: [["list", "All Deals", ClipboardCheck], ["approvals", "Approvals", ShieldCheck], ["toverify", "To Verify", CheckCircle2], ["reports", "Reports", BarChart3], ["audit", "Audit Trail", FileText], ["users", "User Management", Users]],
  sales: [["list", "My Deals", ClipboardCheck], ["reports", "My Reports", BarChart3]],
  accounts: [["toverify", "Payments To Verify", CheckCircle2], ["list", "Deals Ledger", ClipboardCheck], ["reports", "Financial Reports", BarChart3]],
  rto: [["list", "RTO & Compliance Deals", ClipboardCheck]],
};
const getCacheKey = s => (s ? `sales_erp_deals_cache_${s.id || s.username || s.role}` : "sales_erp_deals_cache");

export default function App() {
  const [session, setSession] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("list");
  const [openId, setOpenId] = useState(null);
  const [newDealModalOpen, setNewDealModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) { const data = await res.json(); if (data.user) setSession(data.user); }
      } catch (err) { console.warn("Session check error:", err); }
      finally { setAuthChecking(false); }
    })();
  }, []);

  const cacheDeals = (list, s = session) => {
    try { localStorage.setItem(getCacheKey(s), JSON.stringify(list)); } catch { }
  };

  const fetchDealsFromServer = async s => {
    const currentSession = s || session;
    setLoading(true);
    try {
      const res = await fetch("/api/deals");
      if (res.ok) {
        const data = await res.json();
        if (data.deals) {
          setDeals(data.deals);
          cacheDeals(data.deals, currentSession);
          setLoading(false);
          return;
        }
      }
    } catch (e) { console.warn("Failed to fetch deals from server, loading cached:", e); }
    try {
      const cached = localStorage.getItem(getCacheKey(currentSession));
      if (cached) setDeals(JSON.parse(cached));
    } catch { }
    setLoading(false);
  };

  useEffect(() => {
    if (!session) return;
    setOpenId(null);
    setTab(session.role === "accounts" ? "toverify" : "list");
    fetchDealsFromServer(session);
  }, [session]);

  const persist = async next => {
    setDeals(next);
    cacheDeals(next, session);
    try {
      await fetch("/api/deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deals: next }) });
    } catch (err) { console.error("Failed to sync deals to server:", err); }
  };

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch { }
    setSession(null);
    setOpenId(null);
  };

  const handleCreateDealWithDetails = (branch, customerDetails) => {
    const d = newDeal(branch, session, customerDetails);
    persist([...deals, d]);
    setOpenId(d.id);
    setNewDealModalOpen(false);
  };
  const handleUpdateDeal = (id, fn) => { if (deals.some(x => x.id === id)) persist(deals.map(x => (x.id === id ? fn(x) : x))); };
  const handleDeleteDeal = async id => {
    persist(deals.filter(x => x.id !== id));
    setOpenId(null);
    try {
      await fetch(`/api/deals?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete deal from server:", err);
    }
  };

  const paymentUpdate = (dealId, paymentId, patch, noteFn) =>
    handleUpdateDeal(dealId, p => {
      const entry = (p.paymentLog || []).find(e => e.id === paymentId);
      return { ...patchIn("paymentLog", paymentId, patch)(p), activity: [...(p.activity || []), logEntry(session.name, session.role, noteFn(entry ? inr(entry.amount) + " via " + entry.mode : ""))] };
    });
  const verifyPaymentFor = (dealId, paymentId) => paymentUpdate(dealId, paymentId, { status: "verified", verifiedBy: session.name }, l => `Verified payment ${l}`);
  const rejectPaymentFor = (dealId, paymentId, reason) => paymentUpdate(dealId, paymentId, { status: "rejected", rejectedBy: session.name, rejectionReason: reason }, l => `Rejected payment ${l}${reason ? ": " + reason : ""}`);

  if (authChecking) {
    return (
      <div className="erp" style={{ display: "grid", placeItems: "center", background: "#191714", color: "#A9A293" }}>
        <style>{CSS}</style>
        <div style={{ textAlign: "center" }}>
          <img
            src="/punya-logo.png"
            alt="Punya Autowheels Pvt. Ltd."
            style={{ height: 48, width: "auto", margin: "0 auto 16px", background: "#fff", padding: "4px 8px", borderRadius: 8 }}
          />
          <div className="spin" />
          <div className="mono sm">Initializing Punya Autowheels Pvt. Ltd. ERP Workspace…</div>
        </div>
      </div>
    );
  }
  if (!session) return <LoginPage onLoginSuccess={setSession} />;

  const isSuperAdmin = session.role === "superadmin";
  const isAdmin = session.role === "admin";
  const isAdminOrSuper = isAdmin || isSuperAdmin;
  const isSales = session.role === "sales";
  const userDeals = isSales ? filterDealsForUser(deals, session) : deals;
  const openDeal = deals.find(d => d.id === openId);
  const isAuthorizedForDeal = openDeal ? (isSales ? isDealForUser(openDeal, session) : true) : false;
  const roleMeta = ROLES.find(r => r.id === session.role) || { label: session.role, color: "#D2481B" };
  const roleTabs = ROLE_TABS[session.role] || [];
  const canCreate = isSales || isAdminOrSuper;
  const jumpToDeal = id => { setOpenId(id); setTab("list"); };

  let body;
  if (loading) body = <div className="center"><div className="spin" />Loading records…</div>;
  else if (openDeal) {
    if (!isAuthorizedForDeal) {
      body = (
        <div className="card center stack" style={{ padding: 40 }}>
          <AlertTriangle size={36} color="#A8281F" style={{ margin: "0 auto" }} />
          <div className="h" style={{ fontSize: 18 }}>Access Restricted</div>
          <div className="sm mute">You only have permission to view and edit your own sales deals.</div>
          <div style={{ marginTop: 12 }}>
            <button className="btn pri" onClick={() => setOpenId(null)}>
              <ArrowLeft size={14} /> Back to My Deals
            </button>
          </div>
        </div>
      );
    } else {
      body = <DealEditor deal={openDeal} deals={deals} session={session} onUpdate={fn => handleUpdateDeal(openDeal.id, fn)} onBack={() => setOpenId(null)} onDelete={() => handleDeleteDeal(openDeal.id)} />;
    }
  }
  else if (tab === "users" && isAdminOrSuper) body = <UserManagement currentAdmin={session} />;
  else if (tab === "list") body = <DealsList deals={userDeals} session={session} onOpen={setOpenId} onNew={canCreate ? () => setNewDealModalOpen(true) : undefined} />;
  else if (tab === "reports") body = <ReportsDashboard deals={userDeals} session={session} onOpen={setOpenId} />;
  else if (tab === "approvals" && isAdminOrSuper) body = <Approvals deals={deals} onOpen={jumpToDeal} />;
  else if (tab === "toverify") body = <PaymentsToVerify deals={deals} onVerify={verifyPaymentFor} onReject={rejectPaymentFor} onOpen={jumpToDeal} />;
  else if (tab === "audit" && isAdminOrSuper) body = <AuditTrail deals={deals} onOpen={jumpToDeal} />;
  else body = <div className="center">Please select an authorized tab.</div>;

  return (
    <div className="erp">
      <style>{CSS}</style>

      {/* Header with actual Punya Autowheels logo and official company name */}
      <header className="top">
        <div className="flex" style={{ gap: 12 }}>
          <img
            src="/punya-logo.png"
            alt="Punya Autowheels Pvt. Ltd."
            style={{
              height: 38,
              width: "auto",
              maxHeight: 38,
              objectFit: "contain",
              background: "#fff",
              padding: "2px 6px",
              borderRadius: 8,
              border: "1px solid #3A362F",
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            }}
          />
          <div className="flex" style={{ gap: 8 }}>
            <span className="brand disp">PUNYA AUTOWHEELS PVT. LTD.</span>
            <span className="env">ERP</span>
          </div>
        </div>
        <div className="flex" style={{ gap: 14 }}>
          <div className="who">
            <div style={{ fontWeight: 600 }}>{session.name}</div>
            <small><span className="dot" style={{ background: roleMeta.color }} />{roleMeta.label} · {normalizeBranch(session.branch)}</small>
          </div>
          <button className="out" onClick={handleLogout}><LogOut size={14} /> Logout</button>
        </div>
      </header>

      {!openDeal && (
        <nav className="tabs">
          {roleTabs.map(([id, label, Icon]) => (
            <button key={id} className={`tab ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}><Icon size={16} /> {label}</button>
          ))}
          <button className="tab" style={{ marginLeft: "auto", fontSize: 12, fontWeight: 500 }} onClick={fetchDealsFromServer}><RefreshCw size={14} /> Refresh</button>
        </nav>
      )}

      <main className="wrap">{body}</main>

      <NewDealModal isOpen={newDealModalOpen} onClose={() => setNewDealModalOpen(false)} onCreate={handleCreateDealWithDetails} session={session} />
    </div>
  );
}
