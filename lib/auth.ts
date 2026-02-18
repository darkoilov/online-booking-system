import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { ApiError } from "./api-error";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export interface JWTPayload {
  userId: string;
  role: "OWNER" | "STAFF" | "ADMIN";
  businessId?: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    throw new ApiError("Invalid or expired token", 401);
  }
}

export function getAuthFromRequest(request: NextRequest): JWTPayload {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError("Authentication required", 401);
  }

  const token = authHeader.slice(7);
  return verifyToken(token);
}

export function requireRole(
  auth: JWTPayload,
  ...roles: ("OWNER" | "STAFF" | "ADMIN")[]
): void {
  if (!roles.includes(auth.role)) {
    throw new ApiError("Insufficient permissions", 403);
  }
}
