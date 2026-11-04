import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { searchCustomerByPan } from "@/lib/db";

export async function GET(request) {
  const auth = requireAuth(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const pan = searchParams.get("pan") || "";
    if (!pan || pan.trim().length < 3) {
      return NextResponse.json({ matches: [] });
    }

    const matches = await searchCustomerByPan(pan);
    return NextResponse.json({ matches });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

