import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { fetchDeals } from "@/lib/db";
import { isDealForUser, filterDealsForUser } from "@/lib/dealUtils";
import * as XLSX from "xlsx";

const num = (v) => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));

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

  const balance = netOnRoad - totalCollected - approvedAdjustments;

  return {
    netPrice,
    totalOnRoad,
    netOnRoad,
    totalCollected,
    balance,
    outstandingDue: Math.max(0, balance),
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
    if (fromDate) {
      const f = new Date(fromDate + "T00:00:00");
      filtered = filtered.filter((x) => x.dt >= f);
    }
    if (toDate) {
      const t = new Date(toDate + "T23:59:59");
      filtered = filtered.filter((x) => x.dt <= t);
    }

    const wb = XLSX.utils.book_new();

    // 1. Ledger Sheet
    const ledgerSheetName = isSales ? "My Sales Ledger" : "Sales Ledger";
    const ledgerRows = filtered.map(({ d, c, dt, salesman, branch }) => {
      const validPayments = (d.paymentLog || []).filter(
        (p) => paymentStatus(p) !== "rejected"
      );
      const modes = validPayments.map((p) => p.mode).join("; ");
      const refs = validPayments
        .map((p) => (p.reference ? `${p.mode}: ${p.reference}` : p.mode))
        .join("; ");

      return {
        "Deal ID": d.id,
        "Date": dt.toLocaleDateString("en-IN"),
        "Dealership Branch": branch,
        "Salesman (DSE)": salesman,
        "Customer Name": d.customer?.name || "",
        "Company Name": d.customer?.companyName || "",
        "Mobile": d.customer?.mobile || "",
        "GST No": d.customer?.gstNo || "",
        "Model": d.vehicle?.model || "",
        "Chassis No": d.vehicle?.chassisNo || "",
        "Deal Status": d.status,
        "Net Order Value (INR)": c.netOnRoad,
        "Collected (INR)": c.totalCollected,
        "Outstanding Due (INR)": c.outstandingDue,
        "Payment Modes": modes || "None",
        "Payment UTR / Cheque Ref": refs || "None",
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
