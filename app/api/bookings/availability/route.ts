import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthFromRequest, requireRole } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/api-error";
import { getAvailableSlots } from "@/lib/availability";

// GET /api/bookings/availability?date=YYYY-MM-DD&serviceId=...
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const auth = getAuthFromRequest(request);
    requireRole(auth, "OWNER", "STAFF");

    if (!auth.businessId) {
      throw new ApiError("No business associated with this account", 400);
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const serviceId = searchParams.get("serviceId");

    if (!date || !serviceId) {
      throw new ApiError("Both 'date' and 'serviceId' are required", 400);
    }

    const slots = await getAvailableSlots(auth.businessId, date, serviceId);

    return NextResponse.json({ date, serviceId, slots });
  } catch (error) {
    return handleApiError(error);
  }
}
