"use client";

import React from "react";

/* ---------------------------------------------------------------------- */
/*  Letterhead details — keep in sync with ReportPrintSheet.js             */
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
/*  Helpers                                                                */
/* ---------------------------------------------------------------------- */

const num = (v) => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));
const sum = (arr, f = (x) => x) => arr.reduce((s, x) => s + num(f(x)), 0);
const inr = (v) => "₹" + Math.round(num(v)).toLocaleString("en-IN");
// Blank for untouched inputs, rupees otherwise
const amt = (v) => (v === "" || v === null || v === undefined ? "" : inr(v));
const payStatus = (e) => e.status || (e.verified ? "verified" : "pending");
const branchName = (b) => {
  const l = String(b || "").toLowerCase();
  return l.includes("bihiya") ? "Bihiya" : l.includes("buxa") ? "Buxas" : l.includes("mohan") ? "Mohaniya" : l.includes("sasaram") ? "Sasaram" : b || "";
};
const STATUS_LABEL = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  rejected: "Rejected",
  approved: "Approved",
  delivered: "Delivered",
  closed: "Closed",
};
const EXPENSE_HEADS = [
  ["insurance", "Insurance", "insurance"],
  ["hsrp", "Choice No + HSRP", "choiceHsrp"],
  ["tr", "Temporary Registration", "tr"],
  ["registration", "Registration", "registration"],
];

/* ---------------------------------------------------------------------- */
/*  Styles — hidden on screen, shown (A4 portrait) when printing           */
/* ---------------------------------------------------------------------- */

const CSS = `
.dps{display:none}
@media print{
  @page{size:A4 portrait;margin:7mm}
  .dps{display:block;color:#000;background:#fff;font:10px/1.3 Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .dps *{box-sizing:border-box}
  .dps .lh{display:grid;grid-template-columns:170px 1fr 170px;gap:8px;align-items:center;border-bottom:2px solid #000;padding-bottom:5px}
  .dps .lh-logo{width:72px;height:72px;overflow:hidden;position:relative}
  .dps .lh-logo img{position:absolute;width:98px;left:-14px;top:-12px;max-width:none}
  .dps .lh-mid{text-align:center}
  .dps .lh-name{font:800 22px/1.1 Georgia,'Times New Roman',serif;white-space:nowrap}
  .dps .lh-tag{font-weight:700;font-size:10.5px;margin-top:2px}
  .dps .lh-fac{font-weight:700;font-size:9.5px;margin-top:2px}
  .dps .lh-addr{font-size:8.5px;line-height:1.3}
  .dps .lh-right{text-align:right}
  .dps .lh-right img{width:160px;height:auto;display:inline-block}
  .dps .lh-gst{font:700 10px 'Courier New',monospace;margin-top:3px}
  .dps .ttl{display:flex;justify-content:space-between;align-items:flex-end;margin:6px 0 4px}
  .dps .ttl h2{margin:0;font:700 15px Georgia,serif;text-decoration:underline;flex:1;text-align:center}
  .dps .ttl span{font-size:9.5px;min-width:150px}
  .dps .ttl span:last-child{text-align:right}
  .dps .box{border:1px solid #000;margin-bottom:5px}
  .dps .rw{display:flex;border-bottom:1px solid #000}
  .dps .rw:last-child{border-bottom:0}
  .dps .ce{padding:3px 5px;border-right:1px solid #000;min-height:19px;min-width:0;overflow-wrap:anywhere}
  .dps .ce:last-child{border-right:0}
  .dps .ce .l{font-weight:700;margin-right:4px}
  .dps .ce .v{font-family:'Courier New',monospace;font-size:10px}
  .dps .two{display:flex;gap:6px;align-items:flex-start}
  .dps .col{flex:1;min-width:0}
  .dps h3{margin:0;padding:3px 5px;border:1px solid #000;border-bottom:0;background:#e6e6e6;text-align:center;font-size:10.5px;text-transform:none}
  .dps table{width:100%;border-collapse:collapse;font-size:9.5px}
  .dps th,.dps td{border:1px solid #000;padding:2px 5px;text-align:left;vertical-align:top}
  .dps th{background:#efefef;font-size:8.5px;text-transform:uppercase}
  .dps td.a,.dps th.a{text-align:right;width:84px;font-family:'Courier New',monospace;white-space:nowrap}
  .dps tr.b td{font-weight:700;background:#f1f1f1}
  .dps .mono{font-family:'Courier New',monospace}
  .dps tr{page-break-inside:avoid}
  .dps .keep{page-break-inside:avoid}
  .dps .sigs{display:flex;gap:6px;margin-top:5px}
  .dps .sg{flex:1;border:1px solid #000;height:46px;padding:3px 5px;font-weight:700;font-size:9px;display:flex;align-items:flex-end}
  .dps .sg.sp{border:0}
  .dps .office{margin-top:6px}
  .dps .office .hd{text-align:center;font-weight:800;text-decoration:underline;font-size:11px;margin-bottom:3px}
  .dps .gate{display:flex;align-items:center;justify-content:center;text-align:center;font-size:8.5px;line-height:1.3}
  .dps .foot{margin-top:4px;font-size:8.5px;display:flex;justify-content:space-between}
  .dps .ce .v,.dps td.a,.dps .mono{font-family:Calibri,Carlito,'Segoe UI',Arial,sans-serif;font-size:11px;font-weight:600}
}
`;

/* ---------------------------------------------------------------------- */
/*  Component                                                              */
/* ---------------------------------------------------------------------- */

function Row({ cells, data }) {
  return (
    <div className="rw">
      {cells.map(([label, key, w = 1]) => (
        <div key={key} className="ce" style={{ flex: w }}>
          <span className="l">{label}:</span>
          <span className="v">{data[key] || ""}</span>
        </div>
      ))}
    </div>
  );
}

export default function DealPrintSheet({ deal: d, totals: t, showOffice = false, session }) {
  const cu = d.customer || {};
  const ve = d.vehicle || {};
  const pr = d.pricing || {};
  const of = d.officeUse || {};
  const created = d.createdAt ? new Date(d.createdAt) : new Date();

  const validPay = (d.paymentLog || []).filter((e) => payStatus(e) !== "rejected");
  const byMode = (m) => sum(validPay.filter((e) => e.mode === m), (e) => e.amount);
  const listedModes = ["Exchange Vehicle", "Financer Disbursement", "NEFT/RTGS", "Cheque", "Cash", "Advance Adjustment"];
  const otherModes = sum(validPay.filter((e) => !listedModes.includes(e.mode)), (e) => e.amount);
  const totalReceived = t.totalCollected + t.approvedAdjustments;

  const priceRows = [
    ["Exshowroom price", amt(pr.exshowroom)],
    ["Less: TML cash discount", amt(pr.tmlDiscount)],
    ["Less: Dealer discount", amt(pr.dealerDiscount)],
    ["Less: VAS NFA discount", amt(pr.vasNfaDiscount)],
    ...(pr.otherDiscounts || []).map((o) => [`Less: ${o.label || "Other discount"}`, amt(o.amount)]),
    ["Net price of vehicle", inr(t.netPrice), true],
    ["Add: TCS 1% (auto, net > ₹10L)", t.tcs ? inr(t.tcs) : ""],
    ["Add: TR", amt(pr.tr)],
    ["Add: Insurance", amt(pr.insurance)],
    ["Add: Registration", amt(pr.registration)],
    ["Add: Permit", amt(pr.permit)],
    ["Add: Fleetedge / VLTD", amt(pr.fleetedgeVltd)],
    ["Add: VAS (AMC / FMS)", amt(pr.vasAmc)],
    ["Add: Body fabrication charge", amt(pr.bodyFabCharge)],
    ["Add: Choice No + HSRP", amt(pr.choiceHsrp)],
    ["Add: Transportation", amt(pr.transportation)],
    ["Total on-road price", inr(t.totalOnRoad), true],
    ["Less: Exchange bonus", amt(pr.exchangeBonus)],
    ["NET ON-ROAD PRICE", inr(t.netOnRoad), true],
  ];

  const receivedRows = [
    ["Exchange Vehicle price", byMode("Exchange Vehicle")],
    ["Disbursement amt from bank", byMode("Financer Disbursement")],
    ["Online payment received (NEFT/RTGS)", byMode("NEFT/RTGS")],
    ["Cheque payment received", byMode("Cheque")],
    ["Cash received", byMode("Cash")],
    ["Advance adjustment", byMode("Advance Adjustment")],
    ...(otherModes ? [["Other", otherModes]] : []),
    ["Approved receipt adjustment", t.approvedAdjustments],
  ];

  const totalRetention = sum(["retentionVehicle", "retentionBody", "retentionVas", "retentionOthers"], (k) => of[k]);
  const show = (v) => (showOffice ? v : "");
  const showAmt = (v) => (showOffice ? amt(v) : "");

  return (
    <div className="dps">
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

      <div className="ttl">
        <span>
          <b>Deal ID:</b> <span className="mono">{d.id}</span>
        </span>
        <h2>Customer Term Sheet</h2>
        <span>
          <b>Date:</b> {created.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
        </span>
      </div>

      {/* ---------------- Customer ---------------- */}
      <div className="box">
        <Row cells={[["Company Name", "companyName", 2], ["GST No.", "gstNo", 1.2]]} data={cu} />
        <Row cells={[["Customer / Entity Name", "name", 2], ["S/o, W/o, D/o", "soWo", 1.2]]} data={cu} />
        <Row cells={[["DOB / Age", "dob"], ["PAN No.", "pan"], ["Aadhar No.", "aadhar"], ["Mobile", "mobile"]]} data={cu} />
        <Row cells={[["Address", "address"]]} data={cu} />
        <Row cells={[["P.O.", "po"], ["P.S.", "ps"], ["District", "district"], ["PIN", "pin"], ["State", "state"]]} data={cu} />
      </div>

      {/* ---------------- Vehicle ---------------- */}
      <div className="box">
        <Row cells={[["Model", "model", 1.4], ["Colour", "colour"], ["Body Type", "bodyType"]]} data={ve} />
        <Row cells={[["Chassis No.", "chassisNo", 1.4], ["Engine No.", "engineNo", 1.2], ["Fuel Type", "fuelType"]]} data={ve} />
        <Row cells={[["DOD", "dod"], ["DSE", "dse", 1.2], ["DSM", "dsm", 1.2]]} data={ve} />
        <div className="rw">
          <div className="ce" style={{ flex: 1.4 }}>
            <span className="l">Financer Name:</span>
            <span className="v">{ve.financerName || ""}</span>
          </div>
          <div className="ce" style={{ flex: 1 }}>
            <span className="l">Branch:</span>
            <span className="v">{branchName(d.branch)}</span>
          </div>
          <div className="ce" style={{ flex: 1 }}>
            <span className="l">RTO:</span>
            <span className="v">{ve.rto || ""}</span>
          </div>
        </div>
      </div>

      {/* ---------------- On-road price | Received | Payments ---------------- */}
      <div className="two keep">
        <div className="col">
          <h3>On Road Price</h3>
          <table>
            <tbody>
              {priceRows.map(([label, value, bold], i) => (
                <tr key={i} className={bold ? "b" : ""}>
                  <td>{label}</td>
                  <td className="a">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col">
          <h3>Received from Customer for Delivery</h3>
          <table>
            <tbody>
              {receivedRows.map(([label, value], i) => (
                <tr key={i}>
                  <td>{label}</td>
                  <td className="a">{value ? inr(value) : ""}</td>
                </tr>
              ))}
              <tr className="b">
                <td>Total received from customer</td>
                <td className="a">{inr(totalReceived)}</td>
              </tr>
              <tr className="b">
                <td>Balance C/f (net on-road − received)</td>
                <td className="a">{inr(t.balance)}</td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ marginTop: 6 }}>Payments (RTO / Registration)</h3>
          <table>
            <thead>
              <tr>
                <th>Head</th>
                <th className="a">Collected</th>
                <th className="a">Spent</th>
              </tr>
            </thead>
            <tbody>
              {EXPENSE_HEADS.map(([cat, label, field]) => {
                const spent = sum((d.expenses || []).filter((e) => e.category === cat && e.status === "posted"), (e) => e.amount);
                return (
                  <tr key={cat}>
                    <td>
                      {label}
                      {(d.expenseClosed || {})[cat] ? " ✓" : ""}
                    </td>
                    <td className="a">{amt(pr[field])}</td>
                    <td className="a">{spent ? inr(spent) : ""}</td>
                  </tr>
                );
              })}
              <tr className="b">
                <td>Total</td>
                <td className="a">{inr(sum(EXPENSE_HEADS, ([, , f]) => pr[f]))}</td>
                <td className="a">
                  {inr(sum((d.expenses || []).filter((e) => e.status === "posted"), (e) => e.amount))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- Payment log ---------------- */}
      <div className="keep" style={{ marginTop: 6 }}>
        <h3>Customer Payment Log</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Mode</th>
              <th>Reference / UTR / Cheque No.</th>
              <th>Entered by</th>
              <th>Status</th>
              <th className="a">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(d.paymentLog || []).length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center" }}>
                  No payments logged
                </td>
              </tr>
            ) : (
              d.paymentLog.map((e) => {
                const st = payStatus(e);
                return (
                  <tr key={e.id}>
                    <td className="mono">{e.date}</td>
                    <td>{e.mode}</td>
                    <td className="mono">{e.reference || "—"}</td>
                    <td>{e.enteredBy}</td>
                    <td>{st === "verified" ? "Verified" : st === "rejected" ? "Rejected" : "Unverified"}</td>
                    <td className="a" style={st === "rejected" ? { textDecoration: "line-through" } : {}}>
                      {inr(e.amount)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ---------------- Signatures ---------------- */}
      <div className="sigs keep">
        <div className="sg">Customer Signature</div>
        <div className="sg">PDI Signature</div>
        <div className="sg">DSM Signature</div>
      </div>

      {/* ---------------- For office use only ---------------- */}
      <div className="office keep">
        <div className="hd">For Office Use Only</div>
        <div className="two">
          <div className="col">
            <div className="box" style={{ marginBottom: 0 }}>
              <div className="rw">
                <div className="ce" style={{ flex: 1, minHeight: 52 }}>
                  <span className="l">Remarks:</span>
                  <span className="v">{show(of.remarks)}</span>
                </div>
              </div>
              <div className="rw">
                <div className="ce" style={{ flex: 1 }}>
                  <span className="l">Body Fab. Name:</span>
                  <span className="v">{show(of.bodyFabName)}</span>
                </div>
              </div>
              <div className="rw">
                <div className="ce" style={{ flex: 1 }}>
                  <span className="l">Interest Cost:</span>
                  <span className="v">{showAmt(of.interestCost)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col">
            <table>
              <tbody>
                <tr>
                  <td>Retention on Vehicle</td>
                  <td className="a">{showAmt(of.retentionVehicle)}</td>
                </tr>
                <tr>
                  <td>Retention on Body</td>
                  <td className="a">{showAmt(of.retentionBody)}</td>
                </tr>
                <tr>
                  <td>Retention on VAS</td>
                  <td className="a">{showAmt(of.retentionVas)}</td>
                </tr>
                <tr>
                  <td>Retention on Others</td>
                  <td className="a">{showAmt(of.retentionOthers)}</td>
                </tr>
                <tr className="b">
                  <td>Total Retention</td>
                  <td className="a">{showOffice && totalRetention ? inr(totalRetention) : ""}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="sigs">
          <div className="sg">Tata OK Signature</div>
          <div className="sg">GM Signature</div>
          <div className="sg">CEO Signature</div>
          <div className="sg">Accounts Signature</div>
          <div className="sg">Dealer Principal Sign.</div>
          <div className="sg gate">
            Gate Pass to be issued
            <br />
            Yes [&nbsp;&nbsp;&nbsp;] No [&nbsp;&nbsp;&nbsp;]
          </div>
        </div>
      </div>

      <div className="foot">
        <span>
          Status: <b>{STATUS_LABEL[d.status] || d.status}</b> · Created by {d.createdBy || "—"}
        </span>
        <span>
          Printed {new Date().toLocaleString("en-IN")} by {session?.name || "User"} ({session?.role || "Staff"})
        </span>
      </div>
    </div>
  );
}
