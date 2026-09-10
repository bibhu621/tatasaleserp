import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { deleteUser } from "@/lib/db";

export async function DELETE(request, { params }) {
  const auth = requireRole(request, ["admin"]);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    if (auth.session.id === id || auth.session.username === "admin") {
      // Prevent admin from deleting their own active seed account if it's the current session
      if (auth.session.id === id) {
        return NextResponse.json(
          { error: "You cannot delete your own active account." },
          { status: 400 }
        );
      }
    }

    await deleteUser(id);
    return NextResponse.json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
