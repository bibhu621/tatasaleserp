"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Calendar,
  Download,
  Filter,
  Search,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  CreditCard,
  ArrowUpDown,
  TrendingUp,
  Users,
  Shield,
  ArrowUpRight,
  Building2,
  UserCheck,
  AlertTriangle,
  Eye,
  Layers,
  Sparkles,
  FileSpreadsheet,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  Helper Constants & Utilities                                           */
/* ---------------------------------------------------------------------- */

const BRANCHES = ["Sasaram", "Bihiya", "Buxas", "Mohaniya"];

const PAYMENT_MODES = [
  "Cash",
  "Cheque",
  "NEFT/RTGS",
  "Financer Disbursement",
  "Exchange Vehicle",
  "Advance Adjustment",
];

const STATUS_META = {
  draft: { label: "Draft", color: "#6B7280", bg: "#F1F2F4" },
  pending_approval: { label: "Pending Approval", color: "#B5461C", bg: "#FBEAE0" },
  rejected: { label: "Rejected", color: "#B91C1C", bg: "#FDE8E8" },
  approved: { label: "Approved · Collecting", color: "#1B4F9C", bg: "#E7EEF9" },
  delivered: { label: "Delivered", color: "#7C3AED", bg: "#EDE6FB" },
  closed: { label: "Closed", color: "#1E7A4C", bg: "#E4F3EA" },
};

const num = (v) => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));
const inr = (v) => "₹" + Math.round(num(v)).toLocaleString("en-IN");

function normalizeBranch(b) {
  if (!b) return "Sasaram";
  const lower = String(b).toLowerCase().trim();
  if (lower.includes("bihiya")) return "Bihiya";
  if (lower.includes("buxa")) return "Buxas";
  if (lower.includes("mohan")) return "Mohaniya";
  if (lower.includes("sasaram")) return "Sasaram";
  return b;
}

function paymentStatus(e) {
  if (e.status) return e.status;
  return e.verified ? "verified" : "pending";
}

function calcDeal(deal) {
  const p = deal.pricing || {};
  const otherDiscountsTotal = (p.otherDiscounts || []).reduce(
    (s, o) => s + num(o.amount),
    0
  );
  const netPrice =
    num(p.exshowroom) -
    num(p.tmlDiscount) -
    num(p.dealerDiscount) -
    num(p.vasNfaDiscount) -
    otherDiscountsTotal;
  const adds = [
    "tcs",
    "tr",
    "insurance",
    "registration",
    "permit",
    "fleetedgeVltd",
    "vasAmc",
    "bodyFabCharge",
    "choiceHsrp",
    "transportation",
  ].reduce((s, k) => s + num(p[k]), 0);
  const totalOnRoad = netPrice + adds;
  const netOnRoad = totalOnRoad - num(p.exchangeBonus);

  const totalCollected = (deal.paymentLog || [])
    .filter((e) => paymentStatus(e) !== "rejected")
    .reduce((s, e) => s + num(e.amount), 0);

  const approvedAdjustments = (deal.adjustments || [])
    .filter((a) => a.status === "approved")
    .reduce((s, a) => s + num(a.amount), 0);

  const pendingAdjustments = (deal.adjustments || [])
    .filter((a) => a.status === "pending")
    .reduce((s, a) => s + num(a.amount), 0);

  const balance = netOnRoad - totalCollected - approvedAdjustments;

  return {
    netPrice,
    totalOnRoad,
    netOnRoad,
    totalCollected,
    approvedAdjustments,
    pendingAdjustments,
    balance,
    outstandingDue: Math.max(0, balance),
    otherDiscountsTotal,
  };
}

function getDealDateObj(d) {
  if (d.createdAt) {
    const dt = new Date(d.createdAt);
    if (!isNaN(dt.getTime())) return dt;
  }
  if (d.activity && d.activity[0]?.at) {
    const dt = new Date(d.activity[0].at);
    if (!isNaN(dt.getTime())) return dt;
  }
  if (d.approval?.at) {
    const dt = new Date(d.approval.at);
    if (!isNaN(dt.getTime())) return dt;
  }
  return new Date();
}

function getDayKey(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;
}

function getMonthKey(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

function formatDisplayDate(dateObj) {
  return dateObj.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getSalesmanName(d) {
  return (d.vehicle?.dse || d.createdBy || "Unassigned").trim();
}

function formatCustomer(customer) {
  if (!customer) return "Untitled customer";
  const comp = (customer.companyName || "").trim();
  const name = (customer.name || "").trim();
  if (comp && name) return `${comp} (${name})`;
  return comp || name || "Untitled customer";
}

/* ---------------------------------------------------------------------- */
/*  Main Component: ReportsDashboard                                       */
/* ---------------------------------------------------------------------- */

export default function ReportsDashboard({ deals = [], session, onOpen }) {
  const isAdmin = session?.role === "admin";

  // Filter States
  const [timePreset, setTimePreset] = useState("all"); // 'all' | 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom'
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [salesmanFilter, setSalesmanFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [paymentModeFilter, setPaymentModeFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all"); // 'all' | 'dues' | 'settled' | 'partial'
  const [searchQuery, setSearchQuery] = useState("");

  // Sub-tab view state
  const [activeView, setActiveView] = useState("ledger"); // 'ledger' | 'timeline' | 'salesmen'
  const [timelineGrouping, setTimelineGrouping] = useState("day"); // 'day' | 'week' | 'month'

  // Registered salesmen list from API (for admin)
  const [registeredSalesmen, setRegisteredSalesmen] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      (async () => {
        try {
          const res = await fetch("/api/users");
          if (res.ok) {
            const data = await res.json();
            if (data.users) {
              const salesUsers = data.users
                .filter((u) => u.role === "sales" || u.role === "admin")
                .map((u) => u.name);
              setRegisteredSalesmen(salesUsers);
            }
          }
        } catch (e) {
          console.warn("Could not load users for salesman dropdown", e);
        }
      })();
    }
  }, [isAdmin]);

  // All distinct salesmen gathered from deals and users list
  const allSalesmen = useMemo(() => {
    const fromDeals = deals.map((d) => getSalesmanName(d)).filter(Boolean);
    const combined = Array.from(new Set([...fromDeals, ...registeredSalesmen])).sort();
    return combined;
  }, [deals, registeredSalesmen]);

  // Pre-calculate Deals with Calculations & Date Objects
  const dealsWithCalc = useMemo(() => {
    return deals.map((d) => {
      const c = calcDeal(d);
      const dt = getDealDateObj(d);
      const dayKey = getDayKey(dt);
      const monthKey = getMonthKey(dt);
      const salesman = getSalesmanName(d);
      const branchNorm = normalizeBranch(d.branch);
      return {
        d,
        c,
        dt,
        dayKey,
        monthKey,
        salesman,
        branchNorm,
      };
    });
  }, [deals]);

  // Overall Counters (Today, This Week, This Month, This Year)
  const quickCounters = useMemo(() => {
    const now = new Date();
    const todayKey = getDayKey(now);

    // Start of week (Monday)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Start of year
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let todayCount = 0,
      todayNet = 0,
      todayCollected = 0;
    let weekCount = 0,
      weekNet = 0,
      weekCollected = 0;
    let monthCount = 0,
      monthNet = 0,
      monthCollected = 0;
    let yearCount = 0,
      yearNet = 0,
      yearCollected = 0;

    dealsWithCalc.forEach((item) => {
      const dt = item.dt;
      const net = item.c.netOnRoad;
      const coll = item.c.totalCollected;

      if (item.dayKey === todayKey) {
        todayCount++;
        todayNet += net;
        todayCollected += coll;
      }
      if (dt >= startOfWeek) {
        weekCount++;
        weekNet += net;
        weekCollected += coll;
      }
      if (dt >= startOfMonth) {
        monthCount++;
        monthNet += net;
        monthCollected += coll;
      }
      if (dt >= startOfYear) {
        yearCount++;
        yearNet += net;
        yearCollected += coll;
      }
    });

    return {
      today: { count: todayCount, net: todayNet, collected: todayCollected },
      week: { count: weekCount, net: weekNet, collected: weekCollected },
      month: { count: monthCount, net: monthNet, collected: monthCollected },
      year: { count: yearCount, net: yearNet, collected: yearCollected },
    };
  }, [dealsWithCalc]);

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    const now = new Date();
    const todayKey = getDayKey(now);

    // Start of week (Monday)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const q = searchQuery.trim().toLowerCase();

    return dealsWithCalc.filter((item) => {
      const { d, c, dt, dayKey, salesman, branchNorm } = item;

      // 1. Time Presets
      if (timePreset === "today" && dayKey !== todayKey) return false;
      if (timePreset === "this_week" && dt < startOfWeek) return false;
      if (timePreset === "this_month" && dt < startOfMonth) return false;
      if (timePreset === "this_year" && dt < startOfYear) return false;
      if (timePreset === "custom") {
        if (fromDate) {
          const from = new Date(fromDate + "T00:00:00");
          if (dt < from) return false;
        }
        if (toDate) {
          const to = new Date(toDate + "T23:59:59");
          if (dt > to) return false;
        }
      }

      // 2. Salesman Filter
      if (salesmanFilter !== "all") {
        if (salesman.toLowerCase() !== salesmanFilter.toLowerCase()) return false;
      }

      // 3. Branch Filter
      if (branchFilter !== "all") {
        if (branchNorm.toLowerCase() !== branchFilter.toLowerCase()) return false;
      }

      // 4. Payment Mode Filter
      if (paymentModeFilter !== "all") {
        const hasMode = (d.paymentLog || []).some(
          (p) => p.mode === paymentModeFilter && paymentStatus(p) !== "rejected"
        );
        if (!hasMode) return false;
      }

      // 5. Payment Status Filter
      if (paymentStatusFilter === "dues" && c.balance <= 0) return false;
      if (paymentStatusFilter === "settled" && c.balance > 0) return false;
      if (paymentStatusFilter === "partial" && !(c.totalCollected > 0 && c.balance > 0)) {
        return false;
      }

      // 6. Search Query (Customer name, Company, Mobile, Chassis, Deal ID, UTR / Cheque Ref)
      if (q) {
        const utrReferences = (d.paymentLog || [])
          .map((p) => p.reference || "")
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchText = [
          d.id,
          d.customer?.name,
          d.customer?.companyName,
          d.customer?.mobile,
          d.customer?.gstNo,
          d.vehicle?.chassisNo,
          d.vehicle?.model,
          d.vehicle?.dse,
          d.createdBy,
          d.branch,
          utrReferences,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!matchText.includes(q)) return false;
      }

      return true;
    });
  }, [
    dealsWithCalc,
    timePreset,
    fromDate,
    toDate,
    salesmanFilter,
    branchFilter,
    paymentModeFilter,
    paymentStatusFilter,
    searchQuery,
  ]);

  // Aggregated KPI Totals for Filtered Set
  const metrics = useMemo(() => {
    let totalNet = 0;
    let totalCollected = 0;
    let totalDue = 0;
    let duesCount = 0;

    const modeTotals = {
      Cash: 0,
      Cheque: 0,
      "NEFT/RTGS": 0,
      "Financer Disbursement": 0,
      "Exchange Vehicle": 0,
      "Advance Adjustment": 0,
    };
    let utrCount = 0;

    filteredDeals.forEach(({ d, c }) => {
      totalNet += c.netOnRoad;
      totalCollected += c.totalCollected;
      if (c.balance > 0) {
        totalDue += c.balance;
        duesCount++;
      }

      // Payment modes breakdown
      (d.paymentLog || []).forEach((p) => {
        if (paymentStatus(p) !== "rejected") {
          const m = p.mode || "Other";
          if (modeTotals[m] !== undefined) {
            modeTotals[m] += num(p.amount);
          } else {
            modeTotals[m] = (modeTotals[m] || 0) + num(p.amount);
          }
          if (m === "NEFT/RTGS" && p.reference) {
            utrCount++;
          }
        }
      });
    });

    const collectionRate =
      totalNet > 0 ? Math.min(100, Math.round((totalCollected / totalNet) * 100)) : 0;
    const avgDeal =
      filteredDeals.length > 0 ? Math.round(totalNet / filteredDeals.length) : 0;

    return {
      totalNet,
      totalCollected,
      totalDue,
      duesCount,
      collectionRate,
      avgDeal,
      modeTotals,
      utrCount,
    };
  }, [filteredDeals]);

  // Branch Breakdown Overview for Filtered Set
  const branchBreakdown = useMemo(() => {
    return BRANCHES.map((b) => {
      const list = filteredDeals.filter((x) => x.branchNorm === b);
      return {
        branch: b,
        count: list.length,
        net: list.reduce((s, x) => s + x.c.netOnRoad, 0),
        collected: list.reduce((s, x) => s + x.c.totalCollected, 0),
        balance: list.reduce((s, x) => s + x.c.outstandingDue, 0),
      };
    });
  }, [filteredDeals]);

  // Salesman Breakdown for Leaderboard Table
  const salesmanLeaderboard = useMemo(() => {
    const map = {};
    allSalesmen.forEach((sm) => {
      map[sm] = {
        name: sm,
        branch: "—",
        count: 0,
        todayCount: 0,
        net: 0,
        collected: 0,
        balance: 0,
      };
    });

    const now = new Date();
    const todayKey = getDayKey(now);

    filteredDeals.forEach(({ d, c, dt, salesman, branchNorm, dayKey }) => {
      if (!map[salesman]) {
        map[salesman] = {
          name: salesman,
          branch: branchNorm,
          count: 0,
          todayCount: 0,
          net: 0,
          collected: 0,
          balance: 0,
        };
      }
      map[salesman].count++;
      if (dayKey === todayKey) map[salesman].todayCount++;
      map[salesman].net += c.netOnRoad;
      map[salesman].collected += c.totalCollected;
      map[salesman].balance += c.outstandingDue;
      if (map[salesman].branch === "—") map[salesman].branch = branchNorm;
    });

    return Object.values(map)
      .filter((s) => s.count > 0 || salesmanFilter === s.name)
      .sort((a, b) => b.net - a.net);
  }, [allSalesmen, filteredDeals, salesmanFilter]);

  // Timeline Grouping (Day-wise / Week-wise / Month-wise)
  const timelineData = useMemo(() => {
    const groups = {};

    filteredDeals.forEach((item) => {
      let groupKey;
      let groupLabel;

      if (timelineGrouping === "day") {
        groupKey = item.dayKey;
        groupLabel = formatDisplayDate(item.dt);
      } else if (timelineGrouping === "week") {
        // Find Monday of that week
        const d = new Date(item.dt);
        d.setHours(0, 0, 0, 0);
        const day = d.getDay();
        const diff = (day === 0 ? -6 : 1) - day;
        d.setDate(d.getDate() + diff);
        groupKey = getDayKey(d);
        const endW = new Date(d);
        endW.setDate(endW.getDate() + 6);
        groupLabel = `${formatDisplayDate(d)} — ${formatDisplayDate(endW)}`;
      } else {
        // month
        groupKey = item.monthKey;
        groupLabel = item.dt.toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          label: groupLabel,
          deals: [],
          net: 0,
          collected: 0,
          balance: 0,
        };
      }
      groups[groupKey].deals.push(item);
      groups[groupKey].net += item.c.netOnRoad;
      groups[groupKey].collected += item.c.totalCollected;
      groups[groupKey].balance += item.c.outstandingDue;
    });

    return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
  }, [filteredDeals, timelineGrouping]);

  // Check if any filter is active
  const hasActiveFilters =
    timePreset !== "all" ||
    salesmanFilter !== "all" ||
    branchFilter !== "all" ||
    paymentModeFilter !== "all" ||
    paymentStatusFilter !== "all" ||
    searchQuery.trim() !== "" ||
    fromDate !== "" ||
    toDate !== "";

  const handleResetFilters = () => {
    setTimePreset("all");
    setFromDate("");
    setToDate("");
    setSalesmanFilter("all");
    setBranchFilter("all");
    setPaymentModeFilter("all");
    setPaymentStatusFilter("all");
    setSearchQuery("");
  };

  const [isExporting, setIsExporting] = useState(false);

  // Full Multi-Sheet Excel (.xlsx) Workbook Download
  const downloadExcel = async () => {
    setIsExporting(true);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      // Sheet 1: Sales & Dues Ledger
      const ledgerRows = filteredDeals.map(({ d, c, dt, salesman, branchNorm }) => {
        const validPayments = (d.paymentLog || []).filter(
          (p) => paymentStatus(p) !== "rejected"
        );
        const modes = validPayments.map((p) => p.mode).join("; ");
        const refs = validPayments
          .map((p) => (p.reference ? `${p.mode}: ${p.reference}` : p.mode))
          .join("; ");

        return {
          "Deal ID": d.id,
          "Date": formatDisplayDate(dt),
          "Dealership Branch": branchNorm,
          "Salesman (DSE)": salesman,
          "Customer Name": d.customer?.name || "",
          "Company Name": d.customer?.companyName || "",
          "Mobile": d.customer?.mobile || "",
          "GST Number": d.customer?.gstNo || "",
          "Model": d.vehicle?.model || "",
          "Chassis Number": d.vehicle?.chassisNo || "",
          "Deal Status": STATUS_META[d.status]?.label || d.status,
          "Net Order Value (INR)": c.netOnRoad,
          "Total Collected (INR)": c.totalCollected,
          "Outstanding Dues (INR)": c.outstandingDue,
          "Payment Modes": modes || "None",
          "Payment UTR / Cheque Refs": refs || "None",
        };
      });

      const wsLedger = XLSX.utils.json_to_sheet(ledgerRows);
      wsLedger["!cols"] = [
        { wch: 14 },
        { wch: 12 },
        { wch: 15 },
        { wch: 20 },
        { wch: 22 },
        { wch: 24 },
        { wch: 14 },
        { wch: 16 },
        { wch: 18 },
        { wch: 20 },
        { wch: 20 },
        { wch: 18 },
        { wch: 16 },
        { wch: 18 },
        { wch: 24 },
        { wch: 30 },
      ];
      XLSX.utils.book_append_sheet(wb, wsLedger, "Sales & Dues Ledger");

      // Sheet 2: Salesman Performance
      const salesmanRows = salesmanLeaderboard.map((sm, idx) => ({
        "Rank": idx + 1,
        "Salesman Name": sm.name,
        "Primary Branch": sm.branch,
        "Total Deals": sm.count,
        "Sales Today": sm.todayCount,
        "Net Sales Value (INR)": sm.net,
        "Amount Collected (INR)": sm.collected,
        "Outstanding Dues (INR)": sm.balance,
        "Collection Efficiency (%)": sm.net > 0 ? `${Math.round((sm.collected / sm.net) * 100)}%` : "0%",
      }));
      const wsSalesman = XLSX.utils.json_to_sheet(salesmanRows);
      wsSalesman["!cols"] = [
        { wch: 8 },
        { wch: 22 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 20 },
        { wch: 18 },
        { wch: 18 },
        { wch: 20 },
      ];
      XLSX.utils.book_append_sheet(wb, wsSalesman, "Salesman Performance");

      // Sheet 3: Branch Overview
      const branchRows = branchBreakdown.map((b) => ({
        "Dealership Branch": b.branch,
        "Total Deals": b.count,
        "Net Order Value (INR)": b.net,
        "Collected (INR)": b.collected,
        "Outstanding Dues (INR)": b.balance,
        "Collection Rate (%)": b.net > 0 ? `${Math.round((b.collected / b.net) * 100)}%` : "0%",
      }));
      const wsBranch = XLSX.utils.json_to_sheet(branchRows);
      wsBranch["!cols"] = [
        { wch: 18 },
        { wch: 12 },
        { wch: 20 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, wsBranch, "Branch Overview");

      // Sheet 4: Executive KPI Summary
      const summaryRows = [
        { "Key Performance Metric": "Dealership Company", "Value": "TATA PUNYA" },
        { "Key Performance Metric": "Software System", "Value": "Tata Punya ERP" },
        { "Key Performance Metric": "Total Filtered Deals", "Value": filteredDeals.length },
        { "Key Performance Metric": "Total Net Order Value (INR)", "Value": inr(metrics.totalNet) },
        { "Key Performance Metric": "Total Collected Revenue (INR)", "Value": inr(metrics.totalCollected) },
        { "Key Performance Metric": "Total Outstanding Customer Dues (INR)", "Value": inr(metrics.totalDue) },
        { "Key Performance Metric": "Pending Dues Deals Count", "Value": metrics.duesCount },
        { "Key Performance Metric": "Overall Collection Rate", "Value": `${metrics.collectionRate}%` },
        { "Key Performance Metric": "Average Deal Size (INR)", "Value": inr(metrics.avgDeal) },
        { "Key Performance Metric": "Cash Collected (INR)", "Value": inr(metrics.modeTotals["Cash"] || 0) },
        { "Key Performance Metric": "NEFT / RTGS Collected (INR)", "Value": inr(metrics.modeTotals["NEFT/RTGS"] || 0) },
        { "Key Performance Metric": "Financer Disbursement (INR)", "Value": inr(metrics.modeTotals["Financer Disbursement"] || 0) },
        { "Key Performance Metric": "Cheque Inflow (INR)", "Value": inr(metrics.modeTotals["Cheque"] || 0) },
        { "Key Performance Metric": "Verified UTR References Count", "Value": metrics.utrCount },
        { "Key Performance Metric": "Report Generated On", "Value": new Date().toLocaleString("en-IN") },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      wsSummary["!cols"] = [{ wch: 38 }, { wch: 26 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Executive Summary");

      const filename = `Tata_Punya_Sales_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.warn("Client-side Excel export failed, falling back to server route:", err);
      window.location.href = `/api/reports/export?branch=${encodeURIComponent(
        branchFilter
      )}&salesman=${encodeURIComponent(salesmanFilter)}`;
    } finally {
      setIsExporting(false);
    }
  };

  // CSV Export for Admin
  const exportToCSV = () => {
    const headers = [
      "Deal ID",
      "Date",
      "Branch",
      "Salesman",
      "Customer Name",
      "Company",
      "Mobile",
      "Chassis No",
      "Model",
      "Deal Status",
      "Net Order Value (INR)",
      "Total Collected (INR)",
      "Outstanding Dues (INR)",
      "Payment Modes",
      "Payment UTR / Cheque Ref Numbers",
    ];

    const rows = filteredDeals.map(({ d, c, dt, salesman, branchNorm }) => {
      const modes = (d.paymentLog || [])
        .map((p) => p.mode)
        .filter(Boolean)
        .join("; ");
      const refs = (d.paymentLog || [])
        .map((p) => p.reference)
        .filter(Boolean)
        .join("; ");

      return [
        `"${d.id}"`,
        `"${formatDisplayDate(dt)}"`,
        `"${branchNorm}"`,
        `"${salesman}"`,
        `"${(d.customer?.name || "").replace(/"/g, '""')}"`,
        `"${(d.customer?.companyName || "").replace(/"/g, '""')}"`,
        `"${d.customer?.mobile || ""}"`,
        `"${d.vehicle?.chassisNo || ""}"`,
        `"${d.vehicle?.model || ""}"`,
        `"${STATUS_META[d.status]?.label || d.status}"`,
        c.netOnRoad,
        c.totalCollected,
        c.outstandingDue,
        `"${modes}"`,
        `"${refs}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    link.download = `Tata_Punya_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ---------------------------------------------------------------- */}
      {/* 1. Executive Top Header Banner                                   */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-xl p-5 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="p-1.5 rounded-lg bg-blue-600 text-white">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h1
                className="text-2xl font-bold tracking-wide text-white uppercase"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {isAdmin ? "TATA PUNYA · Executive Dashboard" : "TATA PUNYA · Sales Report"}
              </h1>
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Admin Executive Privilege
                </span>
              ) : (
                <span className="text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  Tata Punya ERP · {normalizeBranch(session?.branch)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Tata Punya ERP — Track ongoing day-wise, week-wise, monthly, and yearly sales performance with salesman drilldowns,
              collected revenue, outstanding customer dues, and payment UTR verifications.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={downloadExcel}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                  title="Download full Microsoft Excel spreadsheet (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                  {isExporting ? "Generating Excel…" : `Download Excel Sheet (.xlsx)`}
                </button>
                <button
                  type="button"
                  onClick={exportToCSV}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                  title="Download raw CSV file"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>
              </>
            )}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Quick Sales Counters Row: Today, This Week, This Month, This Year */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-800/80">
          {[
            {
              id: "today",
              title: "Sales Today",
              count: quickCounters.today.count,
              net: quickCounters.today.net,
              coll: quickCounters.today.collected,
              active: timePreset === "today",
            },
            {
              id: "this_week",
              title: "This Week",
              count: quickCounters.week.count,
              net: quickCounters.week.net,
              coll: quickCounters.week.collected,
              active: timePreset === "this_week",
            },
            {
              id: "this_month",
              title: "This Month",
              count: quickCounters.month.count,
              net: quickCounters.month.net,
              coll: quickCounters.month.collected,
              active: timePreset === "this_month",
            },
            {
              id: "this_year",
              title: "This Year",
              count: quickCounters.year.count,
              net: quickCounters.year.net,
              coll: quickCounters.year.collected,
              active: timePreset === "this_year",
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTimePreset(timePreset === item.id ? "all" : item.id)}
              className={`text-left p-2.5 rounded-lg border transition-all ${
                item.active
                  ? "bg-blue-600/30 border-blue-400 text-white ring-1 ring-blue-400"
                  : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {item.title}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.2 rounded font-mono font-bold ${
                    item.active ? "bg-blue-500 text-white" : "bg-slate-700 text-blue-300"
                  }`}
                >
                  {item.count} {item.count === 1 ? "deal" : "deals"}
                </span>
              </div>
              <div
                className="text-lg font-bold mt-1 text-white"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {inr(item.net)}
              </div>
              <div className="text-[10px] text-emerald-400 font-medium">
                Collected: {inr(item.coll)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 2. Executive Multi-Filter Bar                                     */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        {/* Time Period Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-700" /> Timeframe:
          </span>
          {[
            { id: "all", label: "All Time" },
            { id: "today", label: "Today" },
            { id: "this_week", label: "This Week" },
            { id: "this_month", label: "This Month" },
            { id: "this_year", label: "This Year" },
            { id: "custom", label: "Custom Range" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTimePreset(t.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                timePreset === t.id
                  ? "bg-blue-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}

          {/* Custom Date Inputs */}
          {timePreset === "custom" && (
            <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-wrap bg-blue-50/60 border border-blue-200 rounded-lg p-1.5">
              <div className="flex items-center gap-1 text-xs text-slate-700">
                <span className="font-semibold text-[11px]">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-700">
                <span className="font-semibold text-[11px]">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
          {/* Salesman Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Users className="w-3 h-3 text-blue-600" /> Salesman Name
            </label>
            <select
              value={salesmanFilter}
              onChange={(e) => setSalesmanFilter(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white font-medium focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 outline-none"
            >
              <option value="all">All Salesmen ({allSalesmen.length})</option>
              {allSalesmen.map((sm) => (
                <option key={sm} value={sm}>
                  {sm}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-blue-600" /> Dealership Branch
            </label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white font-medium focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 outline-none"
            >
              <option value="all">All Branches (Sasaram, Bihiya, Buxas, Mohaniya)</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-blue-600" /> Payment Mode
            </label>
            <select
              value={paymentModeFilter}
              onChange={(e) => setPaymentModeFilter(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white font-medium focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 outline-none"
            >
              <option value="all">All Modes (Cash, Cheque, RTGS, etc.)</option>
              {PAYMENT_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status / Dues Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Wallet className="w-3 h-3 text-blue-600" /> Dues / Settlement
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white font-medium focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 outline-none"
            >
              <option value="all">All Settlements</option>
              <option value="dues">⚠️ Has Outstanding Dues (Pending)</option>
              <option value="settled">✅ Fully Paid / Cleared</option>
              <option value="partial">🔄 Partial Payment Logged</option>
            </select>
          </div>
        </div>

        {/* Live Search Bar */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, company, phone, chassis number, deal ID, or payment UTR / Cheque Ref..."
            className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 3. Filtered KPI Overview Cards                                    */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Deals */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500 font-semibold">
            <span>Total Sales</span>
            <span className="text-[11px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
              {filteredDeals.length} / {deals.length}
            </span>
          </div>
          <div
            className="text-2xl font-bold mt-1.5 text-blue-900"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {filteredDeals.length} {filteredDeals.length === 1 ? "Deal" : "Deals"}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Avg deal: <b className="text-slate-700">{inr(metrics.avgDeal)}</b>
          </div>
        </div>

        {/* Net Order Value */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
            Net Order Value
          </div>
          <div
            className="text-2xl font-bold mt-1.5 text-slate-900"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {inr(metrics.totalNet)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Total revenue on-road</div>
        </div>

        {/* Collected Revenue */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500 font-semibold">
            <span>Collected</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {metrics.collectionRate}%
            </span>
          </div>
          <div
            className="text-2xl font-bold mt-1.5 text-emerald-700"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {inr(metrics.totalCollected)}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all"
              style={{ width: `${metrics.collectionRate}%` }}
            />
          </div>
        </div>

        {/* Outstanding Dues */}
        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm bg-gradient-to-br from-white to-amber-50/40">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-amber-800 font-semibold">
            <span>Outstanding Dues</span>
            {metrics.duesCount > 0 && (
              <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                {metrics.duesCount} pending
              </span>
            )}
          </div>
          <div
            className="text-2xl font-bold mt-1.5 text-amber-700"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {inr(metrics.totalDue)}
          </div>
          <div className="text-[11px] text-amber-800 mt-1">Pending dealership collection</div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 4. Payment Modes Breakdown Pills                                  */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-blue-700" />
            Payment Modes & Verified UTR Inflow
          </span>
          <span className="text-[11px] font-mono text-slate-500 font-normal">
            UTR count: {metrics.utrCount}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {[
            {
              mode: "Cash",
              label: "💵 Cash",
              amt: metrics.modeTotals["Cash"] || 0,
              color: "text-emerald-800 bg-emerald-50/80 border-emerald-200",
            },
            {
              mode: "NEFT/RTGS",
              label: "🏦 NEFT / RTGS",
              amt: metrics.modeTotals["NEFT/RTGS"] || 0,
              color: "text-blue-800 bg-blue-50/80 border-blue-200",
            },
            {
              mode: "Financer Disbursement",
              label: "🏛️ Financer",
              amt: metrics.modeTotals["Financer Disbursement"] || 0,
              color: "text-indigo-800 bg-indigo-50/80 border-indigo-200",
            },
            {
              mode: "Cheque",
              label: "📝 Cheque",
              amt: metrics.modeTotals["Cheque"] || 0,
              color: "text-purple-800 bg-purple-50/80 border-purple-200",
            },
            {
              mode: "Advance Adjustment",
              label: "🔄 Advance Adjust",
              amt: metrics.modeTotals["Advance Adjustment"] || 0,
              color: "text-slate-800 bg-slate-100 border-slate-200",
            },
          ].map((item) => (
            <div
              key={item.mode}
              onClick={() =>
                setPaymentModeFilter(paymentModeFilter === item.mode ? "all" : item.mode)
              }
              className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${item.color} ${
                paymentModeFilter === item.mode ? "ring-2 ring-blue-600" : "hover:shadow-sm"
              }`}
            >
              <div className="font-semibold text-[11px] truncate">{item.label}</div>
              <div className="font-bold text-sm mt-0.5">{inr(item.amt)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 5. Branch Sales Overview Card                                     */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div
            className="font-bold text-slate-800 text-lg tracking-wide uppercase"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Branch Sales & Collection Distribution
          </div>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Sasaram · Bihiya · Buxas · Mohaniya
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {branchBreakdown.map((bs) => (
            <div
              key={bs.branch}
              onClick={() =>
                setBranchFilter(branchFilter === bs.branch ? "all" : bs.branch)
              }
              className={`border rounded-lg p-3 space-y-2 cursor-pointer transition-all ${
                branchFilter === bs.branch
                  ? "border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-500"
                  : "border-slate-200 bg-slate-50/70 hover:bg-slate-100/70"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{bs.branch}</span>
                <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {bs.count} {bs.count === 1 ? "deal" : "deals"}
                </span>
              </div>
              <div className="text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Order Value:</span>
                  <b className="text-slate-800">{inr(bs.net)}</b>
                </div>
                <div className="flex justify-between">
                  <span>Collected:</span>
                  <b className="text-emerald-700">{inr(bs.collected)}</b>
                </div>
                <div className="flex justify-between">
                  <span>Outstanding:</span>
                  <b className={bs.balance > 0 ? "text-amber-700 font-bold" : "text-slate-500"}>
                    {inr(bs.balance)}
                  </b>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 6. Dashboard Sub-Views Navigation                                */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 pt-2 overflow-x-auto">
          <div className="flex space-x-2">
            {[
              {
                id: "ledger",
                label: "Sales & Payment Ledger",
                icon: Layers,
                count: filteredDeals.length,
              },
              {
                id: "timeline",
                label: "Ongoing Timeline Details",
                icon: TrendingUp,
                count: timelineData.length,
              },
              {
                id: "salesmen",
                label: "Salesman Performance",
                icon: UserCheck,
                count: salesmanLeaderboard.length,
              },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setActiveView(v.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                  activeView === v.id
                    ? "border-blue-700 text-blue-700 bg-white rounded-t-lg"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                }`}
              >
                <v.icon className="w-3.5 h-3.5" />
                {v.label}
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
                  {v.count}
                </span>
              </button>
            ))}
          </div>

          {activeView === "timeline" && (
            <div className="flex items-center gap-1 pb-1">
              <span className="text-[11px] font-semibold text-slate-500 mr-1 hidden sm:inline">
                Group by:
              </span>
              {[
                { id: "day", label: "Day-wise" },
                { id: "week", label: "Week-wise" },
                { id: "month", label: "Month-wise" },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setTimelineGrouping(g.id)}
                  className={`text-[11px] px-2.5 py-1 rounded font-semibold transition-colors ${
                    timelineGrouping === g.id
                      ? "bg-blue-700 text-white"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View Content */}
        <div className="p-4">
          {/* VIEW 1: Sales & Payment Ledger Table */}
          {activeView === "ledger" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  Showing <b>{filteredDeals.length}</b> records matching filters
                </span>
                {isAdmin && (
                  <span className="text-[11px] text-blue-700 font-medium">
                    Click "View Deal" to inspect or edit any transaction.
                  </span>
                )}
              </div>

              {filteredDeals.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm space-y-1">
                  <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600">No sales deals found</p>
                  <p className="text-xs">Try adjusting your filters or search keywords above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date & Deal ID</th>
                        <th className="py-2.5 px-3">Customer & Mobile</th>
                        <th className="py-2.5 px-3">Salesman & Branch</th>
                        <th className="py-2.5 px-3 text-right">Net Order Value</th>
                        <th className="py-2.5 px-3 text-right">Collected</th>
                        <th className="py-2.5 px-3 text-right">Outstanding Due</th>
                        <th className="py-2.5 px-3">Payment Modes & UTR Ref</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDeals.slice().reverse().map(({ d, c, dt, salesman, branchNorm }) => {
                        const payments = d.paymentLog || [];
                        const validPayments = payments.filter(
                          (p) => paymentStatus(p) !== "rejected"
                        );

                        return (
                          <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Date & ID */}
                            <td className="py-2.5 px-3 font-mono">
                              <div className="font-bold text-slate-900">{d.id}</div>
                              <div className="text-[11px] text-slate-400">
                                {formatDisplayDate(dt)}
                              </div>
                            </td>

                            {/* Customer & Mobile */}
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-800">
                                {formatCustomer(d.customer)}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {d.customer?.mobile || "No phone"}
                                {d.vehicle?.model ? ` · ${d.vehicle.model}` : ""}
                              </div>
                            </td>

                            {/* Salesman & Branch */}
                            <td className="py-2.5 px-3">
                              <div className="font-medium text-slate-800">{salesman}</div>
                              <span className="inline-block text-[10px] font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-100">
                                {branchNorm}
                              </span>
                            </td>

                            {/* Net Order Value */}
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              {inr(c.netOnRoad)}
                            </td>

                            {/* Collected */}
                            <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                              {inr(c.totalCollected)}
                            </td>

                            {/* Outstanding Due */}
                            <td className="py-2.5 px-3 text-right">
                              {c.balance > 0 ? (
                                <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  {inr(c.balance)}
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-medium text-[11px]">
                                  Paid in Full
                                </span>
                              )}
                            </td>

                            {/* Payment Modes & UTR References */}
                            <td className="py-2.5 px-3">
                              {validPayments.length === 0 ? (
                                <span className="text-slate-400 italic text-[11px]">
                                  No payment logged
                                </span>
                              ) : (
                                <div className="space-y-1 max-w-xs">
                                  {validPayments.map((p, idx) => (
                                    <div
                                      key={p.id || idx}
                                      className="text-[11px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 flex items-center justify-between gap-1"
                                    >
                                      <span className="font-semibold text-blue-800">
                                        {p.mode}:
                                      </span>
                                      <span className="font-mono text-slate-600 truncate">
                                        {p.reference ? `Ref/UTR: ${p.reference}` : "No ref"}
                                      </span>
                                      <span className="font-bold text-slate-900 shrink-0">
                                        {inr(p.amount)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* Deal Status */}
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{
                                  background: STATUS_META[d.status]?.bg || "#f1f2f4",
                                  color: STATUS_META[d.status]?.color || "#6b7280",
                                }}
                              >
                                {STATUS_META[d.status]?.label || d.status}
                              </span>
                            </td>

                            {/* Action Button */}
                            <td className="py-2.5 px-3 text-center">
                              {onOpen && (
                                <button
                                  type="button"
                                  onClick={() => onOpen(d.id)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View
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
          )}

          {/* VIEW 2: Ongoing Timeline Grouped Details */}
          {activeView === "timeline" && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">
                Tracking ongoing sales grouped <b>{timelineGrouping}-wise</b>. Showing{" "}
                <b>{timelineData.length}</b> time periods.
              </div>

              {timelineData.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No sales found in the selected timeframe.
                </div>
              ) : (
                <div className="space-y-3">
                  {timelineData.map((group) => {
                    const collectionRate =
                      group.net > 0 ? Math.round((group.collected / group.net) * 100) : 0;

                    return (
                      <div
                        key={group.key}
                        className="bg-slate-50/70 border border-slate-200 rounded-lg p-3.5 hover:border-blue-300 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                          <div>
                            <span className="font-bold text-slate-900 text-sm">
                              {group.label}
                            </span>
                            <span className="ml-2 text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              {group.deals.length} {group.deals.length === 1 ? "Sale" : "Sales"}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs">
                            <div>
                              <span className="text-slate-500">Net Sales:</span>{" "}
                              <b className="text-slate-900 text-sm">{inr(group.net)}</b>
                            </div>
                            <div>
                              <span className="text-slate-500">Collected:</span>{" "}
                              <b className="text-emerald-700">{inr(group.collected)}</b>
                            </div>
                            <div>
                              <span className="text-slate-500">Dues:</span>{" "}
                              <b className={group.balance > 0 ? "text-amber-700" : "text-slate-600"}>
                                {inr(group.balance)}
                              </b>
                            </div>
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">
                              {collectionRate}%
                            </span>
                          </div>
                        </div>

                        {/* List of deals in this time period */}
                        <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {group.deals.map(({ d, c, salesman, branchNorm }) => (
                            <div
                              key={d.id}
                              onClick={() => onOpen && onOpen(d.id)}
                              className="bg-white border border-slate-200 rounded p-2 text-xs flex items-center justify-between gap-2 hover:border-blue-400 cursor-pointer shadow-2xs"
                            >
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-800 truncate">
                                  {formatCustomer(d.customer)}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  <span className="text-blue-700 font-medium">{branchNorm}</span> ·{" "}
                                  {salesman} · {d.id}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-bold text-slate-900">{inr(c.netOnRoad)}</div>
                                <div className="text-[10px] text-emerald-600">
                                  Rec: {inr(c.totalCollected)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: Salesman Performance Leaderboard */}
          {activeView === "salesmen" && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">
                Track and compare salesman deal closures, revenue contribution, and collection
                efficiency.
              </div>

              {salesmanLeaderboard.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No salesman activity in this filtered view.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Salesman Name</th>
                        <th className="py-2.5 px-3">Primary Branch</th>
                        <th className="py-2.5 px-3 text-center">Deals Count</th>
                        <th className="py-2.5 px-3 text-center">Today's Sales</th>
                        <th className="py-2.5 px-3 text-right">Net Sales Value</th>
                        <th className="py-2.5 px-3 text-right">Amount Collected</th>
                        <th className="py-2.5 px-3 text-right">Outstanding Dues</th>
                        <th className="py-2.5 px-3 text-center">Collection %</th>
                        <th className="py-2.5 px-3 text-center">Filter Salesman</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {salesmanLeaderboard.map((sm, index) => {
                        const eff =
                          sm.net > 0 ? Math.round((sm.collected / sm.net) * 100) : 0;
                        const isFiltered = salesmanFilter === sm.name;

                        return (
                          <tr
                            key={sm.name}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isFiltered ? "bg-blue-50/60 font-semibold" : ""
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] text-slate-400 w-4">
                                  #{index + 1}
                                </span>
                                <span className="font-bold text-slate-900">{sm.name}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{sm.branch}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-blue-800">
                              {sm.count}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {sm.todayCount > 0 ? (
                                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                                  {sm.todayCount} today
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              {inr(sm.net)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                              {inr(sm.collected)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-amber-700">
                              {sm.balance > 0 ? inr(sm.balance) : "₹0"}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                {eff}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setSalesmanFilter(isFiltered ? "all" : sm.name)
                                }
                                className={`text-[11px] px-2.5 py-1 rounded font-semibold transition-colors ${
                                  isFiltered
                                    ? "bg-blue-700 text-white"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                              >
                                {isFiltered ? "Active Filter" : "Filter Deals"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
