import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Business, Service, Booking } from "@/lib/models";
import { manualBookingSchema } from "@/lib/validations";
import { getAuthFromRequest, requireRole } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/api-error";
import { getAvailableSlots } from "@/lib/availability";

// POST /api/bookings/manual
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const auth = getAuthFromRequest(request);
    requireRole(auth, "OWNER", "STAFF");

    if (!auth.businessId) {
      throw new ApiError("No business associated with this account", 400);
    }

    const body = await request.json();
    const data = manualBookingSchema.parse(body);

    // Load business
    const business = await Business.findById(auth.businessId);
    if (!business || !business.isActive) {
      throw new ApiError("Business not found or inactive", 404);
    }

    // Load service
    const service = await Service.findById(data.serviceId);
    if (
      !service ||
      String(service.businessId) !== auth.businessId ||
      !service.isActive
    ) {
      throw new ApiError("Service not found or inactive", 404);
    }

    // Check slot availability
    const availableSlots = await getAvailableSlots(
      auth.businessId,
      data.date,
      data.serviceId
    );

    const slotAvailable = availableSlots.some(
      (s) => s.startTime === data.startTime
    );

    if (!slotAvailable) {
      throw new ApiError(
        "This time slot is not available. Please choose another.",
        409
      );
    }

    // Compute startAt and endAt in UTC
    const tz = business.timezone || "Europe/Skopje";
    const [startH, startM] = data.startTime.split(":").map(Number);
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

    const startAt = new Date(
      new Date(localDateStr).getTime() - offsetMinutes * 60000
    );
    const endAt = new Date(
      startAt.getTime() + service.durationMinutes * 60000
    );

    // Manual bookings are always CONFIRMED
    const booking = await Booking.create({
      businessId: business._id,
      serviceId: service._id,
      startAt,
      endAt,
      status: "CONFIRMED",
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
          _id: booking._id,
          status: booking.status,
          startAt: booking.startAt,
          endAt: booking.endAt,
          service: {
            name: service.name,
            durationMinutes: service.durationMinutes,
          },
          customer: booking.customer,
        },
        message: "Booking created and confirmed.",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
