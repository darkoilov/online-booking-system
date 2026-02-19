import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Booking, Business, Service } from "@/lib/models";
import { handleApiError, ApiError } from "@/lib/api-error";
import { hashToken } from "@/lib/manage-token";

// GET /api/public/manage/:token -- view booking by manage token
export async function GET(
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

    const [service, business] = await Promise.all([
      Service.findById(booking.serviceId),
      Business.findById(booking.businessId),
    ]);

    return NextResponse.json({
      booking: {
        id: booking._id,
        status: booking.status,
        startAt: booking.startAt,
        endAt: booking.endAt,
        customer: booking.customer,
        note: booking.note,
        service: service
          ? { name: service.name, durationMinutes: service.durationMinutes, price: service.price }
          : null,
        business: business
          ? { name: business.name, phone: business.phone, address: business.address, slug: business.slug, policies: { cancelWindowHours: business.policies.cancelWindowHours } }
          : null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
