import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Business } from "@/lib/models";
import { updateBusinessSchema } from "@/lib/validations";
import { getAuthFromRequest, requireRole } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/api-error";

// GET /api/business/me - Get current user's business
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const auth = getAuthFromRequest(request);
    requireRole(auth, "OWNER", "STAFF");

    const business = await Business.findOne({ ownerId: auth.userId });
    if (!business) {
      return NextResponse.json(
        { error: "No business found. Please create one first." },
        { status: 404 }
      );
    }

    return NextResponse.json({ business });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/business/me - Update current user's business
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const auth = getAuthFromRequest(request);
    requireRole(auth, "OWNER");

    const body = await request.json();
    const data = updateBusinessSchema.parse(body);

    const business = await Business.findOneAndUpdate(
      { ownerId: auth.userId },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!business) {
      throw new ApiError("Business not found.", 404);
    }

    return NextResponse.json({ business });
  } catch (error) {
    return handleApiError(error);
  }
}
