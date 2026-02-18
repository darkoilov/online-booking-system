import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Booking } from "@/lib/models";
import { getAuthFromRequest, requireRole } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/api-error";

// GET /api/bookings?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const auth = getAuthFromRequest(request);
    requireRole(auth, "OWNER", "STAFF");

    if (!auth.businessId) {
      throw new ApiError("No business associated with this account", 400);
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      throw new ApiError("Both 'from' and 'to' query params are required (YYYY-MM-DD)", 400);
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(from) || !dateRegex.test(to)) {
      throw new ApiError("Dates must be in YYYY-MM-DD format", 400);
    }

    const fromDate = new Date(from + "T00:00:00Z");
    const toDate = new Date(to + "T23:59:59.999Z");

    const bookings = await Booking.find({
      businessId: auth.businessId,
      startAt: { $gte: fromDate, $lte: toDate },
    })
      .populate("serviceId", "name durationMinutes price")
      .sort({ startAt: 1 })
      .lean();

    const formatted = bookings.map((b) => ({
      _id: b._id,
      serviceId: b.serviceId,
      startAt: b.startAt,
      endAt: b.endAt,
      status: b.status,
      customer: b.customer,
      note: b.note,
      createdAt: b.createdAt,
    }));

    return NextResponse.json({ bookings: formatted });
  } catch (error) {
    return handleApiError(error);
  }
}
