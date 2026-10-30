import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "sales-erp-jwt-secret-key-32-characters-minimum";

export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

export async function comparePassword(plainPassword, hashedPassword) {
  if (!hashedPassword) return false;
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user._id ? user._id.toString() : user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      branch: user.branch,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request) {
  // Check Authorization header or Cookie
  let token = null;
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/erp_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) return null;
  return verifyToken(token);
}

export function requireAuth(request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return { error: "Unauthorized. Please log in.", status: 401 };
  }
  return { session };
}

export function requireRole(request, allowedRoles) {
  const authResult = requireAuth(request);
  if (authResult.error) return authResult;

  const userRole = authResult.session.role;
  const isAllowed =
    allowedRoles.includes(userRole) ||
    (userRole === "superadmin" && (allowedRoles.includes("admin") || allowedRoles.includes("superadmin")));

  if (!isAllowed) {
    return { error: "Forbidden. Insufficient permissions for this action.", status: 403 };
  }
  return { session: authResult.session };
}
