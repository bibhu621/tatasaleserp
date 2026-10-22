import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { fetchDeals, saveDeals, removeDeal } from "@/lib/db";
import { isDealForUser, filterDealsForUser } from "@/lib/dealUtils";

export async function GET(request) {
  const auth = requireAuth(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const deals = await fetchDeals();
    if (auth.session.role === "sales") {
      const myDeals = filterDealsForUser(deals, auth.session);
      return NextResponse.json({ deals: myDeals });
    }
    return NextResponse.json({ deals });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = requireAuth(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { deals } = await request.json();
    if (!Array.isArray(deals)) {
      return NextResponse.json({ error: "Invalid deals payload." }, { status: 400 });
    }

    let sanitizedDeals = deals;
    if (auth.session.role === "sales") {
      // For sales role, ensure deals being saved are attributed to the salesman
      sanitizedDeals = deals.map((d) => {
        const isOwner = isDealForUser(d, auth.session);
        if (!isOwner) {
          // If a new deal is submitted by this salesman, enforce ownership tags
          return {
            ...d,
            createdBy: auth.session.name || d.createdBy,
            createdById: auth.session.id || d.createdById,
            createdByUsername: auth.session.username || d.createdByUsername,
          };
        }
        return d;
      });
    }

    await saveDeals(sanitizedDeals);
    return NextResponse.json({ success: true, message: "Deals saved successfully." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = requireAuth(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get("id");
    if (!dealId) {
      return NextResponse.json({ error: "Missing deal id." }, { status: 400 });
    }

    if (auth.session.role === "sales") {
      const allDeals = await fetchDeals();
      const target = allDeals.find((d) => d.id === dealId);
      if (target && !isDealForUser(target, auth.session)) {
        return NextResponse.json(
          { error: "Forbidden. You can only delete your own deals." },
          { status: 403 }
        );
      }
    }

    await removeDeal(dealId);
    return NextResponse.json({ success: true, message: "Deal deleted successfully." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
