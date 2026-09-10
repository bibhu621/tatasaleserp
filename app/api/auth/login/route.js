import { NextResponse } from "next/server";
import { findUserByUsername } from "@/lib/db";
import { comparePassword, signToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    if (user.isActive === false) {
      return NextResponse.json(
        { error: "Account has been deactivated. Contact Admin." },
        { status: 403 }
      );
    }

    const token = signToken(user);

    const userPayload = {
      id: user._id ? user._id.toString() : user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      branch: user.branch,
    };

    const response = NextResponse.json({
      success: true,
      user: userPayload,
      token,
    });

    response.cookies.set({
      name: "erp_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal server error during login." },
      { status: 500 }
    );
  }
}
