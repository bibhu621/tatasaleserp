import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { fetchDeals, saveDeals } from "@/lib/db";

export async function GET(request) {
  const auth = requireAuth(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const deals = await fetchDeals();
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

    await saveDeals(deals);
    return NextResponse.json({ success: true, message: "Deals saved successfully." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
