import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Booking } from "@/lib/models";
import { getAuthFromRequest, requireRole } from "@/lib/auth";
import { updateBookingStatusSchema } from "@/lib/validations";
import { handleApiError, ApiError } from "@/lib/api-error";
import type { BookingStatus } from "@/lib/models/booking";

// Valid status transitions for business-side actions
const VALID_TRANSITIONS: Record<string, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED_BY_BUSINESS"],
  CONFIRMED: ["COMPLETED", "NO_SHOW", "CANCELLED_BY_BUSINESS"],
};

// PATCH /api/bookings/:id/status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const auth = getAuthFromRequest(request);
    requireRole(auth, "OWNER", "STAFF");

    if (!auth.businessId) {
      throw new ApiError("No business associated with this account", 400);
    }

    const { id } = await params;
    const body = await request.json();
    const { status: newStatus } = updateBookingStatusSchema.parse(body);

    // Find booking and ensure it belongs to this business
    const booking = await Booking.findById(id);
    if (!booking) {
      throw new ApiError("Booking not found", 404);
    }

    if (String(booking.businessId) !== auth.businessId) {
      throw new ApiError("Booking does not belong to your business", 403);
    }

    // Validate status transition
    const allowed = VALID_TRANSITIONS[booking.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new ApiError(
        `Cannot transition from ${booking.status} to ${newStatus}`,
        400
      );
    }

    booking.status = newStatus;
    await booking.save();

    return NextResponse.json({
      booking: {
        _id: booking._id,
        status: booking.status,
        startAt: booking.startAt,
        endAt: booking.endAt,
        customer: booking.customer,
      },
      message: `Booking status updated to ${newStatus}`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
