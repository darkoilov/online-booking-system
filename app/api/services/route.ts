import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Service, Business } from "@/lib/models";
import { createServiceSchema } from "@/lib/validations";
import { getAuthFromRequest, requireRole } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/api-error";

// POST /api/services - Create a service
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const auth = getAuthFromRequest(request);
    requireRole(auth, "OWNER");

    const business = await Business.findOne({ ownerId: auth.userId });
    if (!business) throw new ApiError("Business not found.", 404);

    const body = await request.json();
    const data = createServiceSchema.parse(body);

    const service = await Service.create({
      ...data,
      businessId: business._id,
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/services - List all services for current business
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const auth = getAuthFromRequest(request);
    requireRole(auth, "OWNER", "STAFF");

    const business = await Business.findOne({ ownerId: auth.userId });
    if (!business) throw new ApiError("Business not found.", 404);

    const services = await Service.find({ businessId: business._id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ services });
  } catch (error) {
    return handleApiError(error);
  }
}
