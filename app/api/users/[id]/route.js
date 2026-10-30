import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { deleteUserCredentials, resetUserPassword, updateUser } from "@/lib/db";

export async function DELETE(request, { params }) {
  const auth = requireRole(request, ["admin", "superadmin"]);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    if (auth.session.id === id || auth.session.username === "admin" && id === auth.session.id) {
      return NextResponse.json(
        { error: "You cannot delete your own active account credentials." },
        { status: 400 }
      );
    }

    // Requirement 2: Delete login credentials while preserving profile and deal history
    const result = await deleteUserCredentials(id);
    if (!result) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User login credentials removed successfully. Profile data and deals are preserved.",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const auth = requireRole(request, ["admin", "superadmin"]);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, password, role, branch, name } = body;

    // Requirement 2: Admin should be able to reset anyone's password from console
    if (action === "reset_password" || password) {
      if (!password || String(password).trim().length < 5) {
        return NextResponse.json(
          { error: "Password must be at least 5 characters long." },
          { status: 400 }
        );
      }

      const updated = await resetUserPassword(id, String(password).trim());
      if (!updated) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: "Password reset successfully. User login access has been restored.",
      });
    }

    // Support updating other profile attributes if needed
    const updates = {};
    if (role) updates.role = role;
    if (branch) updates.branch = branch;
    if (name) updates.name = name;

    if (Object.keys(updates).length > 0) {
      await updateUser(id, updates);
      return NextResponse.json({
        success: true,
        message: "User details updated successfully.",
      });
    }

    return NextResponse.json({ error: "No valid action provided." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
