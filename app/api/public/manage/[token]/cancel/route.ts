import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Booking, Business, Service } from "@/lib/models";
import { handleApiError, ApiError } from "@/lib/api-error";
import { hashToken } from "@/lib/manage-token";
import {
  sendEmail,
  bookingCancelledEmail,
  formatBookingDate,
} from "@/lib/email";

// POST /api/public/manage/:token/cancel -- client cancels booking
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectDB();
    const { token } = await params;
    const hash = hashToken(token);

    const booking = await Booking.findOne({ manageTokenHash: hash });
    if (!booking) {
      throw new ApiError("Booking not found or link has expired.", 404);
    }

    // Check if booking can be cancelled
    if (
      booking.status === "CANCELLED_BY_CLIENT" ||
      booking.status === "CANCELLED_BY_BUSINESS" ||
      booking.status === "COMPLETED" ||
      booking.status === "NO_SHOW"
    ) {
      throw new ApiError(
        `Cannot cancel a booking with status "${booking.status}".`,
        400
      );
    }

    // Check cancel window policy
    const business = await Business.findById(booking.businessId);
    if (business && business.policies.cancelWindowHours > 0) {
      const now = new Date();
      const hoursUntilBooking =
        (booking.startAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilBooking < business.policies.cancelWindowHours) {
        throw new ApiError(
          `Cancellation must be at least ${business.policies.cancelWindowHours} hour(s) before the appointment.`,
          400
        );
      }
    }

    // Update status
    booking.status = "CANCELLED_BY_CLIENT";
    await booking.save();

    // Send cancellation email if customer has email
    if (booking.customer.email && business) {
      const service = await Service.findById(booking.serviceId);
      const { date, time } = formatBookingDate(booking.startAt);

      const emailPayload = bookingCancelledEmail({
        customerName: booking.customer.fullName,
        serviceName: service?.name || "Service",
        date,
        time,
        duration: service?.durationMinutes || 0,
        businessName: business.name,
        businessPhone: business.phone,
        businessAddress: business.address,
        status: "CANCELLED_BY_CLIENT",
        cancelledBy: "client",
      });
      emailPayload.to = booking.customer.email;
      sendEmail(emailPayload).catch(console.error);
    }

    return NextResponse.json({
      message: "Booking cancelled successfully.",
      booking: {
        id: booking._id,
        status: booking.status,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
