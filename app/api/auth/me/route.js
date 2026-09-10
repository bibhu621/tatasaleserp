import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user: session });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
