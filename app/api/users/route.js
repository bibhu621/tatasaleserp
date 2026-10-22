import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getAllUsers, createUser } from "@/lib/db";

const VALID_ROLES = ["admin", "sales", "accounts", "rto"];

export async function GET(request) {
  const auth = requireRole(request, ["admin"]);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = requireRole(request, ["admin"]);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { username, password, name, role, branch } = await request.json();

    if (!username || !password || !name || !role) {
      return NextResponse.json(
        { error: "Username, password, full name, and role are required." },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Role must be one of: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    if (password.length < 5) {
      return NextResponse.json(
        { error: "Password must be at least 5 characters long." },
        { status: 400 }
      );
    }

    const newUser = await createUser({
      username,
      password,
      name,
      role,
      branch: branch || "Sasaram",
    });

    return NextResponse.json({
      success: true,
      message: "User created successfully.",
      user: {
        id: newUser._id ? newUser._id.toString() : newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        branch: newUser.branch,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
