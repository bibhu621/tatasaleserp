"use client";

import React from "react";

/* ---------------------------------------------------------------------- */
/*  Letterhead details — edit here if anything is misspelt                 */
/* ---------------------------------------------------------------------- */

const DEALER = {
  name: "Punya Autowheels Pvt. Ltd.",
  tagline: "Channel Partner for Commercial Vehicles of Tata Motors",
  facility: "Corporate Office & 3S Facility",
  addresses: [
    "1. Kurdun H.N. A-2, Sasaram Road, Rohtas - 821113, Bihar",
    "2. Bihiya A.V. Road, Distt. Bhojpur - 802157, Bihar",
  ],
  contact: "Office: +91-6031856711, Email: sales@punyaautowheels.com",
  gstin: "10AAQCP6173J1ZS",
  punyaLogo: "/punya-logo.png",
  tataLogo: "/tata-motors-logo.png",
};

/* ---------------------------------------------------------------------- */
/*  Small helpers (self-contained so this file has no other dependencies)  */
/* ---------------------------------------------------------------------- */

const num = (v) => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));
const inr = (v) => "₹" + Math.round(num(v)).toLocaleString("en-IN");
const paymentStatus = (e) => e.status || (e.verified ? "verified" : "pending");
const fmtDate = (dt) =>
  dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const partyName = (c) => {
  if (!c) return "Untitled customer";
  const comp = (c.companyName || "").trim();
  const name = (c.name || "").trim();
  return comp && name ? `${comp} (${name})` : comp || name || "Untitled customer";
};

const STATUS_LABEL = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  rejected: "Rejected",
  approved: "Approved",
  delivered: "Delivered",
  closed: "Closed",
};
const PRESET_LABEL = {
  all: "All Time",
  today: "Today",
  this_week: "This Week",
  this_month: "This Month",
  this_year: "This Year",
};
const APPROVAL_LABEL = { approved: "Approved", pending: "Pending", rejected: "Rejected" };
const SETTLEMENT_LABEL = { dues: "Has Outstanding Dues", settled: "Fully Paid", partial: "Partial Payment" };

/* ---------------------------------------------------------------------- */
/*  Styles — screen: hidden, print: shown                                  */
/* ---------------------------------------------------------------------- */

const CSS = `
.rps{display:none}
@media print{
  @page{size:A4 landscape;margin:8mm}
  .rps{display:block;color:#000;background:#fff;font:11px/1.35 Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .rps *{box-sizing:border-box}
  .rps .lh{display:grid;grid-template-columns:210px 1fr 210px;gap:10px;align-items:center;border-bottom:2px solid #000;padding-bottom:6px}
  .rps .lh-logo{width:80px;height:80px;overflow:hidden;position:relative}
  .rps .lh-logo img{position:absolute;width:108px;left:-16px;top:-13px;max-width:none}
  .rps .lh-mid{text-align:center}
  .rps .lh-name{white-space:nowrap;font:800 27px/1.1 Georgia,'Times New Roman',serif;letter-spacing:.2px}
  .rps .lh-tag{font-weight:700;font-size:12px;margin-top:2px}
  .rps .lh-fac{font-weight:700;font-size:10.5px;margin-top:3px}
  .rps .lh-addr{font-size:9.5px;line-height:1.35}
  .rps .lh-right{text-align:right}
  .rps .lh-right img{width:200px;height:auto;display:inline-block}
  .rps .lh-gst{font:700 11px 'Courier New',monospace;margin-top:4px}
  .rps .title{text-align:center;font:700 14px Georgia,serif;text-decoration:underline;margin:8px 0 4px}
  .rps .meta{display:flex;justify-content:space-between;gap:12px;font-size:10px;margin-bottom:6px}
  .rps .filters{font-size:10px;margin-bottom:6px}
  .rps .filters b{font-weight:700}
  .rps table{width:100%;border-collapse:collapse;font-size:10px}
  .rps th,.rps td{border:1px solid #000;padding:3px 5px;vertical-align:top;text-align:left}
  .rps th{background:#e9e9e9;font-weight:700;text-transform:uppercase;font-size:9px;letter-spacing:.03em}
  .rps .r{text-align:right}
  .rps .c{text-align:center}
  .rps .mono{font-family:'Courier New',monospace}
  .rps tr{page-break-inside:avoid}
  .rps thead{display:table-header-group}
  .rps tfoot td{font-weight:700;background:#f3f3f3}
  .rps .grp td{background:#dcdcdc;font-weight:700}
  .rps .pay{white-space:nowrap}
  .rps .sig{display:flex;justify-content:flex-end;gap:60px;margin-top:34px;font-size:10px}
  .rps .sig div{border-top:1px solid #000;padding-top:3px;min-width:150px;text-align:center}
  .rps .empty{border:1px solid #000;text-align:center;padding:18px}
}
`;

/* ---------------------------------------------------------------------- */
/*  Component                                                              */
/* ---------------------------------------------------------------------- */

export default function ReportPrintSheet({
  activeView,
  isSales,
  session,
  filteredDeals,
  timelineData,
  timelineGrouping,
  salesmanLeaderboard,
  metrics,
  filters,
}) {
  const f = filters || {};

  const title =
    activeView === "ledger"
      ? isSales
        ? "My Sales & Payment Ledger"
        : "Sales & Payment Ledger"
      : activeView === "timeline"
      ? `Sales & Collections Timeline (${timelineGrouping}-wise)`
      : "Sales Executive Performance";

  const timeframe =
    f.timePreset === "custom"
      ? `${f.fromDate || "start"} to ${f.toDate || "today"}`
      : PRESET_LABEL[f.timePreset] || "All Time";

  const filterItems = [
    ["Timeframe", timeframe],
    ["Branch", f.branchFilter && f.branchFilter !== "all" ? f.branchFilter : "All Branches"],
    ["Sales Executive", f.salesmanFilter && f.salesmanFilter !== "all" ? f.salesmanFilter : isSales ? session?.name : "All"],
    ["Status", APPROVAL_LABEL[f.approvalStatusFilter] || "All"],
    ["Payment Mode", f.paymentModeFilter && f.paymentModeFilter !== "all" ? f.paymentModeFilter : "All"],
    ["Settlement", SETTLEMENT_LABEL[f.paymentStatusFilter] || "All"],
    ...(f.searchQuery && f.searchQuery.trim() ? [["Search", f.searchQuery.trim()]] : []),
  ];

  return (
    <div className="rps">
      <style>{CSS}</style>

      {/* ---------------- Letterhead ---------------- */}
      <div className="lh">
        <div className="lh-logo">
          <img src={DEALER.punyaLogo} alt="Punya Autowheels" />
        </div>
        <div className="lh-mid">
          <div className="lh-name">{DEALER.name}</div>
          <div className="lh-tag">{DEALER.tagline}</div>
          <div className="lh-fac">{DEALER.facility}</div>
          <div className="lh-addr">
            {DEALER.addresses.map((a) => (
              <div key={a}>{a}</div>
            ))}
            <div>{DEALER.contact}</div>
          </div>
        </div>
        <div className="lh-right">
          <img src={DEALER.tataLogo} alt="Tata Motors Commercial Vehicles" />
          <div className="lh-gst">GSTIN: {DEALER.gstin}</div>
        </div>
      </div>

      <div className="title">{title}</div>

      <div className="meta">
        <span>
          <b>Printed on:</b> {new Date().toLocaleString("en-IN")} &nbsp;|&nbsp; <b>By:</b> {session?.name || "User"} ({session?.role || "Staff"})
        </span>
        <span>
          <b>Records:</b> {filteredDeals.length} &nbsp;|&nbsp; <b>Net order value:</b> {inr(metrics.totalNet)} &nbsp;|&nbsp;{" "}
          <b>Collected:</b> {inr(metrics.totalCollected)} &nbsp;|&nbsp; <b>Outstanding:</b> {inr(metrics.totalDue)}
        </span>
      </div>

      <div className="filters">
        {filterItems.map(([k, v], i) => (
          <span key={k}>
            <b>{k}:</b> {v}
            {i < filterItems.length - 1 ? "  ·  " : ""}
          </span>
        ))}
      </div>

      {/* ---------------- Ledger ---------------- */}
      {activeView === "ledger" &&
        (filteredDeals.length === 0 ? (
          <div className="empty">No deals match the selected filters.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date &amp; Deal ID</th>
                <th>Customer &amp; Mobile</th>
                <th>{isSales ? "Branch & Model" : "Salesman & Branch"}</th>
                <th className="r">Net Order Value</th>
                <th className="r">Collected</th>
                <th className="r">Outstanding Due</th>
                <th>Payment Modes &amp; UTR Ref</th>
                <th className="c">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals
                .slice()
                .reverse()
                .map(({ d, c, dt, salesman, branchNorm }) => {
                  const valid = (d.paymentLog || []).filter((p) => paymentStatus(p) !== "rejected");
                  return (
                    <tr key={d.id}>
                      <td className="mono">
                        <b>{d.id}</b>
                        <div>{fmtDate(dt)}</div>
                      </td>
                      <td>
                        <b>{partyName(d.customer)}</b>
                        <div className="mono">
                          {d.customer?.mobile || "No phone"}
                          {d.vehicle?.model ? ` · ${d.vehicle.model}` : ""}
                        </div>
                        {d.vehicle?.chassisNo && <div className="mono">Chassis: {d.vehicle.chassisNo}</div>}
                      </td>
                      <td>
                        {isSales ? d.vehicle?.model || "Commercial Vehicle" : salesman}
                        <div>{branchNorm}</div>
                      </td>
                      <td className="r">
                        <b>{inr(c.netOnRoad)}</b>
                      </td>
                      <td className="r">{inr(c.totalCollected)}</td>
                      <td className="r">{c.balance > 0 ? <b>{inr(c.balance)}</b> : "Paid in Full"}</td>
                      <td>
                        {valid.length === 0 ? (
                          "No payment logged"
                        ) : (
                          valid.map((p, i) => (
                            <div key={p.id || i} className="pay">
                              {p.mode}: <b>{inr(p.amount)}</b>
                              {p.reference ? ` (Ref: ${p.reference})` : ""}
                            </div>
                          ))
                        )}
                      </td>
                      <td className="c">{STATUS_LABEL[d.status] || d.status}</td>
                    </tr>
                  );
                })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="r">
                  TOTAL ({filteredDeals.length} deals)
                </td>
                <td className="r">{inr(metrics.totalNet)}</td>
                <td className="r">{inr(metrics.totalCollected)}</td>
                <td className="r">{inr(metrics.totalDue)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        ))}

      {/* ---------------- Timeline ---------------- */}
      {activeView === "timeline" &&
        (timelineData.length === 0 ? (
          <div className="empty">No sales found in the selected timeframe.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Deal ID</th>
                <th>Customer</th>
                <th>Branch</th>
                <th>Salesman</th>
                <th className="r">Net Order Value</th>
                <th className="r">Collected</th>
                <th className="r">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {timelineData.map((g) => (
                <React.Fragment key={g.key}>
                  <tr className="grp">
                    <td colSpan={4}>
                      {g.label} — {g.deals.length} {g.deals.length === 1 ? "sale" : "sales"}
                    </td>
                    <td className="r">{inr(g.net)}</td>
                    <td className="r">{inr(g.collected)}</td>
                    <td className="r">{inr(g.balance)}</td>
                  </tr>
                  {g.deals.map(({ d, c, salesman, branchNorm }) => (
                    <tr key={d.id}>
                      <td className="mono">{d.id}</td>
                      <td>{partyName(d.customer)}</td>
                      <td>{branchNorm}</td>
                      <td>{salesman}</td>
                      <td className="r">{inr(c.netOnRoad)}</td>
                      <td className="r">{inr(c.totalCollected)}</td>
                      <td className="r">{c.balance > 0 ? inr(c.balance) : "—"}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="r">
                  TOTAL
                </td>
                <td className="r">{inr(metrics.totalNet)}</td>
                <td className="r">{inr(metrics.totalCollected)}</td>
                <td className="r">{inr(metrics.totalDue)}</td>
              </tr>
            </tfoot>
          </table>
        ))}

      {/* ---------------- Salesman leaderboard ---------------- */}
      {activeView === "salesmen" &&
        (salesmanLeaderboard.length === 0 ? (
          <div className="empty">No salesman activity in this filtered view.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th className="c">#</th>
                <th>Salesman</th>
                <th>Primary Branch</th>
                <th className="c">Deals</th>
                <th className="c">Today</th>
                <th className="r">Net Sales Value</th>
                <th className="r">Collected</th>
                <th className="r">Outstanding</th>
                <th className="c">Collection %</th>
              </tr>
            </thead>
            <tbody>
              {salesmanLeaderboard.map((s, i) => (
                <tr key={s.name}>
                  <td className="c">{i + 1}</td>
                  <td>
                    <b>{s.name}</b>
                  </td>
                  <td>{s.branch}</td>
                  <td className="c">{s.count}</td>
                  <td className="c">{s.todayCount || "—"}</td>
                  <td className="r">{inr(s.net)}</td>
                  <td className="r">{inr(s.collected)}</td>
                  <td className="r">{inr(s.balance)}</td>
                  <td className="c">{s.net > 0 ? Math.round((s.collected / s.net) * 100) : 0}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="r">
                  TOTAL
                </td>
                <td className="r">{inr(metrics.totalNet)}</td>
                <td className="r">{inr(metrics.totalCollected)}</td>
                <td className="r">{inr(metrics.totalDue)}</td>
                <td className="c">{metrics.collectionRate}%</td>
              </tr>
            </tfoot>
          </table>
        ))}

      <div className="sig">
        <div>Prepared by</div>
        <div>Accounts Signature</div>
        <div>Authorised Signatory</div>
      </div>
    </div>
  );
}
