/**
 * Email Service
 *
 * Uses Resend (https://resend.com) for transactional emails.
 * Set RESEND_API_KEY in env to enable real sending.
 * Without the key, emails are logged to console (dev mode).
 *
 * All templates return plain HTML strings.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "bookings@yourdomain.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ── Types ──

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

interface BookingEmailData {
  customerName: string;
  serviceName: string;
  date: string; // formatted human-readable
  time: string; // e.g. "14:00"
  duration: number;
  businessName: string;
  businessPhone: string;
  businessAddress: string;
  status: string;
  manageUrl?: string;
}

// ── Send function ──

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log("[Email - Dev Mode] Would send email:");
    console.log(`  To: ${payload.to}`);
    console.log(`  Subject: ${payload.subject}`);
    console.log(`  Body length: ${payload.html.length} chars`);
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[Email] Resend error:", err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return false;
  }
}

// ── Templates ──

function baseTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa;">
      <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e5e7eb;">
          ${content}
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
          Sent by Online Booking System
        </p>
      </div>
    </body>
    </html>
  `;
}

export function bookingCreatedEmail(data: BookingEmailData): EmailPayload {
  const statusText =
    data.status === "CONFIRMED"
      ? '<span style="color: #16a34a; font-weight: 600;">Confirmed</span>'
      : '<span style="color: #ca8a04; font-weight: 600;">Pending Approval</span>';

  const manageSection = data.manageUrl
    ? `
      <div style="margin-top: 24px; padding: 16px; background: #f3f4f6; border-radius: 6px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #374151;">Manage your booking:</p>
        <a href="${data.manageUrl}" style="color: #2563eb; font-size: 14px; word-break: break-all;">${data.manageUrl}</a>
        <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">Use this link to view or cancel your appointment.</p>
      </div>
    `
    : "";

  return {
    to: "",
    subject: `Booking ${data.status === "CONFIRMED" ? "Confirmed" : "Received"} - ${data.businessName}`,
    html: baseTemplate(`
      <h2 style="margin: 0 0 8px; color: #111827; font-size: 20px;">Booking ${data.status === "CONFIRMED" ? "Confirmed" : "Received"}</h2>
      <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">Hi ${data.customerName}, your booking details:</p>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Service</td>
          <td style="padding: 8px 0; color: #111827; text-align: right; font-weight: 500;">${data.serviceName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; border-top: 1px solid #f3f4f6;">Date</td>
          <td style="padding: 8px 0; color: #111827; text-align: right; font-weight: 500; border-top: 1px solid #f3f4f6;">${data.date}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; border-top: 1px solid #f3f4f6;">Time</td>
          <td style="padding: 8px 0; color: #111827; text-align: right; font-weight: 500; border-top: 1px solid #f3f4f6;">${data.time}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; border-top: 1px solid #f3f4f6;">Duration</td>
          <td style="padding: 8px 0; color: #111827; text-align: right; font-weight: 500; border-top: 1px solid #f3f4f6;">${data.duration} min</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; border-top: 1px solid #f3f4f6;">Status</td>
          <td style="padding: 8px 0; text-align: right; border-top: 1px solid #f3f4f6;">${statusText}</td>
        </tr>
      </table>

      ${manageSection}

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">
        <p style="margin: 0;">${data.businessName}</p>
        <p style="margin: 4px 0 0;">${data.businessAddress} | ${data.businessPhone}</p>
      </div>
    `),
  };
}

export function bookingApprovedEmail(data: BookingEmailData): EmailPayload {
  return {
    to: "",
    subject: `Booking Confirmed - ${data.businessName}`,
    html: baseTemplate(`
      <h2 style="margin: 0 0 8px; color: #16a34a; font-size: 20px;">Booking Approved!</h2>
      <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">Hi ${data.customerName}, your booking has been confirmed.</p>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #6b7280;">Service</td><td style="padding: 8px 0; color: #111827; text-align: right; font-weight: 500;">${data.serviceName}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; border-top: 1px solid #f3f4f6;">Date & Time</td><td style="padding: 8px 0; color: #111827; text-align: right; font-weight: 500; border-top: 1px solid #f3f4f6;">${data.date} at ${data.time}</td></tr>
      </table>

      ${data.manageUrl ? `<div style="margin-top: 24px; padding: 16px; background: #f3f4f6; border-radius: 6px;"><p style="margin: 0 0 8px; font-size: 14px; color: #374151;">Manage your booking:</p><a href="${data.manageUrl}" style="color: #2563eb; font-size: 14px;">${data.manageUrl}</a></div>` : ""}

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">
        <p style="margin: 0;">${data.businessName} | ${data.businessPhone}</p>
      </div>
    `),
  };
}

export function bookingCancelledEmail(
  data: BookingEmailData & { cancelledBy: "client" | "business" }
): EmailPayload {
  const byText =
    data.cancelledBy === "client"
      ? "You have cancelled your booking."
      : "Your booking has been cancelled by the business.";

  return {
    to: "",
    subject: `Booking Cancelled - ${data.businessName}`,
    html: baseTemplate(`
      <h2 style="margin: 0 0 8px; color: #dc2626; font-size: 20px;">Booking Cancelled</h2>
      <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">${byText}</p>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #6b7280;">Service</td><td style="padding: 8px 0; color: #111827; text-align: right; font-weight: 500;">${data.serviceName}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; border-top: 1px solid #f3f4f6;">Date & Time</td><td style="padding: 8px 0; color: #111827; text-align: right; font-weight: 500; border-top: 1px solid #f3f4f6;">${data.date} at ${data.time}</td></tr>
      </table>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">
        <p style="margin: 0;">If you'd like to rebook, visit the booking page for ${data.businessName}.</p>
      </div>
    `),
  };
}

export function bookingReminderEmail(data: BookingEmailData & { hoursBefore: number }): EmailPayload {
  return {
    to: "",
    subject: `Reminder: Appointment in ${data.hoursBefore}h - ${data.businessName}`,
    html: baseTemplate(`
      <h2 style="margin: 0 0 8px; color: #111827; font-size: 20px;">Appointment Reminder</h2>
      <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">Hi ${data.customerName}, a reminder about your upcoming appointment:</p>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #6b7280;">Service</td><td style="padding: 8px 0; color: #111827; text-align: right; font-weight: 500;">${data.serviceName}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; border-top: 1px solid #f3f4f6;">Date & Time</td><td style="padding: 8px 0; color: #111827; text-align: right; font-weight: 500; border-top: 1px solid #f3f4f6;">${data.date} at ${data.time}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; border-top: 1px solid #f3f4f6;">Location</td><td style="padding: 8px 0; color: #111827; text-align: right; font-weight: 500; border-top: 1px solid #f3f4f6;">${data.businessAddress}</td></tr>
      </table>

      ${data.manageUrl ? `<div style="margin-top: 24px; padding: 16px; background: #f3f4f6; border-radius: 6px;"><p style="margin: 0 0 8px; font-size: 14px; color: #374151;">Need to cancel?</p><a href="${data.manageUrl}" style="color: #2563eb; font-size: 14px;">${data.manageUrl}</a></div>` : ""}

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">
        <p style="margin: 0;">${data.businessName} | ${data.businessPhone}</p>
      </div>
    `),
  };
}

// ── Helper to build manage URL ──

export function buildManageUrl(token: string): string {
  return `${APP_URL}/manage/${token}`;
}

// ── Helper to format booking date for emails ──

export function formatBookingDate(startAt: Date): { date: string; time: string } {
  const date = startAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Skopje",
  });
  const time = startAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Skopje",
  });
  return { date, time };
}
