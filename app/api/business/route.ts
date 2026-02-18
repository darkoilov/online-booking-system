import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Business, User } from "@/lib/models";
import { createBusinessSchema } from "@/lib/validations";
import { getAuthFromRequest, requireRole } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/api-error";

// POST /api/business - Create a business
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const auth = getAuthFromRequest(request);
    requireRole(auth, "OWNER");

    // Check if owner already has a business
    const existing = await Business.findOne({ ownerId: auth.userId });
    if (existing) {
      throw new ApiError("You already have a business.", 409);
    }

    const body = await request.json();
    const data = createBusinessSchema.parse(body);

    // Create business
    const business = await Business.create({
      ...data,
      ownerId: auth.userId,
    });

    // Link business to user
    await User.findByIdAndUpdate(auth.userId, {
      businessId: business._id,
    });

    return NextResponse.json({ business }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
