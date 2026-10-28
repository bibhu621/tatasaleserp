import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { fetchDeals } from "@/lib/db";
import { isDealForUser, filterDealsForUser } from "@/lib/dealUtils";
import * as XLSX from "xlsx";

const num = (v) => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));

const STATUS_META = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  rejected: "Rejected",
  approved: "Approved",
  delivered: "Delivered",
  closed: "Closed",
};

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

  // Auto-calculated TCS: 1% on net price only if net price > 10,00,000 (10 Lakhs)
  const tcs = netPrice > 1000000 ? Math.round(netPrice * 0.01) : 0;

  const adds = [
    "tr",
    "insurance",
    "registration",
    "permit",
    "fleetedgeVltd",
    "vasAmc",
    "bodyFabCharge",
    "choiceHsrp",
    "transportation",
  ].reduce((s, k) => s + num(p[k]), tcs);

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
    tcs,
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

export async function GET(request) {
  const auth = requireAuth(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    let deals = await fetchDeals();
    const isSales = auth.session.role === "sales";

    // If salesman, restrict deals strictly to his own deals
    if (isSales) {
      deals = filterDealsForUser(deals, auth.session);
    }

    const { searchParams } = new URL(request.url);
    const branchFilter = searchParams.get("branch") || "all";
    const salesmanFilter = isSales
      ? auth.session.name || "My Deals"
      : searchParams.get("salesman") || "all";
    const approvalStatus = searchParams.get("approvalStatus") || "all";
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    let filtered = deals.map((d) => {
      const c = calcDeal(d);
      const dt = d.createdAt ? new Date(d.createdAt) : new Date();
      const salesman = (d.vehicle?.dse || d.createdBy || "Unassigned").trim();
      const branch = d.branch || "Sasaram";
      return { d, c, dt, salesman, branch };
    });

    if (branchFilter !== "all") {
      filtered = filtered.filter(
        (x) => x.branch.toLowerCase() === branchFilter.toLowerCase()
      );
    }
    if (!isSales && salesmanFilter !== "all") {
      filtered = filtered.filter(
        (x) => x.salesman.toLowerCase() === salesmanFilter.toLowerCase()
      );
    }
    if (approvalStatus === "approved") {
      filtered = filtered.filter(
        (x) =>
          x.d.status === "approved" ||
          x.d.status === "delivered" ||
          x.d.status === "closed" ||
          x.d.approval?.status === "approved"
      );
    } else if (approvalStatus === "pending") {
      filtered = filtered.filter(
        (x) =>
          x.d.status === "pending_approval" ||
          x.d.status === "draft" ||
          x.d.approval?.status === "pending_approval" ||
          x.d.approval?.status === "draft" ||
          x.d.approval?.status === "pending"
      );
    } else if (approvalStatus === "rejected") {
      filtered = filtered.filter(
        (x) => x.d.status === "rejected" || x.d.approval?.status === "rejected"
      );
    }
    if (fromDate) {
      const f = new Date(fromDate + "T00:00:00");
      filtered = filtered.filter((x) => x.dt >= f);
    }
    if (toDate) {
      const t = new Date(toDate + "T23:59:59");
      filtered = filtered.filter((x) => x.dt <= t);
    }

    const wb = XLSX.utils.book_new();

    // 1. Comprehensive Ledger Sheet with EVERY single field guaranteed
    const ledgerSheetName = isSales ? "My Sales Ledger" : "Sales Ledger";
    const ledgerRows = filtered.map(({ d, c, dt, salesman, branch }) => {
      const validPayments = (d.paymentLog || []).filter(
        (p) => paymentStatus(p) !== "rejected"
      );
      const modes = validPayments.map((p) => p.mode).filter(Boolean).join("; ");
      const refs = validPayments
        .map((p) => (p.reference ? `${p.mode}: ${p.reference}` : p.mode))
        .filter(Boolean)
        .join("; ");
      const paymentDates = validPayments
        .map((p) => p.date)
        .filter(Boolean)
        .join("; ");

      const otherDiscountsStr = (d.pricing?.otherDiscounts || [])
        .map((o) => `${o.label || "Discount"}: ₹${o.amount}`)
        .join("; ");

      const cust = d.customer || {};
      const veh = d.vehicle || {};
      const pr = d.pricing || {};
      const off = d.officeUse || {};
      const app = d.approval || {};
      const expCl = d.expenseClosed || {};

      return {
        // Deal Core Identifiers & Audit
        "Deal ID": d.id || "",
        "Deal Date": dt ? dt.toLocaleDateString("en-IN") : "",
        "Dealership Branch": branch || "Sasaram",
        "Deal Status": STATUS_META[d.status] || d.status || "",
        "Approval Status": app.status || d.status || "",
        "Approved / Actioned By": app.by || "",
        "Approval Date": app.at || "",
        "Approval Remarks": app.remarks || "",
        "Created By": d.createdBy || "",
        "Created By Username": d.createdByUsername || "",

        // Sales Personnel
        "Salesman (DSE)": salesman || veh.dse || d.createdBy || "Unassigned",
        "DSM": veh.dsm || "",

        // Customer Information
        "Customer Name": cust.name || "",
        "Company Name": cust.companyName || "",
        "S/o, W/o, D/o": cust.soWo || "",
        "DOB / Age": cust.dob || "",
        "Mobile": cust.mobile || "",
        "PAN No": cust.pan || "",
        "Aadhar No": cust.aadhar || "",
        "GST No": cust.gstNo || "",
        "Address": cust.address || "",
        "P.O.": cust.po || "",
        "P.S.": cust.ps || "",
        "District": cust.district || "",
        "PIN": cust.pin || "",
        "State": cust.state || "",

        // Vehicle Specifications
        "Model": veh.model || "",
        "Colour": veh.colour || "",
        "Body Type": veh.bodyType || "",
        "Chassis No": veh.chassisNo || "",
        "Engine No": veh.engineNo || "",
        "Fuel Type": veh.fuelType || "",
        "DOD": veh.dod || "",
        "Financer Name": veh.financerName || "",
        "RTO": veh.rto || "",

        // Pricing & Discounts Breakdown (INR)
        "Exshowroom Price (INR)": num(pr.exshowroom),
        "TML Cash Discount (INR)": num(pr.tmlDiscount),
        "Dealer Discount (INR)": num(pr.dealerDiscount),
        "VAS NFA Discount (INR)": num(pr.vasNfaDiscount),
        "Other Discounts Breakdown": otherDiscountsStr || "",
        "Other Discounts Total (INR)": c.otherDiscountsTotal || 0,
        "Net Price of Vehicle (INR)": c.netPrice || 0,
        "TCS 1% (INR)": c.tcs || 0,
        "TR Charge (INR)": num(pr.tr),
        "Insurance (INR)": num(pr.insurance),
        "Registration (INR)": num(pr.registration),
        "Permit (INR)": num(pr.permit),
        "Fleetedge / VLTD (INR)": num(pr.fleetedgeVltd),
        "VAS (AMC/FMS) (INR)": num(pr.vasAmc),
        "Body Fabrication Charge (INR)": num(pr.bodyFabCharge),
        "Choice No + HSRP (INR)": num(pr.choiceHsrp),
        "Transportation (INR)": num(pr.transportation),
        "Total On-Road Price (INR)": c.totalOnRoad || 0,
        "Exchange Bonus (INR)": num(pr.exchangeBonus),
        "NET ON-ROAD PRICE (INR)": c.netOnRoad || 0,

        // Ledger / Collections (INR)
        "Total Collected (INR)": c.totalCollected || 0,
        "Outstanding Due (INR)": c.outstandingDue || 0,
        "Approved Adjustments (INR)": c.approvedAdjustments || 0,
        "Pending Adjustments (INR)": c.pendingAdjustments || 0,
        "Net Balance (INR)": c.balance || 0,
        "Payment Modes": modes || "None",
        "Payment UTR / Cheque Ref": refs || "None",
        "Payment Dates": paymentDates || "None",
        "Payment Transactions Count": validPayments.length,

        // Office Use & Retentions (INR)
        "Office Remarks": off.remarks || "",
        "Body Fab Name": off.bodyFabName || "",
        "Interest Cost (INR)": num(off.interestCost),
        "Retention on Vehicle (INR)": num(off.retentionVehicle),
        "Retention on Body (INR)": num(off.retentionBody),
        "Retention on VAS (INR)": num(off.retentionVas),
        "Retention on Others (INR)": num(off.retentionOthers),

        // Expense & Process Closures
        "Insurance Expense Closed": expCl.insurance ? "Yes" : "No",
        "HSRP Expense Closed": expCl.hsrp ? "Yes" : "No",
        "TR Expense Closed": expCl.tr ? "Yes" : "No",
        "Registration Expense Closed": expCl.registration ? "Yes" : "No",
      };
    });

    const wsLedger = XLSX.utils.json_to_sheet(ledgerRows);
    XLSX.utils.book_append_sheet(wb, wsLedger, ledgerSheetName);

    // 2. Salesman Sheet (Admin only)
    if (!isSales) {
      const smMap = {};
      filtered.forEach(({ c, salesman, branch }) => {
        if (!smMap[salesman]) {
          smMap[salesman] = {
            "Salesman Name": salesman,
            "Branch": branch,
            "Total Deals": 0,
            "Net Sales Value (INR)": 0,
            "Collected (INR)": 0,
            "Outstanding Dues (INR)": 0,
          };
        }
        smMap[salesman]["Total Deals"]++;
        smMap[salesman]["Net Sales Value (INR)"] += c.netOnRoad;
        smMap[salesman]["Collected (INR)"] += c.totalCollected;
        smMap[salesman]["Outstanding Dues (INR)"] += c.outstandingDue;
      });

      const wsSalesman = XLSX.utils.json_to_sheet(Object.values(smMap));
      XLSX.utils.book_append_sheet(wb, wsSalesman, "Salesman Summary");
    }

    // 3. Summary Sheet
    const totalNet = filtered.reduce((s, x) => s + x.c.netOnRoad, 0);
    const totalCollected = filtered.reduce((s, x) => s + x.c.totalCollected, 0);
    const totalDue = filtered.reduce((s, x) => s + x.c.outstandingDue, 0);

    const summaryRows = [
      { Metric: "Dealership Company", Value: "TATA PUNYA" },
      { Metric: "Software System", Value: "Tata Punya ERP" },
      { Metric: "Report Scope", Value: isSales ? `Sales Executive: ${auth.session.name}` : "Dealership Wide" },
      { Metric: isSales ? "My Total Deals" : "Total Deals", Value: filtered.length },
      { Metric: isSales ? "My Net Sales Value (INR)" : "Total Net Order Value (INR)", Value: totalNet },
      { Metric: isSales ? "My Collected Inflow (INR)" : "Total Collected (INR)", Value: totalCollected },
      { Metric: isSales ? "My Pending Customer Dues (INR)" : "Total Outstanding Dues (INR)", Value: totalDue },
      {
        Metric: "Collection Rate (%)",
        Value: totalNet > 0 ? Math.round((totalCollected / totalNet) * 100) + "%" : "0%",
      },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, isSales ? "My Performance Summary" : "Executive Summary");

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
    const filename = isSales
      ? `Tata_Punya_My_Sales_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
      : `Tata_Punya_Sales_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
