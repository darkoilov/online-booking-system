import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Booking, Business, Service } from "@/lib/models";
import {
  sendEmail,
  bookingReminderEmail,
  formatBookingDate,
  buildManageUrl,
} from "@/lib/email";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/reminders
 *
 * Runs periodically (e.g. every hour via Vercel Cron).
 * Finds CONFIRMED bookings starting within the next reminder windows
 * and sends reminder emails to customers that have an email.
 *
 * To configure in vercel.json:
 * { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }] }
 */
export async function GET(request: NextRequest) {
  // Verify cron secret in production
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    await connectDB();
    const now = new Date();

    // Find all active businesses with email reminders enabled
    const businesses = await Business.find({
      isActive: true,
      "notificationSettings.emailEnabled": true,
      "notificationSettings.reminders.enabled": true,
    });

    let sent = 0;

    for (const business of businesses) {
      const { hoursBefore } = business.notificationSettings.reminders;

      for (const hours of hoursBefore) {
        // Window: bookings starting between now+hours-30min and now+hours+30min
        const windowStart = new Date(now.getTime() + (hours * 60 - 30) * 60000);
        const windowEnd = new Date(now.getTime() + (hours * 60 + 30) * 60000);

        const bookings = await Booking.find({
          businessId: business._id,
          status: "CONFIRMED",
          startAt: { $gte: windowStart, $lte: windowEnd },
          "customer.email": { $exists: true, $ne: "" },
        });

        for (const booking of bookings) {
          const service = await Service.findById(booking.serviceId);
          const { date, time } = formatBookingDate(booking.startAt);

          // Build manage URL if token exists
          let manageUrl: string | undefined;
          if (booking.manageTokenHash) {
            // We can't reverse the hash, but the manage URL was sent in the creation email
            // For reminders, we omit the manage URL or only include it if stored separately
            // In V1, we'll just remind them to check their original email for the manage link
            manageUrl = undefined;
          }

          const emailPayload = bookingReminderEmail({
            customerName: booking.customer.fullName,
            serviceName: service?.name || "Service",
            date,
            time,
            duration: service?.durationMinutes || 0,
            businessName: business.name,
            businessPhone: business.phone,
            businessAddress: business.address,
            status: booking.status,
            hoursBefore: hours,
            manageUrl,
          });
          emailPayload.to = booking.customer.email!;

          const success = await sendEmail(emailPayload);
          if (success) sent++;
        }
      }
    }

    return NextResponse.json({
      message: `Reminder check complete. Sent ${sent} reminder(s).`,
      sent,
      checkedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("[Cron/Reminders] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
