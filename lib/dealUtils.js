/**
 * Deal ownership and authorization utilities for Tata Punya ERP.
 */

export function isDealForUser(deal, session) {
  if (!deal || !session) return false;

  // Non-sales roles (admin, accounts, rto) have broader access to all deals (or role queues)
  if (session.role !== "sales") {
    return true;
  }

  const sId = session.id ? String(session.id).trim() : "";
  const sName = (session.name || "").trim().toLowerCase();
  const sUser = (session.username || "").trim().toLowerCase();

  // 1. Check createdById
  if (sId && deal.createdById && String(deal.createdById).trim() === sId) {
    return true;
  }

  // 2. Check createdByUsername
  if (sUser && deal.createdByUsername && deal.createdByUsername.trim().toLowerCase() === sUser) {
    return true;
  }

  // 3. Check createdBy against name or username
  const createdBy = (deal.createdBy || "").trim().toLowerCase();
  if (createdBy) {
    if (sName && createdBy === sName) return true;
    if (sUser && createdBy === sUser) return true;
  }

  // 4. Check vehicle DSE (Dealer Sales Executive) against name or username
  const dse = (deal.vehicle?.dse || "").trim().toLowerCase();
  if (dse) {
    if (sName && dse === sName) return true;
    if (sUser && dse === sUser) return true;
  }

  return false;
}

export function filterDealsForUser(deals, session) {
  if (!Array.isArray(deals)) return [];
  if (!session || session.role !== "sales") return deals;
  return deals.filter((d) => isDealForUser(d, session));
}

export function getDealSalesmanName(deal) {
  if (!deal) return "Unassigned";
  return (deal.vehicle?.dse || deal.createdBy || "Unassigned").trim();
}
