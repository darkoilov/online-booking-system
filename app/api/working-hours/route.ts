import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { WorkingHours, Business } from "@/lib/models";
import { replaceWorkingHoursSchema } from "@/lib/validations";
import { getAuthFromRequest, requireRole } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/api-error";

// GET /api/working-hours - Get working hours for current business
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const auth = getAuthFromRequest(request);
    requireRole(auth, "OWNER", "STAFF");

    const business = await Business.findOne({ ownerId: auth.userId });
    if (!business) throw new ApiError("Business not found.", 404);

    const hours = await WorkingHours.find({
      businessId: business._id,
    }).sort({ dayOfWeek: 1 });

    return NextResponse.json({ hours });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/working-hours - Replace all weekly hours (atomic overwrite)
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const auth = getAuthFromRequest(request);
    requireRole(auth, "OWNER");

    const business = await Business.findOne({ ownerId: auth.userId });
    if (!business) throw new ApiError("Business not found.", 404);

    const body = await request.json();
    const data = replaceWorkingHoursSchema.parse(body);

    // Delete all existing hours for this business
    await WorkingHours.deleteMany({ businessId: business._id });

    // Insert new hours
    const docs = data.hours.map((h) => ({
      ...h,
      businessId: business._id,
    }));

    const hours =
      docs.length > 0 ? await WorkingHours.insertMany(docs) : [];

    return NextResponse.json({ hours });
  } catch (error) {
    return handleApiError(error);
  }
}
