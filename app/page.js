"use client";

import React, { useState, useEffect, useRef } from "react";
import { Truck, ClipboardCheck, Wallet, BarChart3, Plus, ChevronRight, ChevronDown, CheckCircle2, XCircle, Clock, PackageCheck, ArrowLeft, LogOut, AlertTriangle, FileText, Filter, RefreshCw, Search, ShieldCheck, HandCoins, Lock, Users } from "lucide-react";
import LoginPage from "@/components/LoginPage";
import UserManagement from "@/components/UserManagement";

/* ---------------------------------------------------------------------- */
/*  Constants                                                              */
/* ---------------------------------------------------------------------- */

const BRANCHES = ["Sasaram (Rohtas)", "Bihiya (Bhojpur)", "Other"];
const ROLES = [{
  id: "sales",
  label: "Sales",
  desc: "Create deals, quote pricing, log receipts",
  color: "#1B4F9C"
}, {
  id: "admin",
  label: "Admin",
  desc: "Approve pricing & overages, close deals",
  color: "#B5461C"
}, {
  id: "accounts",
  label: "Accounts",
  desc: "Verify payments, office-use fields",
  color: "#1E7A4C"
}, {
  id: "rto",
  label: "RTO / Registration",
  desc: "Feed insurance/HSRP/TR/registration spend",
  color: "#7C3AED"
}, {
  id: "claims",
  label: "Claims",
  desc: "Track TML discount claims & receipts",
  color: "#B45309"
}];
const STATUS = {
  DRAFT: "draft",
  PENDING: "pending_approval",
  REJECTED: "rejected",
  APPROVED: "approved",
  DELIVERED: "delivered",
  CLOSED: "closed"
};
const STATUS_META = {
  [STATUS.DRAFT]: {
    label: "Draft",
    color: "#6B7280",
    bg: "#F1F2F4",
    icon: FileText
  },
  [STATUS.PENDING]: {
    label: "Pending Approval",
    color: "#B5461C",
    bg: "#FBEAE0",
    icon: Clock
  },
  [STATUS.REJECTED]: {
    label: "Rejected",
    color: "#B91C1C",
    bg: "#FDE8E8",
    icon: XCircle
  },
  [STATUS.APPROVED]: {
    label: "Approved · Collecting Payment",
    color: "#1B4F9C",
    bg: "#E7EEF9",
    icon: Wallet
  },
  [STATUS.DELIVERED]: {
    label: "Delivered",
    color: "#7C3AED",
    bg: "#EDE6FB",
    icon: PackageCheck
  },
  [STATUS.CLOSED]: {
    label: "Closed",
    color: "#1E7A4C",
    bg: "#E4F3EA",
    icon: Lock
  }
};
const EXPENSE_CATEGORIES = [{
  id: "insurance",
  label: "Insurance",
  pricingField: "insurance"
}, {
  id: "hsrp",
  label: "Choice No + HSRP",
  pricingField: "choiceHsrp"
}, {
  id: "tr",
  label: "Temporary Registration",
  pricingField: "tr"
}, {
  id: "registration",
  label: "Registration",
  pricingField: "registration"
}];
const EXPENSE_STATUS_META = {
  posted: {
    label: "Posted",
    color: "#1E7A4C",
    bg: "#E4F3EA"
  },
  pending_approval: {
    label: "Awaiting Admin approval",
    color: "#B5461C",
    bg: "#FBEAE0"
  },
  rejected: {
    label: "Rejected",
    color: "#B91C1C",
    bg: "#FDE8E8"
  }
};
const STORAGE_KEY = "termsheet-flow-demo-v1";
const PAYMENT_MODES = ["Cash", "Cheque", "NEFT/RTGS", "Financer Disbursement", "Exchange Vehicle"];
const ADMIN_ONLY_PAYMENT_MODE = "Advance Adjustment";
const emptyCustomer = () => ({
  name: "",
  soWo: "",
  dob: "",
  pan: "",
  aadhar: "",
  mobile: "",
  address: "",
  po: "",
  ps: "",
  district: "",
  pin: "",
  state: ""
});
const emptyVehicle = () => ({
  model: "",
  colour: "",
  bodyType: "",
  chassisNo: "",
  engineNo: "",
  fuelType: "",
  dod: "",
  dse: "",
  dsm: "",
  financerName: "",
  rto: ""
});
const emptyPricing = () => ({
  exshowroom: "",
  tmlDiscount: "",
  dealerDiscount: "",
  vasNfaDiscount: "",
  otherDiscounts: [],
  tcs: "",
  tr: "",
  insurance: "",
  registration: "",
  permit: "",
  fleetedgeVltd: "",
  vasAmc: "",
  bodyFabCharge: "",
  choiceHsrp: "",
  transportation: "",
  exchangeBonus: ""
});
const emptyOfficeUse = () => ({
  remarks: "",
  bodyFabName: "",
  interestCost: "",
  retentionVehicle: "",
  retentionBody: "",
  retentionVas: "",
  retentionOthers: ""
});
function newDeal(branch, actor) {
  const id = "D" + Date.now().toString(36).toUpperCase();
  return {
    id,
    branch,
    status: STATUS.DRAFT,
    createdBy: actor.name,
    createdAt: new Date().toISOString(),
    customer: emptyCustomer(),
    vehicle: emptyVehicle(),
    pricing: emptyPricing(),
    officeUse: emptyOfficeUse(),
    approval: {
      status: STATUS.DRAFT,
      by: "",
      at: "",
      remarks: ""
    },
    paymentLog: [],
    expenses: [],
    claim: null,
    amendments: [],
    adjustments: [],
    expenseClosed: {
      insurance: false,
      hsrp: false,
      tr: false,
      registration: false
    },
    activity: [{
      at: new Date().toISOString(),
      by: actor.name,
      role: actor.role,
      note: "Deal created"
    }]
  };
}
const num = v => isNaN(parseFloat(v)) ? 0 : parseFloat(v);
const inr = v => "₹" + Math.round(num(v)).toLocaleString("en-IN");

// Human-readable value for audit-log entries.
function describe(v) {
  if (Array.isArray(v)) {
    const total = v.reduce((s, o) => s + num(o.amount), 0);
    return v.length ? `${v.length} line(s) totaling ${inr(total)}` : "none";
  }
  if (v === "" || v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}
function describeChanges(changes) {
  return changes.map(ch => `${ch.section}.${ch.field}: ${describe(ch.oldValue)} → ${describe(ch.newValue)}`).join("; ");
}

// Backward/forward-compatible: older entries only had a `verified` boolean.
function paymentStatus(e) {
  if (e.status) return e.status;
  return e.verified ? "verified" : "pending";
}
function calc(deal) {
  const p = deal.pricing;
  const otherDiscountsTotal = (p.otherDiscounts || []).reduce((s, o) => s + num(o.amount), 0);
  const claimableOtherDiscounts = (p.otherDiscounts || []).filter(o => o.claimable).reduce((s, o) => s + num(o.amount), 0);
  const netPrice = num(p.exshowroom) - num(p.tmlDiscount) - num(p.dealerDiscount) - num(p.vasNfaDiscount) - otherDiscountsTotal;
  const adds = ["tcs", "tr", "insurance", "registration", "permit", "fleetedgeVltd", "vasAmc", "bodyFabCharge", "choiceHsrp", "transportation"].reduce((s, k) => s + num(p[k]), 0);
  const totalOnRoad = netPrice + adds;
  const netOnRoad = totalOnRoad - num(p.exchangeBonus);
  // All money received is tracked in the dated payment log now — nothing else feeds "collected".
  // A rejected entry (e.g. cheque bounced) never counted as money in hand.
  const totalCollected = (deal.paymentLog || []).filter(e => paymentStatus(e) !== "rejected").reduce((s, e) => s + num(e.amount), 0);
  // Last-moment receipt adjustments (rounding off, final discount) only count once Admin approves them.
  const approvedAdjustments = (deal.adjustments || []).filter(a => a.status === "approved").reduce((s, a) => s + num(a.amount), 0);
  const pendingAdjustments = (deal.adjustments || []).filter(a => a.status === "pending").reduce((s, a) => s + num(a.amount), 0);
  const balance = netOnRoad - totalCollected - approvedAdjustments;
  // Dealer Discount is the dealer's own cost and is not claimable. TML Cash Discount and
  // VAS/NFA Discount are always claimable. "Other" discounts are claimable per-line, as chosen.
  const claimableDiscount = num(p.tmlDiscount) + num(p.vasNfaDiscount) + claimableOtherDiscounts;
  return {
    netPrice,
    totalOnRoad,
    netOnRoad,
    totalCollected,
    approvedAdjustments,
    pendingAdjustments,
    balance,
    claimableDiscount,
    otherDiscountsTotal
  };
}
function expenseCap(deal, category) {
  const field = EXPENSE_CATEGORIES.find(c => c.id === category)?.pricingField;
  return field ? num(deal.pricing[field]) : 0;
}
function postedSpend(expenses, category, excludeId = null) {
  return (expenses || []).filter(e => e.category === category && e.status === "posted" && e.id !== excludeId).reduce((s, e) => s + num(e.amount), 0);
}
function calcClaim(claim) {
  if (!claim) return null;
  const receiptsTotal = (claim.receipts || []).reduce((s, r) => s + num(r.amount), 0);
  const totalReceived = num(claim.upfrontReceived) + receiptsTotal;
  const balance = num(claim.claimedAmount) - totalReceived;
  return {
    receiptsTotal,
    totalReceived,
    balance
  };
}

// "Pending for claim" until the Claims team settles it (claim closed, or fully received).
function claimStatus(deal) {
  const c = calc(deal);
  if (c.claimableDiscount <= 0) return "none";
  if (!deal.claim) return "pending";
  return deal.claim.status === "closed" ? "settled" : "pending";
}
function claimPendingAmount(deal) {
  const c = calc(deal);
  if (c.claimableDiscount <= 0 || deal.claim && deal.claim.status === "closed") return 0;
  if (!deal.claim) return c.claimableDiscount;
  const cc = calcClaim(deal.claim);
  return Math.max(0, cc.balance);
}

// Advance-adjustment support: money already collected on another deal beyond
// what that deal actually needs, available to credit toward this one — Admin only.
function advanceAdjustedOut(deals, sourceDealId, excludeEntryId = null) {
  let total = 0;
  deals.forEach(dl => (dl.paymentLog || []).forEach(e => {
    if (e.mode === ADMIN_ONLY_PAYMENT_MODE && e.sourceDealId === sourceDealId && e.id !== excludeEntryId) total += num(e.amount);
  }));
  return total;
}
function availableAdvance(deals, sourceDeal, excludeEntryId = null) {
  const c = calc(sourceDeal);
  const overpaid = Math.max(0, c.totalCollected - c.netOnRoad);
  const used = advanceAdjustedOut(deals, sourceDeal.id, excludeEntryId);
  return Math.max(0, overpaid - used);
}

/* ---------------------------------------------------------------------- */
/*  Primitives                                                             */
/* ---------------------------------------------------------------------- */

function Field({
  label,
  value,
  onChange,
  readOnly,
  prefix,
  onCommit
}) {
  const startRef = useRef(value);
  return /*#__PURE__*/React.createElement("label", {
    className: "flex flex-col gap-1 text-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs uppercase tracking-wide text-slate-500 font-semibold"
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center border border-slate-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-700/40 focus-within:border-blue-700"
  }, prefix && /*#__PURE__*/React.createElement("span", {
    className: "pl-2 text-slate-400 text-sm"
  }, prefix), /*#__PURE__*/React.createElement("input", {
    value: value ?? "",
    readOnly: readOnly,
    onFocus: () => {
      startRef.current = value;
    },
    onChange: e => onChange && onChange(e.target.value),
    onBlur: () => {
      if (onCommit && startRef.current !== value) onCommit(startRef.current, value);
    },
    className: `w-full px-2 py-1.5 rounded-md outline-none text-slate-800 ${readOnly ? "bg-slate-50 text-slate-500" : ""}`
  })));
}
function Section({
  title,
  subtitle,
  children,
  defaultOpen = true,
  accent = "#1B4F9C"
}) {
  const [open, setOpen] = useState(defaultOpen);
  return /*#__PURE__*/React.createElement("div", {
    className: "border border-slate-200 rounded-lg overflow-hidden bg-white"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(!open),
    className: "w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-left"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-slate-800",
    style: {
      fontFamily: "'Barlow Condensed', sans-serif",
      fontSize: "17px",
      letterSpacing: "0.02em"
    }
  }, title.toUpperCase()), subtitle && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500"
  }, subtitle)), /*#__PURE__*/React.createElement(ChevronDown, {
    className: `w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`,
    style: {
      color: accent
    }
  })), open && /*#__PURE__*/React.createElement("div", {
    className: "p-4 grid grid-cols-2 md:grid-cols-3 gap-3"
  }, children));
}
function StatusBadge({
  status
}) {
  const m = STATUS_META[status] || STATUS_META.draft;
  const Icon = m.icon;
  return /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
    style: {
      background: m.bg,
      color: m.color
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    className: "w-3.5 h-3.5"
  }), " ", m.label);
}
function Banner({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-md p-2.5 flex items-start gap-2"
  }, /*#__PURE__*/React.createElement(AlertTriangle, {
    className: "w-4 h-4 mt-0.5 shrink-0"
  }), children);
}

// In-app popup form — used instead of window.prompt()/alert(), which browsers
// commonly block inside sandboxed preview frames like this one.
function ModalForm({
  title,
  message,
  fields,
  onClose,
  onSubmit
}) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map(f => [f.name, f.defaultValue ?? ""])));
  const [error, setError] = useState("");
  const visibleFields = fields.filter(f => !f.showIf || f.showIf(values));
  const submit = () => {
    const err = onSubmit(values);
    if (err) setError(err); else onClose();
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-lg shadow-xl w-full max-w-sm p-4 space-y-3 overflow-y-auto",
    style: {
      maxHeight: "90vh"
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-slate-800 text-lg",
    style: {
      fontFamily: "'Barlow Condensed', sans-serif"
    }
  }, title), message && /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-600"
  }, message), visibleFields.map(f => /*#__PURE__*/React.createElement("label", {
    key: f.name,
    className: "flex flex-col gap-1 text-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs uppercase tracking-wide text-slate-500 font-semibold"
  }, f.label), f.type === "select" ? /*#__PURE__*/React.createElement("select", {
    value: values[f.name],
    onChange: e => setValues(v => ({
      ...v,
      [f.name]: e.target.value
    })),
    className: "border border-slate-300 rounded-md px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-700/40"
  }, f.options.length === 0 && /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "None available"), f.options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, f.optionLabels?.[o] || o))) : /*#__PURE__*/React.createElement("input", {
    autoFocus: f.autoFocus,
    type: f.type === "number" ? "number" : f.type === "date" ? "date" : "text",
    value: values[f.name],
    onChange: e => setValues(v => ({
      ...v,
      [f.name]: e.target.value
    })),
    onKeyDown: e => {
      if (e.key === "Enter") submit();
    },
    className: "border border-slate-300 rounded-md px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-700/40"
  }))), error && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-red-700 bg-red-50 border border-red-200 rounded-md p-2"
  }, error), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2 pt-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "text-sm font-semibold text-slate-600 px-3 py-1.5 rounded-md hover:bg-slate-100"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: submit,
    className: "text-sm font-semibold text-white bg-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-800"
  }, "Confirm"))));
}

/* ---------------------------------------------------------------------- */
/*  Sign-in (demo identity — not real auth)                                */
/* ---------------------------------------------------------------------- */

function SignIn({
  onSignIn
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState(null);
  const [branch, setBranch] = useState(BRANCHES[0]);
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen overflow-y-auto bg-slate-900 p-6 flex justify-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-md py-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center mb-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-flex items-center gap-2 text-white mb-1"
  }, /*#__PURE__*/React.createElement(Truck, {
    className: "w-7 h-7 text-amber-400"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Barlow Condensed', sans-serif"
    },
    className: "text-3xl font-bold tracking-tight"
  }, "PUNYA AUTOWHEELS")), /*#__PURE__*/React.createElement("div", {
    className: "text-slate-400 text-sm tracking-wide"
  }, "Flow-validation demo — not the deployed app")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-2xl p-6 space-y-5"
  }, /*#__PURE__*/React.createElement(Banner, null, "This is a demo to agree on the workflow. It runs in your browser only — nothing here is the real secured login you'll deploy."), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-xs uppercase tracking-wide text-slate-500 font-semibold"
  }, "Your name"), /*#__PURE__*/React.createElement("input", {
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "e.g. Ravi Kumar",
    className: "mt-1 w-full border border-slate-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-700/40 focus:border-blue-700"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-xs uppercase tracking-wide text-slate-500 font-semibold"
  }, "Branch"), /*#__PURE__*/React.createElement("select", {
    value: branch,
    onChange: e => setBranch(e.target.value),
    className: "mt-1 w-full border border-slate-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-700/40"
  }, BRANCHES.map(b => /*#__PURE__*/React.createElement("option", {
    key: b
  }, b)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2 block"
  }, "Role to test as"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 gap-2"
  }, ROLES.map(r => /*#__PURE__*/React.createElement("button", {
    key: r.id,
    onClick: () => setRole(r.id),
    className: `text-left px-3 py-2.5 rounded-lg border-2 transition-all ${role === r.id ? "shadow-sm" : "border-slate-200 hover:border-slate-300"}`,
    style: role === r.id ? {
      borderColor: r.color,
      background: r.color + "10"
    } : {}
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-sm",
    style: {
      color: role === r.id ? r.color : "#1e293b"
    }
  }, r.label), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500"
  }, r.desc))))), /*#__PURE__*/React.createElement("button", {
    disabled: !name.trim() || !role,
    onClick: () => onSignIn({
      name: name.trim(),
      role,
      branch
    }),
    className: "w-full py-2.5 rounded-md font-semibold text-white bg-black disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
  }, "Enter console"), (!name.trim() || !role) && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-amber-600 text-center -mt-2"
  }, !name.trim() ? "Type your name above, then pick a role, to enable this button." : "Pick a role above to enable this button."), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400 text-center"
  }, "Switch roles anytime with the logout button — try the same deal as Sales, then Admin, then RTO, then Claims."))));
}
function OtherDiscountsEditor({
  value,
  onChange,
  readOnly,
  onCommit
}) {
  const list = value || [];
  const containerRef = useRef(null);
  const snapshotRef = useRef(null);
  const capturingRef = useRef(false);
  const update = (id, patch) => onChange(list.map(o => o.id === id ? {
    ...o,
    ...patch
  } : o));
  const add = () => {
    const next = [...list, {
      id: "OD" + Date.now().toString(36),
      label: "",
      amount: "",
      claimable: true
    }];
    onChange(next);
    if (onCommit) onCommit(list, next);
  };
  const remove = id => {
    const next = list.filter(o => o.id !== id);
    onChange(next);
    if (onCommit) onCommit(list, next);
  };
  const handleFocusCapture = () => {
    if (!capturingRef.current) {
      capturingRef.current = true;
      snapshotRef.current = list;
    }
  };
  const handleBlurCapture = e => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget)) {
      capturingRef.current = false;
      if (onCommit && JSON.stringify(snapshotRef.current) !== JSON.stringify(list)) onCommit(snapshotRef.current, list);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: containerRef,
    onFocusCapture: handleFocusCapture,
    onBlurCapture: handleBlurCapture,
    className: "col-span-2 md:col-span-3 space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs uppercase tracking-wide text-slate-500 font-semibold"
  }, "Other discounts (user-defined)"), !readOnly && /*#__PURE__*/React.createElement("button", {
    onClick: add,
    className: "text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "w-3 h-3"
  }), " Add discount line")), list.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400 italic"
  }, "No additional discounts."), list.map(o => /*#__PURE__*/React.createElement("div", {
    key: o.id,
    className: "flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-100 rounded-md p-2"
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: "Discount label (e.g. Festival offer)",
    value: o.label,
    readOnly: readOnly,
    onChange: e => update(o.id, {
      label: e.target.value
    }),
    className: `flex-1 border border-slate-300 rounded-md px-2 py-1 text-sm outline-none ${readOnly ? "bg-slate-100 text-slate-500" : "bg-white"}`,
    style: {
      minWidth: "140px"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center border border-slate-300 rounded-md bg-white"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pl-2 text-slate-400 text-sm"
  }, "₹"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: o.amount,
    readOnly: readOnly,
    onChange: e => update(o.id, {
      amount: e.target.value
    }),
    className: "w-28 px-2 py-1 text-sm outline-none rounded-md"
  })), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-1 text-xs text-slate-600"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!o.claimable,
    disabled: readOnly,
    onChange: e => update(o.id, {
      claimable: e.target.checked
    })
  }), " Claimable from TML"), !readOnly && /*#__PURE__*/React.createElement("button", {
    onClick: () => remove(o.id),
    className: "text-xs text-red-600 hover:underline"
  }, "Remove"))));
}

/* ---------------------------------------------------------------------- */
/*  Deal editor                                                            */
/* ---------------------------------------------------------------------- */

function DealEditor({
  deal: d,
  deals,
  session,
  onUpdate,
  onBack,
  onDelete
}) {
  const c = calc(d);
  const isSales = session.role === "sales";
  const isAdmin = session.role === "admin";
  const isAccounts = session.role === "accounts";
  const isRto = session.role === "rto";
  const isClaims = session.role === "claims";
  const chassis = d.vehicle.chassisNo;
  const hasPendingAmendment = (d.amendments || []).some(a => a.status === "pending");
  const [editMode, setEditMode] = useState(false);
  // Draft/Rejected: freely editable, applies immediately (still Sales's own working copy).
  // Pending: fully locked — nobody edits until Admin approves or rejects.
  // Approved / Delivered: locked by default; Sales must explicitly enter Edit mode, then
  // Discard or Submit — nothing applies just from typing, so an accidental edit can't
  // slip through. Closed is the true hard lock — nothing edits after that.
  const preApprovalStage = d.status === STATUS.DRAFT || d.status === STATUS.REJECTED;
  const postApprovalEditableStage = d.status === STATUS.APPROVED || d.status === STATUS.DELIVERED;
  // Only Sales ever touches Customer / Vehicle / Pricing. Admin's role here is
  // strictly to approve or reject — never to edit these fields directly.
  const canTouchCoreFields = isSales && !hasPendingAmendment && (preApprovalStage || postApprovalEditableStage && editMode);
  // Sales edits are direct while still in Draft/Rejected; once Approved or Delivered,
  // edits are staged as an amendment awaiting Admin approval rather than applied right away.
  const gated = postApprovalEditableStage;
  const [coreDraft, setCoreDraft] = useState({
    customer: d.customer,
    vehicle: d.vehicle,
    pricing: d.pricing
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const coreDirty = gated && JSON.stringify(coreDraft) !== JSON.stringify({
    customer: d.customer,
    vehicle: d.vehicle,
    pricing: d.pricing
  });

  // Every change below saves immediately via onUpdate — there is no separate
  // "draft" copy sitting only in this component, so nothing is ever lost by
  // navigating away or switching logins without clicking a Save button.
  const withLog = (patchFn, note) => onUpdate(prev => ({
    ...patchFn(prev),
    activity: [...prev.activity, {
      at: new Date().toISOString(),
      by: session.name,
      role: session.role,
      note
    }]
  }));
  const set = (section, field, value) => onUpdate(prev => ({
    ...prev,
    [section]: {
      ...prev[section],
      [field]: value
    }
  }));

  // Writes one audit-log entry for an actual applied change (called once per
  // edit, on blur/commit — not per keystroke).
  const commitFieldChange = (section, field, oldValue, newValue) => {
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;
    withLog(p => p, `Changed ${section}.${field}: ${describe(oldValue)} → ${describe(newValue)}`);
  };

  // Customer / vehicle / pricing fields go through here. While gated (Approved +
  // Edit mode), this only stages the change locally until Submit is clicked.
  const editCore = (section, field, value) => {
    setCoreDraft(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    if (!gated) set(section, field, value);
  };
  // Fires once per edit (on blur) for fields that apply immediately (Draft/Rejected).
  const editCoreCommit = (section, field, oldValue, newValue) => {
    if (!gated) commitFieldChange(section, field, oldValue, newValue);
  };
  const discardEdits = () => {
    setCoreDraft({
      customer: d.customer,
      vehicle: d.vehicle,
      pricing: d.pricing
    });
    setEditMode(false);
  };
  const requestAmendment = () => {
    const changes = [];
    ["customer", "vehicle", "pricing"].forEach(section => {
      Object.keys(coreDraft[section]).forEach(field => {
        if (JSON.stringify(coreDraft[section][field]) !== JSON.stringify(d[section][field])) {
          changes.push({
            section,
            field,
            oldValue: d[section][field],
            newValue: coreDraft[section][field]
          });
        }
      });
    });
    if (!changes.length) {
      setEditMode(false);
      return;
    }
    const amendment = {
      id: "A" + Date.now().toString(36),
      changes,
      requestedBy: session.name,
      requestedAt: new Date().toISOString(),
      status: "pending"
    };
    withLog(p => ({
      ...p,
      amendments: [...(p.amendments || []), amendment]
    }), `Requested approval for ${changes.length} field change(s) — ${describeChanges(changes)}`);
    setEditMode(false);
  };
  const approveAmendment = id => {
    const amendment = (d.amendments || []).find(a => a.id === id);
    if (!amendment) return;
    withLog(p => {
      let next = {
        ...p
      };
      amendment.changes.forEach(ch => {
        next = {
          ...next,
          [ch.section]: {
            ...next[ch.section],
            [ch.field]: ch.newValue
          }
        };
      });
      return {
        ...next,
        amendments: p.amendments.map(a => a.id === id ? {
          ...a,
          status: "approved",
          reviewedBy: session.name,
          reviewedAt: new Date().toISOString()
        } : a)
      };
    }, `Approved field change request — ${describeChanges(amendment.changes)}`);
  };
  const rejectAmendment = id => {
    const amendment = (d.amendments || []).find(a => a.id === id);
    withLog(p => ({
      ...p,
      amendments: (p.amendments || []).map(a => a.id === id ? {
        ...a,
        status: "rejected",
        reviewedBy: session.name,
        reviewedAt: new Date().toISOString()
      } : a)
    }), `Rejected field change request${amendment ? ` — ${describeChanges(amendment.changes)}` : ""}`);
  };
  const submitForApproval = () => withLog(p => ({
    ...p,
    status: STATUS.PENDING,
    approval: {
      status: STATUS.PENDING,
      by: "",
      at: "",
      remarks: ""
    }
  }), "Submitted pricing for admin approval");
  const approve = () => withLog(p => ({
    ...p,
    status: STATUS.APPROVED,
    approval: {
      status: "approved",
      by: session.name,
      at: new Date().toISOString(),
      remarks: ""
    }
  }), "Pricing approved");
  const [modal, setModal] = useState(null); // { title, fields, onSubmit }

  const reject = () => setModal({
    title: "Reject pricing",
    fields: [{
      name: "remarks",
      label: "Reason (shown to Sales)",
      autoFocus: true
    }],
    onSubmit: v => {
      withLog(p => ({
        ...p,
        status: STATUS.REJECTED,
        approval: {
          status: "rejected",
          by: session.name,
          at: new Date().toISOString(),
          remarks: v.remarks || ""
        }
      }), "Pricing rejected" + (v.remarks ? `: ${v.remarks}` : ""));
    }
  });
  // Delivery can happen before the financer's payment actually lands — Admin can mark
  // a deal delivered any time it's approved, regardless of outstanding balance.
  const markDelivered = () => withLog(p => ({
    ...p,
    status: STATUS.DELIVERED
  }), "Marked as delivered by Admin");
  // Closing is the real, final lock on Customer/Vehicle/Pricing — only once the balance
  // (net of approved adjustments) is actually cleared.
  const closeDeal = () => withLog(p => ({
    ...p,
    status: STATUS.CLOSED
  }), "Closed by Admin — all customer commitments now locked");
  const addPayment = () => {
    const modeOptions = isAdmin ? [...PAYMENT_MODES, ADMIN_ONLY_PAYMENT_MODE] : PAYMENT_MODES;
    const advanceCandidates = deals.filter(dl => dl.id !== d.id).map(dl => ({
      id: dl.id,
      avail: availableAdvance(deals, dl),
      label: `${dl.customer.name || "Untitled"} · Chassis ${dl.vehicle.chassisNo || "—"} · Available ${inr(availableAdvance(deals, dl))}`
    })).filter(x => x.avail > 0);
    setModal({
      title: "Log customer payment",
      fields: [{
        name: "date",
        label: "Date of receipt",
        type: "date",
        defaultValue: new Date().toISOString().slice(0, 10),
        autoFocus: true
      }, {
        name: "amount",
        label: "Amount received (₹)",
        type: "number"
      }, {
        name: "mode",
        label: "Payment mode",
        type: "select",
        options: modeOptions,
        defaultValue: "Cash"
      }, {
        name: "sourceDealId",
        label: "Source deal (whose advance is being adjusted)",
        type: "select",
        options: advanceCandidates.map(c => c.id),
        optionLabels: Object.fromEntries(advanceCandidates.map(c => [c.id, c.label])),
        defaultValue: advanceCandidates[0]?.id || "",
        showIf: v => v.mode === ADMIN_ONLY_PAYMENT_MODE
      }, {
        name: "reference",
        label: "Reference / UTR / Cheque No. (optional)",
        showIf: v => v.mode !== ADMIN_ONLY_PAYMENT_MODE
      }],
      onSubmit: v => {
        const amount = parseFloat(v.amount);
        if (!amount || isNaN(amount) || amount <= 0) return "Enter a valid amount.";
        if (!v.date) return "Pick a date of receipt.";
        let sourceLabel = "";
        if (v.mode === ADMIN_ONLY_PAYMENT_MODE) {
          if (!isAdmin) return "Only Admin can use Advance Adjustment.";
          const source = deals.find(dl => dl.id === v.sourceDealId);
          if (!source) return "Select a valid source deal.";
          const avail = availableAdvance(deals, source);
          if (amount > avail) return `Exceeds available advance on that deal (${inr(avail)}).`;
          sourceLabel = ` from advance on ${source.customer.name || source.id}`;
        }
        const entry = {
          id: "P" + Date.now().toString(36),
          date: v.date,
          amount,
          mode: v.mode,
          reference: v.mode === ADMIN_ONLY_PAYMENT_MODE ? "" : v.reference || "",
          sourceDealId: v.mode === ADMIN_ONLY_PAYMENT_MODE ? v.sourceDealId : undefined,
          enteredBy: session.name,
          // Accounts recording their own receipt doesn't need Accounts to verify it again.
          status: isAccounts ? "verified" : "pending",
          verifiedBy: isAccounts ? session.name : undefined
        };
        withLog(p => ({
          ...p,
          paymentLog: [...p.paymentLog, entry]
        }), `Logged payment ${inr(amount)} via ${v.mode}${sourceLabel} (received ${v.date})${isAccounts ? " — recorded as received" : ""}`);
      }
    });
  };
  const verifyPayment = id => {
    const entry = d.paymentLog.find(e => e.id === id);
    withLog(p => ({
      ...p,
      paymentLog: p.paymentLog.map(e => e.id === id ? {
        ...e,
        status: "verified",
        verifiedBy: session.name
      } : e)
    }), `Verified payment ${entry ? inr(entry.amount) + " via " + entry.mode : ""}`);
  };
  const rejectPayment = id => {
    const entry = d.paymentLog.find(e => e.id === id);
    setModal({
      title: "Reject this payment",
      message: entry ? `${inr(entry.amount)} via ${entry.mode}, received ${entry.date}` : undefined,
      fields: [{
        name: "reason",
        label: "Reason (e.g. cheque bounced, amount mismatch)",
        autoFocus: true
      }],
      onSubmit: v => {
        withLog(p => ({
          ...p,
          paymentLog: p.paymentLog.map(e => e.id === id ? {
            ...e,
            status: "rejected",
            rejectedBy: session.name,
            rejectionReason: v.reason || ""
          } : e)
        }), `Rejected payment ${entry ? inr(entry.amount) + " via " + entry.mode : ""}${v.reason ? ": " + v.reason : ""}`);
      }
    });
  };

  // Last-moment adjustments at receipt time (rounding off, a final discount) —
  // raised by whoever is taking the payment, but only counts once Admin approves it.
  const addAdjustment = () => setModal({
    title: "Add receipt adjustment",
    fields: [{
      name: "amount",
      label: "Adjustment amount (₹)",
      type: "number",
      autoFocus: true
    }, {
      name: "reason",
      label: "Reason (e.g. rounding off, final negotiated discount)"
    }, {
      name: "date",
      label: "Date",
      type: "date",
      defaultValue: new Date().toISOString().slice(0, 10)
    }],
    onSubmit: v => {
      const amount = parseFloat(v.amount);
      if (!amount || isNaN(amount) || amount <= 0) return "Enter a valid amount.";
      const entry = {
        id: "ADJ" + Date.now().toString(36),
        amount,
        reason: v.reason || "",
        date: v.date || new Date().toISOString().slice(0, 10),
        enteredBy: session.name,
        status: "pending"
      };
      withLog(p => ({
        ...p,
        adjustments: [...(p.adjustments || []), entry]
      }), `Requested receipt adjustment ${inr(amount)}${v.reason ? ": " + v.reason : ""} — awaiting Admin approval`);
    }
  });
  const approveAdjustment = id => {
    const entry = (d.adjustments || []).find(a => a.id === id);
    withLog(p => ({
      ...p,
      adjustments: p.adjustments.map(a => a.id === id ? {
        ...a,
        status: "approved",
        approvedBy: session.name
      } : a)
    }), `Approved receipt adjustment ${entry ? inr(entry.amount) : ""}`);
  };
  const rejectAdjustment = id => {
    const entry = (d.adjustments || []).find(a => a.id === id);
    withLog(p => ({
      ...p,
      adjustments: p.adjustments.map(a => a.id === id ? {
        ...a,
        status: "rejected",
        approvedBy: session.name
      } : a)
    }), `Rejected receipt adjustment ${entry ? inr(entry.amount) : ""}`);
  };
  const addExpense = category => setModal({
    title: `Log ${EXPENSE_CATEGORIES.find(c => c.id === category)?.label} expense`,
    fields: [{
      name: "amount",
      label: "Amount actually spent (₹)",
      type: "number",
      autoFocus: true
    }, {
      name: "remarks",
      label: "Remarks (vendor, invoice no.) — optional"
    }],
    onSubmit: v => {
      const amount = parseFloat(v.amount);
      if (!amount || isNaN(amount) || amount <= 0) return "Enter a valid amount.";
      withLog(p => {
        const cap = expenseCap(p, category);
        const already = postedSpend(p.expenses, category);
        const status = already + amount > cap ? "pending_approval" : "posted";
        const entry = {
          id: "E" + Date.now().toString(36),
          category,
          amount,
          remarks: v.remarks || "",
          status,
          enteredBy: session.name,
          createdAt: new Date().toISOString()
        };
        return {
          ...p,
          expenses: [...p.expenses, entry]
        };
      }, `Logged ${category} expense ${inr(amount)}`);
    }
  });
  const approveExpense = id => {
    const entry = d.expenses.find(e => e.id === id);
    withLog(p => ({
      ...p,
      expenses: p.expenses.map(e => e.id === id ? {
        ...e,
        status: "posted",
        approvedBy: session.name
      } : e)
    }), `Approved over-receipt expense ${entry ? EXPENSE_CATEGORIES.find(c => c.id === entry.category)?.label + " " + inr(entry.amount) : ""}`);
  };
  const rejectExpense = id => {
    const entry = d.expenses.find(e => e.id === id);
    withLog(p => ({
      ...p,
      expenses: p.expenses.map(e => e.id === id ? {
        ...e,
        status: "rejected",
        approvedBy: session.name
      } : e)
    }), `Rejected over-receipt expense ${entry ? EXPENSE_CATEGORIES.find(c => c.id === entry.category)?.label + " " + inr(entry.amount) : ""}`);
  };
  // RTO closes out a head once all actual costs are recorded — recoveries from the
  // customer are commonly higher than the real cost, and that surplus just stays put.
  const markExpenseCategoryDone = category => {
    const cap = expenseCap(d, category);
    const spent = postedSpend(d.expenses, category);
    const label = EXPENSE_CATEGORIES.find(c => c.id === category)?.label;
    withLog(p => ({
      ...p,
      expenseClosed: {
        ...p.expenseClosed,
        [category]: true
      }
    }), `Marked ${label} as done — spent ${inr(spent)} of ${inr(cap)} collected`);
  };
  const reopenExpenseCategory = category => {
    const label = EXPENSE_CATEGORIES.find(c => c.id === category)?.label;
    withLog(p => ({
      ...p,
      expenseClosed: {
        ...p.expenseClosed,
        [category]: false
      }
    }), `Reopened ${label} for further entries`);
  };
  const editClaim = () => setModal({
    title: "TML claim amounts",
    fields: [{
      name: "claimedAmount",
      label: "Total claimed from Tata Motors (₹)",
      type: "number",
      defaultValue: String(d.claim?.claimedAmount ?? ""),
      autoFocus: true
    }, {
      name: "upfrontReceived",
      label: "Already received upfront, netted at purchase/off-take (₹)",
      type: "number",
      defaultValue: String(d.claim?.upfrontReceived ?? "0")
    }],
    onSubmit: v => {
      const claimedAmount = parseFloat(v.claimedAmount) || 0;
      const upfrontReceived = parseFloat(v.upfrontReceived) || 0;
      withLog(p => ({
        ...p,
        claim: {
          ...(p.claim || {
            receipts: [],
            status: "open"
          }),
          claimedAmount,
          upfrontReceived,
          status: p.claim?.status || "open"
        }
      }), `Set TML claim: claimed ${inr(claimedAmount)}, upfront received ${inr(upfrontReceived)}`);
    }
  });
  const addClaimReceipt = () => setModal({
    title: "Log TML claim receipt",
    fields: [{
      name: "amount",
      label: "Post-delivery amount received (₹)",
      type: "number",
      autoFocus: true
    }, {
      name: "reference",
      label: "Reference (credit note, UTR) — optional"
    }],
    onSubmit: v => {
      const amount = parseFloat(v.amount);
      if (!amount || isNaN(amount) || amount <= 0) return "Enter a valid amount.";
      const entry = {
        id: "R" + Date.now().toString(36),
        date: new Date().toISOString().slice(0, 10),
        amount,
        reference: v.reference || "",
        enteredBy: session.name
      };
      withLog(p => ({
        ...p,
        claim: {
          ...p.claim,
          receipts: [...(p.claim.receipts || []), entry]
        }
      }), `Logged TML claim receipt ${inr(amount)}`);
    }
  });
  const closeClaim = () => withLog(p => ({
    ...p,
    claim: {
      ...p.claim,
      status: "closed",
      closedBy: session.name,
      closedAt: new Date().toISOString()
    }
  }), `Closed TML claim (claimed ${inr(d.claim?.claimedAmount)}, received ${inr(calcClaim(d.claim)?.totalReceived)})`);
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4 pb-24"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    className: "flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
  }, /*#__PURE__*/React.createElement(ArrowLeft, {
    className: "w-4 h-4"
  }), " All deals"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, chassis && /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-md"
  }, "Chassis: ", chassis), /*#__PURE__*/React.createElement(StatusBadge, {
    status: d.status
  }))), d.approval.status === "rejected" && d.approval.remarks && /*#__PURE__*/React.createElement("div", {
    className: "flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3"
  }, /*#__PURE__*/React.createElement(AlertTriangle, {
    className: "w-4 h-4 mt-0.5 shrink-0"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Admin rejected this pricing:"), " ", d.approval.remarks)), d.status === STATUS.PENDING && /*#__PURE__*/React.createElement(Banner, null, "Submitted for approval — Customer, Vehicle, and Pricing are locked until Admin approves or rejects. No edits are possible right now, including by Admin."), d.status === STATUS.DRAFT && isSales && /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setConfirmDelete(true),
    className: "text-xs font-semibold text-red-700 border border-red-300 px-3 py-1.5 rounded-md hover:bg-red-50"
  }, "Delete this draft")), (d.amendments || []).some(a => a.status === "pending") && /*#__PURE__*/React.createElement("div", {
    className: "border border-amber-300 bg-amber-50 rounded-lg p-4 space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-slate-800 text-lg",
    style: {
      fontFamily: "'Barlow Condensed', sans-serif"
    }
  }, "FIELD CHANGE REQUEST AWAITING APPROVAL"), d.amendments.filter(a => a.status === "pending").map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    className: "bg-white border border-amber-200 rounded-md p-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500 mb-1"
  }, "Requested by ", a.requestedBy, " on ", new Date(a.requestedAt).toLocaleString("en-IN")), /*#__PURE__*/React.createElement("ul", {
    className: "text-sm space-y-0.5 list-disc list-inside"
  }, a.changes.map((ch, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-mono text-xs bg-slate-100 px-1 rounded"
  }, ch.section, ".", ch.field), " ", typeof ch.oldValue === "object" ? "(list)" : String(ch.oldValue) || "—", " → ", /*#__PURE__*/React.createElement("b", null, typeof ch.newValue === "object" ? "(list)" : String(ch.newValue) || "—")))), isAdmin && /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 mt-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => approveAmendment(a.id),
    className: "text-xs font-semibold text-white bg-emerald-700 px-3 py-1.5 rounded-md hover:bg-emerald-800"
  }, "Approve"), /*#__PURE__*/React.createElement("button", {
    onClick: () => rejectAmendment(a.id),
    className: "text-xs font-semibold text-red-700 border border-red-300 px-3 py-1.5 rounded-md hover:bg-red-50"
  }, "Reject")), !isAdmin && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400 mt-1"
  }, "Waiting on Admin — Customer, Vehicle, and On-road price fields are locked until this is approved or rejected.")))), isSales && postApprovalEditableStage && !hasPendingAmendment && /*#__PURE__*/React.createElement("div", {
    className: "border border-slate-200 bg-slate-50 rounded-lg p-3 flex items-center justify-between flex-wrap gap-2"
  }, !editMode ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-600"
  }, "Customer, Vehicle, and Pricing are locked now that this deal is approved. Only edit if something was entered wrong — it'll need Admin approval."), /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditMode(true),
    className: "text-sm font-semibold text-white bg-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-800"
  }, "Edit")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-blue-800"
  }, "Editing unlocked. ", coreDirty ? "You've made changes below — discard them or submit for Admin approval." : "Make your changes below, then submit for Admin approval (or discard to leave as-is)."), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: discardEdits,
    className: "text-sm font-semibold text-slate-600 border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-100 bg-white"
  }, "Discard changes"), /*#__PURE__*/React.createElement("button", {
    onClick: requestAmendment,
    disabled: !coreDirty,
    className: "text-sm font-semibold text-white bg-orange-700 px-3 py-1.5 rounded-md hover:bg-orange-900 disabled:opacity-50"
  }, "Submit for approval")))), /*#__PURE__*/React.createElement(Section, {
    title: "Customer",
    subtitle: "Filled by Sales"
  }, [["name", "Customer name"], ["soWo", "S/o, W/o, D/o"], ["dob", "DOB / Age"], ["pan", "PAN No."], ["aadhar", "Aadhar No."], ["mobile", "Mobile"], ["address", "Address"], ["po", "P.O."], ["ps", "P.S."], ["district", "District"], ["pin", "PIN"], ["state", "State"]].map(([k, l]) => /*#__PURE__*/React.createElement(Field, {
    key: k,
    label: l,
    value: coreDraft.customer[k],
    onChange: v => editCore("customer", k, v),
    onCommit: (o, n) => editCoreCommit("customer", k, o, n),
    readOnly: !canTouchCoreFields
  }))), /*#__PURE__*/React.createElement(Section, {
    title: "Vehicle",
    subtitle: "Filled by Sales"
  }, [["model", "Model"], ["colour", "Colour"], ["bodyType", "Body type"], ["chassisNo", "Chassis No."], ["engineNo", "Engine No."], ["fuelType", "Fuel type"], ["dod", "DOD"], ["dse", "DSE"], ["dsm", "DSM"], ["financerName", "Financer name"], ["rto", "RTO"]].map(([k, l]) => /*#__PURE__*/React.createElement(Field, {
    key: k,
    label: l,
    value: coreDraft.vehicle[k],
    onChange: v => editCore("vehicle", k, v),
    onCommit: (o, n) => editCoreCommit("vehicle", k, o, n),
    readOnly: !canTouchCoreFields
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Branch",
    value: d.branch,
    readOnly: true
  })), /*#__PURE__*/React.createElement(Section, {
    title: "On-road price",
    subtitle: d.status === STATUS.PENDING ? "Locked — awaiting Admin decision" : postApprovalEditableStage ? editMode ? "Editing — submit for Admin approval when done" : "Locked — click Edit above to change" : d.status === STATUS.CLOSED ? "Locked — deal is closed" : "Sales enters",
    accent: "#B5461C"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Exshowroom price",
    prefix: "₹",
    value: coreDraft.pricing.exshowroom,
    onChange: v => editCore("pricing", "exshowroom", v),
    onCommit: (o, n) => editCoreCommit("pricing", "exshowroom", o, n),
    readOnly: !canTouchCoreFields
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Less: TML cash discount (claimable)",
    prefix: "₹",
    value: coreDraft.pricing.tmlDiscount,
    onChange: v => editCore("pricing", "tmlDiscount", v),
    onCommit: (o, n) => editCoreCommit("pricing", "tmlDiscount", o, n),
    readOnly: !canTouchCoreFields
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Less: Dealer discount (not claimable)",
    prefix: "₹",
    value: coreDraft.pricing.dealerDiscount,
    onChange: v => editCore("pricing", "dealerDiscount", v),
    onCommit: (o, n) => editCoreCommit("pricing", "dealerDiscount", o, n),
    readOnly: !canTouchCoreFields
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Less: VAS NFA discount (claimable)",
    prefix: "₹",
    value: coreDraft.pricing.vasNfaDiscount,
    onChange: v => editCore("pricing", "vasNfaDiscount", v),
    onCommit: (o, n) => editCoreCommit("pricing", "vasNfaDiscount", o, n),
    readOnly: !canTouchCoreFields
  }), /*#__PURE__*/React.createElement(OtherDiscountsEditor, {
    value: coreDraft.pricing.otherDiscounts,
    onChange: list => editCore("pricing", "otherDiscounts", list),
    onCommit: (o, n) => editCoreCommit("pricing", "otherDiscounts", o, n),
    readOnly: !canTouchCoreFields
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Net price of vehicle",
    prefix: "₹",
    value: c.netPrice.toFixed(0),
    readOnly: true
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Add: TCS 1%",
    prefix: "₹",
    value: coreDraft.pricing.tcs,
    onChange: v => editCore("pricing", "tcs", v),
    onCommit: (o, n) => editCoreCommit("pricing", "tcs", o, n),
    readOnly: !canTouchCoreFields
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Add: TR",
    prefix: "₹",
    value: coreDraft.pricing.tr,
    onChange: v => editCore("pricing", "tr", v),
    onCommit: (o, n) => editCoreCommit("pricing", "tr", o, n),
    readOnly: !canTouchCoreFields
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Add: Insurance",
    prefix: "₹",
    value: coreDraft.pricing.insurance,
    onChange: v => editCore("pricing", "insurance", v),
    onCommit: (o, n) => editCoreCommit("pricing", "insurance", o, n),
    readOnly: !canTouchCoreFields
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Add: Registration",
    prefix: "₹",
    value: coreDraft.pricing.registration,
    onChange: v => editCore("pricing", "registration", v),
    onCommit: (o, n) => editCoreCommit("pricing", "registration", o, n),
    readOnly: !canTouchCoreFields
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Add: Permit",
    prefix: "₹",
    value: coreDraft.pricing.permit,
    onChange: v => editCore("pricing", "permit", v),
    onCommit: (o, n) => editCoreCommit("pricing", "permit", o, n),
    readOnly: !canTouchCoreFields
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Add: Fleetedge/VLTD",
    prefix: "₹",
    value: coreDraft.pricing.fleetedgeVltd,
    onChange: v => editCore("pricing", "fleetedgeVltd", v),
    onCommit: (o, n) => editCoreCommit("pricing", "fleetedgeVltd", o, n),
    readOnly: !canTouchCoreFields
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Add: VAS (AMC/FMS)",
    prefix: "₹",
    value: coreDraft.pricing.vasAmc,
    onChange: v => editCore("pricing", "vasAmc", v),
    onCommit: (o, n) => editCoreCommit("pricing", "vasAmc", o, n),
    readOnly: !canTouchCoreFields
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Add: Body fabrication chg",
    prefix: "₹",
    value: coreDraft.pricing.bodyFabCharge,
    onChange: v => editCore("pricing", "bodyFabCharge", v),
    onCommit: (o, n) => editCoreCommit("pricing", "bodyFabCharge", o, n),
    readOnly: !canTouchCoreFields
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Add: Choice No + HSRP",
    prefix: "₹",
    value: coreDraft.pricing.choiceHsrp,
    onChange: v => editCore("pricing", "choiceHsrp", v),
    onCommit: (o, n) => editCoreCommit("pricing", "choiceHsrp", o, n),
    readOnly: !canTouchCoreFields
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Add: Transportation",
    prefix: "₹",
    value: coreDraft.pricing.transportation,
    onChange: v => editCore("pricing", "transportation", v),
    onCommit: (o, n) => editCoreCommit("pricing", "transportation", o, n),
    readOnly: !canTouchCoreFields
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Total on-road price",
    prefix: "₹",
    value: c.totalOnRoad.toFixed(0),
    readOnly: true
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Less: Exchange bonus",
    prefix: "₹",
    value: coreDraft.pricing.exchangeBonus,
    onChange: v => editCore("pricing", "exchangeBonus", v),
    onCommit: (o, n) => editCoreCommit("pricing", "exchangeBonus", o, n),
    readOnly: !canTouchCoreFields
  }), /*#__PURE__*/React.createElement(Field, {
    label: "NET ON-ROAD PRICE",
    prefix: "₹",
    value: c.netOnRoad.toFixed(0),
    readOnly: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "col-span-2 md:col-span-3 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-md p-2"
  }, "Total claimable from Tata Motors: ", /*#__PURE__*/React.createElement("b", null, inr(c.claimableDiscount)), " (TML cash discount + VAS/NFA discount + any \"other\" discount marked claimable — Dealer Discount is never claimable).")), /*#__PURE__*/React.createElement("div", {
    className: "border border-slate-200 rounded-lg bg-white p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Barlow Condensed', sans-serif"
    },
    className: "font-bold text-slate-800 text-lg tracking-wide"
  }, "CUSTOMER PAYMENT LOG"), (isSales || isAccounts || isAdmin) && postApprovalEditableStage && /*#__PURE__*/React.createElement("button", {
    onClick: addPayment,
    className: "flex items-center gap-1 text-sm font-semibold text-white bg-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-800"
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "w-4 h-4"
  }), " Log payment")), d.paymentLog.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-400 italic"
  }, "No payments logged yet.") : /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left text-xs uppercase text-slate-500 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("th", {
    className: "py-1.5"
  }, "Date of receipt"), /*#__PURE__*/React.createElement("th", null, "Mode"), /*#__PURE__*/React.createElement("th", null, "Reference"), /*#__PURE__*/React.createElement("th", null, "Amount"), /*#__PURE__*/React.createElement("th", null, "Entered by"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", null))), /*#__PURE__*/React.createElement("tbody", null, d.paymentLog.map(e => {
    const st = paymentStatus(e);
    return /*#__PURE__*/React.createElement("tr", {
      key: e.id,
      className: "border-b border-slate-100"
    }, /*#__PURE__*/React.createElement("td", {
      className: "py-1.5"
    }, e.date), /*#__PURE__*/React.createElement("td", null, e.mode, e.mode === ADMIN_ONLY_PAYMENT_MODE && e.sourceDealId && (() => {
      const src = deals.find(dl => dl.id === e.sourceDealId);
      return src ? /*#__PURE__*/React.createElement("div", {
        className: "text-xs text-slate-400"
      }, "from ", src.customer.name || src.id) : null;
    })()), /*#__PURE__*/React.createElement("td", null, e.reference || "—"), /*#__PURE__*/React.createElement("td", {
      className: "font-semibold"
    }, inr(e.amount)), /*#__PURE__*/React.createElement("td", null, e.enteredBy), /*#__PURE__*/React.createElement("td", null, st === "verified" && /*#__PURE__*/React.createElement("span", {
      className: "text-emerald-700 font-semibold flex items-center gap-1"
    }, /*#__PURE__*/React.createElement(CheckCircle2, {
      className: "w-3.5 h-3.5"
    }), " Verified"), st === "pending" && /*#__PURE__*/React.createElement("span", {
      className: "text-amber-600"
    }, "Unverified"), st === "rejected" && /*#__PURE__*/React.createElement("span", {
      className: "text-red-700 font-semibold flex items-center gap-1"
    }, /*#__PURE__*/React.createElement(XCircle, {
      className: "w-3.5 h-3.5"
    }), " Rejected", e.rejectionReason ? `: ${e.rejectionReason}` : "")), /*#__PURE__*/React.createElement("td", null, isAccounts && st === "pending" && /*#__PURE__*/React.createElement("div", {
      className: "flex gap-2"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => verifyPayment(e.id),
      className: "text-xs font-semibold text-blue-700 hover:underline"
    }, "Verify"), /*#__PURE__*/React.createElement("button", {
      onClick: () => rejectPayment(e.id),
      className: "text-xs font-semibold text-red-700 hover:underline"
    }, "Reject"))));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "mt-3 flex flex-wrap gap-4 text-sm"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Total collected: "), /*#__PURE__*/React.createElement("b", null, inr(c.totalCollected))), c.approvedAdjustments > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Approved adjustments: "), /*#__PURE__*/React.createElement("b", null, inr(c.approvedAdjustments))), c.pendingAdjustments > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-amber-600"
  }, "Pending adjustments: "), /*#__PURE__*/React.createElement("b", {
    className: "text-amber-600"
  }, inr(c.pendingAdjustments))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Net on-road price: "), /*#__PURE__*/React.createElement("b", null, inr(c.netOnRoad))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Balance: "), /*#__PURE__*/React.createElement("b", {
    className: c.balance > 0 ? "text-orange-700" : "text-emerald-700"
  }, inr(c.balance)))), (d.adjustments || []).length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "mt-3 pt-3 border-t border-slate-100 space-y-1.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs uppercase tracking-wide text-slate-500 font-semibold"
  }, "Receipt adjustments"), d.adjustments.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    className: "flex items-center justify-between text-xs bg-slate-50 border border-slate-100 rounded px-2 py-1.5"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, inr(a.amount)), " ", /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, "— ", a.reason || "no reason given", " · ", a.date, " · by ", a.enteredBy)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "px-1.5 py-0.5 rounded-full font-semibold",
    style: {
      background: a.status === "approved" ? "#E4F3EA" : a.status === "rejected" ? "#FDE8E8" : "#FBEAE0",
      color: a.status === "approved" ? "#1E7A4C" : a.status === "rejected" ? "#B91C1C" : "#B5461C"
    }
  }, a.status === "approved" ? "Approved" : a.status === "rejected" ? "Rejected" : "Awaiting Admin approval"), isAdmin && a.status === "pending" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: () => approveAdjustment(a.id),
    className: "text-emerald-700 font-semibold hover:underline"
  }, "Approve"), /*#__PURE__*/React.createElement("button", {
    onClick: () => rejectAdjustment(a.id),
    className: "text-red-600 font-semibold hover:underline"
  }, "Reject")))))), (isSales || isAccounts || isAdmin) && postApprovalEditableStage && /*#__PURE__*/React.createElement("button", {
    onClick: addAdjustment,
    className: "mt-3 text-xs font-semibold text-blue-700 hover:underline"
  }, "+ Add receipt adjustment (rounding off, last-minute discount)")), (isRto || isAdmin) && /*#__PURE__*/React.createElement("div", {
    className: "border border-slate-200 rounded-lg bg-white p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-3"
  }, /*#__PURE__*/React.createElement(ShieldCheck, {
    className: "w-4 h-4 text-violet-600"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Barlow Condensed', sans-serif"
    },
    className: "font-bold text-slate-800 text-lg tracking-wide"
  }, "RTO / REGISTRATION EXPENSES")), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500 mb-3"
  }, "Referenced by chassis no. ", /*#__PURE__*/React.createElement("b", null, chassis || "—"), ". Capped at what was collected for each head — going over needs Admin approval."), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, EXPENSE_CATEGORIES.map(cat => {
    const cap = num(d.pricing[cat.pricingField]);
    const entries = d.expenses.filter(e => e.category === cat.id);
    const posted = entries.filter(e => e.status === "posted").reduce((s, e) => s + num(e.amount), 0);
    const remaining = cap - posted;
    const closed = !!(d.expenseClosed || {})[cat.id];
    return /*#__PURE__*/React.createElement("div", {
      key: cat.id,
      className: `border rounded-md p-3 ${closed ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-slate-50"}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between flex-wrap gap-2"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "font-semibold text-sm text-slate-800 flex items-center gap-2"
    }, cat.label, closed && /*#__PURE__*/React.createElement("span", {
      className: "text-xs px-1.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1"
    }, /*#__PURE__*/React.createElement(CheckCircle2, {
      className: "w-3 h-3"
    }), " Done")), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-slate-500"
    }, "Collected ", inr(cap), " · Spent ", inr(posted), " · ", /*#__PURE__*/React.createElement("span", {
      className: remaining < 0 ? "text-orange-700 font-semibold" : ""
    }, remaining < 0 ? `Over by ${inr(-remaining)}` : `Retained ${inr(remaining)}`))), isRto && d.status !== STATUS.DRAFT && !closed && /*#__PURE__*/React.createElement("div", {
      className: "flex gap-2"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => addExpense(cat.id),
      className: "flex items-center gap-1 text-xs font-semibold text-white bg-violet-600 px-2.5 py-1.5 rounded-md hover:bg-violet-800"
    }, /*#__PURE__*/React.createElement(Plus, {
      className: "w-3.5 h-3.5"
    }), " Add expense"), /*#__PURE__*/React.createElement("button", {
      onClick: () => markExpenseCategoryDone(cat.id),
      className: "text-xs font-semibold text-emerald-700 border border-emerald-300 px-2.5 py-1.5 rounded-md hover:bg-emerald-50"
    }, "Mark as done")), isAdmin && closed && /*#__PURE__*/React.createElement("button", {
      onClick: () => reopenExpenseCategory(cat.id),
      className: "text-xs font-semibold text-slate-500 hover:underline"
    }, "Reopen")), entries.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "mt-2 space-y-1"
    }, entries.map(e => {
      const m = EXPENSE_STATUS_META[e.status];
      return /*#__PURE__*/React.createElement("div", {
        key: e.id,
        className: "flex items-center justify-between text-xs bg-white border border-slate-100 rounded px-2 py-1.5"
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, inr(e.amount)), " ", /*#__PURE__*/React.createElement("span", {
        className: "text-slate-400"
      }, "by ", e.enteredBy), e.remarks && /*#__PURE__*/React.createElement("span", {
        className: "text-slate-400"
      }, " — ", e.remarks)), /*#__PURE__*/React.createElement("div", {
        className: "flex items-center gap-2"
      }, /*#__PURE__*/React.createElement("span", {
        className: "px-1.5 py-0.5 rounded-full font-semibold",
        style: {
          background: m.bg,
          color: m.color
        }
      }, m.label), isAdmin && e.status === "pending_approval" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
        onClick: () => approveExpense(e.id),
        className: "text-emerald-700 font-semibold hover:underline"
      }, "Approve"), /*#__PURE__*/React.createElement("button", {
        onClick: () => rejectExpense(e.id),
        className: "text-red-600 font-semibold hover:underline"
      }, "Reject"))));
    })));
  }))), (isClaims || isAdmin) && /*#__PURE__*/React.createElement("div", {
    className: "border border-slate-200 rounded-lg bg-white p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(HandCoins, {
    className: "w-4 h-4 text-amber-700"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Barlow Condensed', sans-serif"
    },
    className: "font-bold text-slate-800 text-lg tracking-wide"
  }, "TML CLAIM")), d.claim && /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold px-2 py-1 rounded-full",
    style: {
      background: d.claim.status === "closed" ? "#E4F3EA" : "#E7EEF9",
      color: d.claim.status === "closed" ? "#1E7A4C" : "#1B4F9C"
    }
  }, d.claim.status === "closed" ? "Closed" : "Open")), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500 mb-3"
  }, "Discounts passed to customer, claimable back from TML: ", /*#__PURE__*/React.createElement("b", null, inr(c.claimableDiscount)), ". The claim can differ. Chassis no. ", /*#__PURE__*/React.createElement("b", null, chassis || "—"), ".", c.claimableDiscount > 0 && /*#__PURE__*/React.createElement("span", {
    className: `ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold ${claimStatus(d) === "settled" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`
  }, claimStatus(d) === "settled" ? "Settled" : `Pending for claim: ${inr(claimPendingAmount(d))}`)), !d.claim ? isClaims ? /*#__PURE__*/React.createElement("button", {
    onClick: editClaim,
    className: "text-sm font-semibold text-white bg-amber-700 px-3 py-1.5 rounded-md hover:bg-amber-900"
  }, "Start claim") : /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-400 italic"
  }, "No claim started yet", isAdmin ? " — only the Claims team can start one" : "", ".") : /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, (() => {
    const cc = calcClaim(d.claim);
    return /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap gap-4 text-sm"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      className: "text-slate-500"
    }, "Claimed: "), /*#__PURE__*/React.createElement("b", null, inr(d.claim.claimedAmount))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      className: "text-slate-500"
    }, "Upfront received: "), /*#__PURE__*/React.createElement("b", null, inr(d.claim.upfrontReceived))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      className: "text-slate-500"
    }, "Post-delivery received: "), /*#__PURE__*/React.createElement("b", null, inr(cc.receiptsTotal))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      className: "text-slate-500"
    }, "Balance: "), /*#__PURE__*/React.createElement("b", {
      className: cc.balance > 0 ? "text-orange-700" : "text-emerald-700"
    }, inr(cc.balance))));
  })(), (d.claim.receipts || []).length > 0 && /*#__PURE__*/React.createElement("table", {
    className: "w-full text-xs"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left uppercase text-slate-500 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("th", {
    className: "py-1"
  }, "Date"), /*#__PURE__*/React.createElement("th", null, "Reference"), /*#__PURE__*/React.createElement("th", null, "Amount"), /*#__PURE__*/React.createElement("th", null, "Entered by"))), /*#__PURE__*/React.createElement("tbody", null, d.claim.receipts.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.id,
    className: "border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("td", {
    className: "py-1"
  }, r.date), /*#__PURE__*/React.createElement("td", null, r.reference || "—"), /*#__PURE__*/React.createElement("td", {
    className: "font-semibold"
  }, inr(r.amount)), /*#__PURE__*/React.createElement("td", null, r.enteredBy))))), d.claim.status === "open" && isClaims && /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: editClaim,
    className: "text-xs font-semibold text-slate-600 border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-50"
  }, "Edit claim amount"), /*#__PURE__*/React.createElement("button", {
    onClick: addClaimReceipt,
    className: "text-xs font-semibold text-white bg-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-800"
  }, "Log post-delivery receipt"), /*#__PURE__*/React.createElement("button", {
    onClick: closeClaim,
    className: "text-xs font-semibold text-white bg-emerald-700 px-3 py-1.5 rounded-md hover:bg-emerald-800"
  }, "Close claim")))), (isAdmin || isAccounts) && /*#__PURE__*/React.createElement(Section, {
    title: "Office use",
    subtitle: "Admin / Accounts",
    defaultOpen: false,
    accent: "#6B7280"
  }, [["remarks", "Remarks"], ["bodyFabName", "Body fab. name"], ["interestCost", "Interest cost"], ["retentionVehicle", "Retention on vehicle"], ["retentionBody", "Retention on body"], ["retentionVas", "Retention on VAS"], ["retentionOthers", "Retention on others"]].map(([k, l]) => /*#__PURE__*/React.createElement(Field, {
    key: k,
    label: l,
    prefix: k !== "remarks" && k !== "bodyFabName" ? "₹" : undefined,
    value: d.officeUse[k],
    onChange: v => set("officeUse", k, v),
    onCommit: (o, n) => commitFieldChange("officeUse", k, o, n),
    readOnly: d.status === STATUS.CLOSED
  }))), /*#__PURE__*/React.createElement("div", {
    className: "fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 flex items-center justify-between gap-2 shadow-lg"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400 self-center"
  }, "Changes save automatically."), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, isSales && (d.status === STATUS.DRAFT || d.status === STATUS.REJECTED) && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      submitForApproval();
    },
    className: "text-sm font-semibold text-white bg-orange-700 px-4 py-2 rounded-md hover:bg-orange-900"
  }, "Submit for approval"), isAdmin && d.status === STATUS.PENDING && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: reject,
    className: "text-sm font-semibold text-red-700 border border-red-300 px-4 py-2 rounded-md hover:bg-red-50"
  }, "Reject"), /*#__PURE__*/React.createElement("button", {
    onClick: approve,
    className: "text-sm font-semibold text-white bg-emerald-700 px-4 py-2 rounded-md hover:bg-emerald-800"
  }, "Approve pricing")), isAdmin && d.status === STATUS.APPROVED && /*#__PURE__*/React.createElement("button", {
    onClick: markDelivered,
    className: "text-sm font-semibold text-white bg-violet-600 px-4 py-2 rounded-md hover:bg-violet-800"
  }, "Mark delivered"), isAdmin && (d.status === STATUS.APPROVED || d.status === STATUS.DELIVERED) && /*#__PURE__*/React.createElement("button", {
    onClick: closeDeal,
    disabled: c.balance > 0,
    title: c.balance > 0 ? "Balance must be cleared before closing" : "",
    className: "text-sm font-semibold text-white bg-emerald-700 px-4 py-2 rounded-md hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
  }, "Close deal"), !isAdmin && (d.status === STATUS.APPROVED || d.status === STATUS.DELIVERED) && c.balance <= 0 && /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400 self-center"
  }, "Balance cleared — waiting on Admin to close."), !isAdmin && (d.status === STATUS.APPROVED || d.status === STATUS.DELIVERED) && c.balance > 0 && d.status === STATUS.DELIVERED && /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400 self-center"
  }, "Delivered — balance still pending (e.g. financer payment)."))), modal && /*#__PURE__*/React.createElement(ModalForm, {
    title: modal.title,
    fields: modal.fields,
    onSubmit: modal.onSubmit,
    onClose: () => setModal(null)
  }), confirmDelete && /*#__PURE__*/React.createElement(ModalForm, {
    title: "Delete this draft?",
    message: `This permanently removes deal ${d.id}${chassis ? ` (chassis ${chassis})` : ""}. This can't be undone.`,
    fields: [],
    onSubmit: () => {
      onDelete();
    },
    onClose: () => setConfirmDelete(false)
  }));
}

/* ---------------------------------------------------------------------- */
/*  Deals list                                                             */
/* ---------------------------------------------------------------------- */

function DealsList({
  deals,
  session,
  onOpen,
  onNew
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = deals.filter(d => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (branchFilter !== "all" && d.branch !== branchFilter) return false;
    if (!q) return true;
    return [d.id, d.vehicle.chassisNo, d.customer.name, d.vehicle.model].filter(Boolean).some(v => v.toLowerCase().includes(q));
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement(Search, {
    className: "w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
  }), /*#__PURE__*/React.createElement("input", {
    value: query,
    onChange: e => setQuery(e.target.value),
    placeholder: "Search by chassis number, customer, model, or deal ID…",
    className: "w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-700/40 focus:border-blue-700"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-2 justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 flex-wrap"
  }, /*#__PURE__*/React.createElement(Filter, {
    className: "w-4 h-4 text-slate-400"
  }), /*#__PURE__*/React.createElement("select", {
    value: statusFilter,
    onChange: e => setStatusFilter(e.target.value),
    className: "text-sm border border-slate-300 rounded-md px-2 py-1.5"
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All statuses"), Object.entries(STATUS_META).map(([k, v]) => /*#__PURE__*/React.createElement("option", {
    key: k,
    value: k
  }, v.label))), /*#__PURE__*/React.createElement("select", {
    value: branchFilter,
    onChange: e => setBranchFilter(e.target.value),
    className: "text-sm border border-slate-300 rounded-md px-2 py-1.5"
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All branches"), BRANCHES.map(b => /*#__PURE__*/React.createElement("option", {
    key: b
  }, b)))), session.role === "sales" && /*#__PURE__*/React.createElement("button", {
    onClick: onNew,
    className: "flex items-center gap-1 text-sm font-semibold text-white bg-blue-700 px-3 py-2 rounded-md hover:bg-blue-800"
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "w-4 h-4"
  }), " New deal")), filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-16 text-slate-400 text-sm"
  }, "No deals match these filters yet.") : /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, filtered.slice().reverse().map(d => {
    const c = calc(d);
    const cs = claimStatus(d);
    return /*#__PURE__*/React.createElement("button", {
      key: d.id,
      onClick: () => onOpen(d.id),
      className: "w-full text-left bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-700/50 hover:shadow-sm transition-all flex items-center justify-between gap-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "min-w-0"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 flex-wrap"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-bold text-slate-800 truncate"
    }, d.customer.name || "Untitled customer"), /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-slate-400"
    }, d.vehicle.model || "No model set"), cs !== "none" && /*#__PURE__*/React.createElement("span", {
      className: `text-xs px-1.5 py-0.5 rounded-full font-semibold ${cs === "settled" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`
    }, cs === "settled" ? "Claim settled" : "Claim pending")), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-slate-500"
    }, d.branch, " · ", d.id, d.vehicle.chassisNo && /*#__PURE__*/React.createElement(React.Fragment, null, " · Chassis ", /*#__PURE__*/React.createElement("span", {
      className: "font-mono"
    }, d.vehicle.chassisNo)), " · Net ", inr(c.netOnRoad), " · Balance ", inr(c.balance))), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 shrink-0"
    }, /*#__PURE__*/React.createElement(StatusBadge, {
      status: d.status
    }), /*#__PURE__*/React.createElement(ChevronRight, {
      className: "w-4 h-4 text-slate-300"
    })));
  })));
}

/* ---------------------------------------------------------------------- */
/*  Approvals (Admin only)                                                 */
/* ---------------------------------------------------------------------- */

function Approvals({
  deals,
  onOpen
}) {
  const pendingPricing = deals.filter(d => d.status === STATUS.PENDING);
  const pendingExpenses = [];
  deals.forEach(d => (d.expenses || []).forEach(e => {
    if (e.status === "pending_approval") pendingExpenses.push({
      ...e,
      dealId: d.id,
      customer: d.customer.name,
      branch: d.branch,
      chassis: d.vehicle.chassisNo
    });
  }));
  const pendingAmendments = [];
  deals.forEach(d => (d.amendments || []).forEach(a => {
    if (a.status === "pending") pendingAmendments.push({
      ...a,
      dealId: d.id,
      customer: d.customer.name,
      branch: d.branch,
      chassis: d.vehicle.chassisNo
    });
  }));
  const pendingAdjustments = [];
  deals.forEach(d => (d.adjustments || []).forEach(a => {
    if (a.status === "pending") pendingAdjustments.push({
      ...a,
      dealId: d.id,
      customer: d.customer.name,
      branch: d.branch,
      chassis: d.vehicle.chassisNo
    });
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-lg p-4"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Barlow Condensed', sans-serif"
    },
    className: "font-bold text-slate-800 text-lg tracking-wide mb-3"
  }, "PRICING AWAITING APPROVAL"), pendingPricing.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-400 italic"
  }, "Nothing pending.") : /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, pendingPricing.map(d => /*#__PURE__*/React.createElement("button", {
    key: d.id,
    onClick: () => onOpen(d.id),
    className: "w-full text-left border border-slate-100 rounded-md p-2.5 hover:border-blue-700/40 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-sm text-slate-800"
  }, d.customer.name || "Untitled", " ", /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-normal text-slate-400"
  }, d.vehicle.model)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500"
  }, d.branch, " · ", d.id, d.vehicle.chassisNo && ` · Chassis ${d.vehicle.chassisNo}`)), /*#__PURE__*/React.createElement(ChevronRight, {
    className: "w-4 h-4 text-slate-300"
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-lg p-4"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Barlow Condensed', sans-serif"
    },
    className: "font-bold text-slate-800 text-lg tracking-wide mb-3"
  }, "FIELD CHANGES AWAITING APPROVAL"), pendingAmendments.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-400 italic"
  }, "Nothing pending.") : /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, pendingAmendments.map(a => /*#__PURE__*/React.createElement("button", {
    key: a.id,
    onClick: () => onOpen(a.dealId),
    className: "w-full text-left border border-slate-100 rounded-md p-2.5 hover:border-blue-700/40 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-sm text-slate-800"
  }, a.changes.length, " field change(s) — ", a.customer || "Untitled"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500"
  }, a.branch, " · ", a.dealId, a.chassis && ` · Chassis ${a.chassis}`, " · requested by ", a.requestedBy)), /*#__PURE__*/React.createElement(ChevronRight, {
    className: "w-4 h-4 text-slate-300"
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-lg p-4"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Barlow Condensed', sans-serif"
    },
    className: "font-bold text-slate-800 text-lg tracking-wide mb-3"
  }, "EXPENSES OVER RECEIPT — AWAITING APPROVAL"), pendingExpenses.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-400 italic"
  }, "Nothing pending.") : /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, pendingExpenses.map(e => /*#__PURE__*/React.createElement("button", {
    key: e.id,
    onClick: () => onOpen(e.dealId),
    className: "w-full text-left border border-slate-100 rounded-md p-2.5 hover:border-blue-700/40 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-sm text-slate-800"
  }, EXPENSE_CATEGORIES.find(c => c.id === e.category)?.label, " — ", inr(e.amount)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500"
  }, e.customer, " · ", e.branch, e.chassis && ` · Chassis ${e.chassis}`, " · by ", e.enteredBy)), /*#__PURE__*/React.createElement(ChevronRight, {
    className: "w-4 h-4 text-slate-300"
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-lg p-4"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Barlow Condensed', sans-serif"
    },
    className: "font-bold text-slate-800 text-lg tracking-wide mb-3"
  }, "RECEIPT ADJUSTMENTS AWAITING APPROVAL"), pendingAdjustments.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-400 italic"
  }, "Nothing pending.") : /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, pendingAdjustments.map(a => /*#__PURE__*/React.createElement("button", {
    key: a.id,
    onClick: () => onOpen(a.dealId),
    className: "w-full text-left border border-slate-100 rounded-md p-2.5 hover:border-blue-700/40 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-sm text-slate-800"
  }, inr(a.amount), " — ", a.customer || "Untitled"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500"
  }, a.branch, " · ", a.dealId, a.chassis && ` · Chassis ${a.chassis}`, " · ", a.reason || "no reason given", " · by ", a.enteredBy)), /*#__PURE__*/React.createElement(ChevronRight, {
    className: "w-4 h-4 text-slate-300"
  }))))));
}

/* ---------------------------------------------------------------------- */
/*  Payments to verify (Accounts action-items tab)                        */
/* ---------------------------------------------------------------------- */

function PaymentsToVerify({
  deals,
  onVerify,
  onReject,
  onOpen
}) {
  const [rejectModal, setRejectModal] = useState(null); // { dealId, paymentId, entry }
  const pending = [];
  deals.forEach(d => (d.paymentLog || []).forEach(e => {
    if (paymentStatus(e) === "pending") pending.push({
      ...e,
      dealId: d.id,
      customer: d.customer.name,
      chassis: d.vehicle.chassisNo,
      branch: d.branch
    });
  }));
  pending.sort((a, b) => new Date(a.date) - new Date(b.date));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-lg p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-slate-800 text-lg mb-3",
    style: {
      fontFamily: "'Barlow Condensed', sans-serif"
    }
  }, "PAYMENTS AWAITING VERIFICATION"), pending.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-400 italic py-8 text-center"
  }, "Nothing pending.") : /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, pending.map(e => /*#__PURE__*/React.createElement("div", {
    key: e.id,
    className: "border border-slate-100 rounded-md p-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between flex-wrap gap-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-sm text-slate-800"
  }, inr(e.amount), " via ", e.mode, " — ", e.customer || "Untitled customer"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500"
  }, e.branch, e.chassis && ` · Chassis ${e.chassis}`, " · received ", e.date, " · entered by ", e.enteredBy, e.reference ? ` · Ref ${e.reference}` : "")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onOpen(e.dealId),
    className: "text-xs font-semibold text-slate-500 hover:underline"
  }, "View deal"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onVerify(e.dealId, e.id),
    className: "text-xs font-semibold text-white bg-emerald-700 px-2.5 py-1 rounded-md hover:bg-emerald-800"
  }, "Verify"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setRejectModal({
      dealId: e.dealId,
      paymentId: e.id,
      entry: e
    }),
    className: "text-xs font-semibold text-red-700 border border-red-300 px-2.5 py-1 rounded-md hover:bg-red-50"
  }, "Reject"))))))), rejectModal && /*#__PURE__*/React.createElement(ModalForm, {
    title: "Reject this payment",
    message: `${inr(rejectModal.entry.amount)} via ${rejectModal.entry.mode}, received ${rejectModal.entry.date}`,
    fields: [{
      name: "reason",
      label: "Reason (e.g. cheque bounced, amount mismatch)",
      autoFocus: true
    }],
    onSubmit: v => {
      onReject(rejectModal.dealId, rejectModal.paymentId, v.reason || "");
    },
    onClose: () => setRejectModal(null)
  }));
}

/* ---------------------------------------------------------------------- */
/*  Audit trail (Admin only)                                               */
/* ---------------------------------------------------------------------- */

function AuditTrail({
  deals,
  onOpen
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const entries = [];
  deals.forEach(d => (d.activity || []).forEach(a => {
    entries.push({
      ...a,
      dealId: d.id,
      customer: d.customer.name,
      chassis: d.vehicle.chassisNo,
      branch: d.branch
    });
  }));
  entries.sort((a, b) => new Date(b.at) - new Date(a.at));
  const filtered = q ? entries.filter(e => [e.dealId, e.chassis, e.customer, e.by, e.note].filter(Boolean).some(v => v.toLowerCase().includes(q))) : entries;
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement(Search, {
    className: "w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
  }), /*#__PURE__*/React.createElement("input", {
    value: query,
    onChange: e => setQuery(e.target.value),
    placeholder: "Search by chassis number, customer, deal ID, or who made the change…",
    className: "w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-700/40 focus:border-blue-700"
  })), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-lg p-4"
  }, filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-400 italic py-8 text-center"
  }, "No activity to show.") : /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 overflow-y-auto pr-1",
    style: {
      maxHeight: "70vh"
    }
  }, filtered.map((e, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => onOpen(e.dealId),
    className: "w-full text-left border border-slate-100 rounded-md p-2.5 hover:border-blue-700/40"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between gap-2 flex-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400"
  }, new Date(e.at).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400 font-mono"
  }, e.dealId, e.chassis && ` · Chassis ${e.chassis}`)), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-700 mt-1"
  }, /*#__PURE__*/React.createElement("b", null, e.by), " ", /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, "(", e.role, ")"), " — ", e.note), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400"
  }, e.customer || "Untitled customer", " · ", e.branch))))));
}

/* ---------------------------------------------------------------------- */
/*  Reports                                                                */
/* ---------------------------------------------------------------------- */

function Reports({
  deals
}) {
  const withCalc = deals.map(d => ({
    d,
    c: calc(d)
  }));
  const funnel = Object.keys(STATUS_META).map(s => ({
    status: s,
    count: deals.filter(d => d.status === s).length
  }));
  const totalNet = withCalc.reduce((s, x) => s + x.c.netOnRoad, 0);
  const totalCollected = withCalc.reduce((s, x) => s + x.c.totalCollected, 0);
  const totalDue = withCalc.reduce((s, x) => s + Math.max(0, x.c.balance), 0);
  const totalPendingClaims = deals.reduce((s, d) => s + claimPendingAmount(d), 0);
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-3"
  }, [{
    label: "Total deals",
    value: deals.length,
    color: "#1B4F9C"
  }, {
    label: "Net order value",
    value: inr(totalNet),
    color: "#374151"
  }, {
    label: "Collected",
    value: inr(totalCollected),
    color: "#1E7A4C"
  }, {
    label: "Outstanding dues",
    value: inr(totalDue),
    color: "#B5461C"
  }, {
    label: "Pending TML claims",
    value: inr(totalPendingClaims),
    color: "#B45309"
  }].map(k => /*#__PURE__*/React.createElement("div", {
    key: k.label,
    className: "bg-white border border-slate-200 rounded-lg p-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs uppercase tracking-wide text-slate-500 font-semibold"
  }, k.label), /*#__PURE__*/React.createElement("div", {
    className: "text-xl font-bold mt-1",
    style: {
      color: k.color,
      fontFamily: "'Barlow Condensed', sans-serif"
    }
  }, k.value)))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-lg p-4"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Barlow Condensed', sans-serif"
    },
    className: "font-bold text-slate-800 text-lg tracking-wide mb-3"
  }, "DEAL-TO-DELIVERY FUNNEL"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, funnel.map(f => {
    const meta = STATUS_META[f.status];
    const max = Math.max(1, ...funnel.map(x => x.count));
    return /*#__PURE__*/React.createElement("div", {
      key: f.status,
      className: "flex items-center gap-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-40 text-xs text-slate-600 shrink-0"
    }, meta.label), /*#__PURE__*/React.createElement("div", {
      className: "flex-1 bg-slate-100 rounded h-5 overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "h-full rounded",
      style: {
        width: `${f.count / max * 100}%`,
        background: meta.color,
        minWidth: f.count ? "8px" : 0
      }
    })), /*#__PURE__*/React.createElement("div", {
      className: "w-6 text-xs font-bold text-slate-700"
    }, f.count));
  }))));
}

/* ---------------------------------------------------------------------- */
/*  App shell                                                              */
/* ---------------------------------------------------------------------- */

export default function App() {
  const [session, setSession] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("list");
  const [openId, setOpenId] = useState(null);

  // Check existing session on load
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setSession(data.user);
          }
        }
      } catch (err) {
        console.warn("Session check error:", err);
      } finally {
        setAuthChecking(false);
      }
    })();
  }, []);

  const fetchDealsFromServer = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/deals");
      if (res.ok) {
        const data = await res.json();
        if (data.deals) {
          setDeals(data.deals);
          try {
            localStorage.setItem("sales_erp_deals_cache", JSON.stringify(data.deals));
          } catch { }
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch deals from server, loading cached:", e);
    }
    try {
      const cached = localStorage.getItem("sales_erp_deals_cache");
      if (cached) setDeals(JSON.parse(cached));
    } catch { }
    setLoading(false);
  };

  useEffect(() => {
    if (!session) return;
    setOpenId(null);
    setTab(session.role === "accounts" ? "toverify" : "list");
    fetchDealsFromServer();
  }, [session]);

  const persist = async next => {
    setDeals(next);
    try {
      localStorage.setItem("sales_erp_deals_cache", JSON.stringify(next));
    } catch { }
    try {
      await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deals: next }),
      });
    } catch (err) {
      console.error("Failed to sync deals to server:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch { }
    setSession(null);
    setOpenId(null);
  };

  const handleNew = () => {
    const d = newDeal(session.branch, session);
    persist([...deals, d]);
    setOpenId(d.id);
  };

  const handleUpdateDeal = (id, updaterFn) => {
    const current = deals.find(x => x.id === id);
    if (!current) return;
    persist(deals.map(x => (x.id === id ? updaterFn(x) : x)));
  };

  const handleDeleteDeal = id => {
    persist(deals.filter(x => x.id !== id));
    setOpenId(null);
  };

  const appendActivity = (deal, note) => [
    ...(deal.activity || []),
    {
      at: new Date().toISOString(),
      by: session.name,
      role: session.role,
      note,
    },
  ];

  const verifyPaymentFor = (dealId, paymentId) =>
    handleUpdateDeal(dealId, p => {
      const entry = p.paymentLog.find(e => e.id === paymentId);
      return {
        ...p,
        paymentLog: p.paymentLog.map(e =>
          e.id === paymentId
            ? {
                ...e,
                status: "verified",
                verifiedBy: session.name,
              }
            : e
        ),
        activity: appendActivity(
          p,
          `Verified payment ${entry ? inr(entry.amount) + " via " + entry.mode : ""}`
        ),
      };
    });

  const rejectPaymentFor = (dealId, paymentId, reason) =>
    handleUpdateDeal(dealId, p => {
      const entry = p.paymentLog.find(e => e.id === paymentId);
      return {
        ...p,
        paymentLog: p.paymentLog.map(e =>
          e.id === paymentId
            ? {
                ...e,
                status: "rejected",
                rejectedBy: session.name,
                rejectionReason: reason,
              }
            : e
        ),
        activity: appendActivity(
          p,
          `Rejected payment ${entry ? inr(entry.amount) + " via " + entry.mode : ""}${reason ? ": " + reason : ""}`
        ),
      };
    });

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        <div className="text-xs text-slate-400 font-mono">Initializing Dealership Workspace…</div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage onLoginSuccess={setSession} />;
  }

  const openDeal = deals.find(d => d.id === openId);
  const roleMeta = ROLES.find(r => r.id === session.role) || {
    label: session.role,
    color: "#1B4F9C",
  };

  // Build authorized tabs per role
  const roleTabs = [];
  if (session.role === "admin") {
    roleTabs.push(
      { id: "list", label: "All Deals", icon: ClipboardCheck },
      { id: "approvals", label: "Approvals", icon: ShieldCheck },
      { id: "toverify", label: "To Verify", icon: CheckCircle2 },
      { id: "reports", label: "Reports", icon: BarChart3 },
      { id: "audit", label: "Audit Trail", icon: FileText },
      { id: "users", label: "User Management", icon: Users }
    );
  } else if (session.role === "sales") {
    roleTabs.push(
      { id: "list", label: "Sales Deals", icon: ClipboardCheck },
      { id: "reports", label: "Reports", icon: BarChart3 }
    );
  } else if (session.role === "accounts") {
    roleTabs.push(
      { id: "toverify", label: "Payments To Verify", icon: CheckCircle2 },
      { id: "list", label: "Deals Ledger", icon: ClipboardCheck },
      { id: "reports", label: "Financial Reports", icon: BarChart3 }
    );
  } else if (session.role === "rto") {
    roleTabs.push(
      { id: "list", label: "RTO & Compliance Deals", icon: ClipboardCheck }
    );
  } else if (session.role === "claims") {
    roleTabs.push(
      { id: "list", label: "TML Claims Tracker", icon: ClipboardCheck },
      { id: "reports", label: "Reports", icon: BarChart3 }
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter:wght@400;500;600;700&display=swap'); * { font-family: 'Inter', sans-serif; }`}</style>
      
      {/* Top Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-600 text-white">
            <Truck className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <span
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="font-bold tracking-wide text-lg text-white"
            >
              DEALERSHIP ERP
            </span>
            <span className="text-[10px] bg-slate-800 text-blue-300 px-2 py-0.5 rounded-full ml-2 border border-slate-700 font-mono">
              RBAC Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="text-right hidden sm:block">
            <div className="font-semibold text-slate-100">{session.name}</div>
            <div className="text-xs flex items-center justify-end gap-1.5 text-slate-400">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: roleMeta.color }}
              ></span>
              <span className="font-medium text-slate-300 uppercase tracking-wider text-[11px]">
                {roleMeta.label}
              </span>
              <span>· {session.branch}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      {!openDeal && (
        <div className="flex bg-white border-b border-slate-200 sticky top-14 z-10 overflow-x-auto shadow-sm">
          {roleTabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                tab === t.id
                  ? "border-blue-700 text-blue-700 bg-blue-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}

          <button
            onClick={fetchDealsFromServer}
            className="ml-auto flex items-center gap-1 px-4 text-xs text-slate-400 hover:text-slate-600 whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      )}

      {/* Content Body */}
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm space-y-2">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
            <div>Loading records…</div>
          </div>
        ) : openDeal ? (
          <DealEditor
            deal={openDeal}
            deals={deals}
            session={session}
            onUpdate={fn => handleUpdateDeal(openDeal.id, fn)}
            onBack={() => setOpenId(null)}
            onDelete={() => handleDeleteDeal(openDeal.id)}
          />
        ) : tab === "users" && session.role === "admin" ? (
          <UserManagement currentAdmin={session} />
        ) : tab === "list" ? (
          <DealsList
            deals={deals}
            session={session}
            onOpen={setOpenId}
            onNew={session.role === "sales" || session.role === "admin" ? handleNew : undefined}
          />
        ) : tab === "reports" ? (
          <Reports deals={deals} />
        ) : tab === "approvals" && session.role === "admin" ? (
          <Approvals
            deals={deals}
            onOpen={id => {
              setOpenId(id);
              setTab("list");
            }}
          />
        ) : tab === "toverify" ? (
          <PaymentsToVerify
            deals={deals}
            onVerify={verifyPaymentFor}
            onReject={rejectPaymentFor}
            onOpen={id => {
              setOpenId(id);
              setTab("list");
            }}
          />
        ) : tab === "audit" && session.role === "admin" ? (
          <AuditTrail
            deals={deals}
            onOpen={id => {
              setOpenId(id);
              setTab("list");
            }}
          />
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm">
            Please select an authorized tab.
          </div>
        )}
      </div>
    </div>
  );
}

