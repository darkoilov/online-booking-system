import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Business, Service, Booking } from "@/lib/models";
import { createBookingSchema } from "@/lib/validations";
import { handleApiError, ApiError } from "@/lib/api-error";
import { getAvailableSlots } from "@/lib/availability";
import { generateManageToken } from "@/lib/manage-token";
import {
  sendEmail,
  bookingCreatedEmail,
  formatBookingDate,
  buildManageUrl,
} from "@/lib/email";

// POST /api/public/:slug/bookings
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;
    const body = await request.json();
    const data = createBookingSchema.parse(body);

    // Load business
    const business = await Business.findOne({ slug, isActive: true });
    if (!business) {
      throw new ApiError("Business not found.", 404);
    }

    // Load service
    const service = await Service.findById(data.serviceId);
    if (
      !service ||
      String(service.businessId) !== String(business._id) ||
      !service.isActive
    ) {
      throw new ApiError("Service not found or inactive.", 404);
    }

    // Atomic slot-still-free check: verify the chosen slot is still available
    const availableSlots = await getAvailableSlots(
      String(business._id),
      data.date,
      data.serviceId
    );

    const slotAvailable = availableSlots.some(
      (s) => s.startTime === data.startTime
    );

    if (!slotAvailable) {
      throw new ApiError(
        "This time slot is no longer available. Please choose another.",
        409
      );
    }

    // Compute startAt and endAt in UTC
    const tz = business.timezone || "Europe/Skopje";
    const [startH, startM] = data.startTime.split(":").map(Number);

    // Create date in business timezone then convert to UTC
    const localDateStr = `${data.date}T${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}:00`;

    // Use Intl to find UTC offset for this timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    });
    const testDate = new Date(localDateStr + "Z");
    const parts = formatter.formatToParts(testDate);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    let offsetMinutes = 0;

    if (offsetPart) {
      const match = offsetPart.value.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const mins = parseInt(match[2] || "0", 10);
        offsetMinutes = hours * 60 + (hours < 0 ? -mins : mins);
      }
    }

    // startAt in UTC = local time - offset
    const startAt = new Date(
      new Date(localDateStr).getTime() - offsetMinutes * 60000
    );
    const endAt = new Date(
      startAt.getTime() + service.durationMinutes * 60000
    );

    // Determine status based on autoConfirm policy
    const status = business.policies?.autoConfirm ? "CONFIRMED" : "PENDING";

    const booking = await Booking.create({
      businessId: business._id,
      serviceId: service._id,
      startAt,
      endAt,
      status,
      customer: {
        fullName: data.customer.fullName,
        phone: data.customer.phone,
        email: data.customer.email || undefined,
      },
      note: data.note || undefined,
    });

    return NextResponse.json(
      {
        booking: {
          id: booking._id,
          status: booking.status,
          startAt: booking.startAt,
          endAt: booking.endAt,
          service: {
            name: service.name,
            durationMinutes: service.durationMinutes,
          },
          customer: booking.customer,
        },
        message:
          status === "CONFIRMED"
            ? "Your appointment is confirmed!"
            : "Your booking is pending approval.",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
