import { connectDB } from "@/lib/db";
import { WorkingHours } from "@/lib/models/working-hours";
import { Closure } from "@/lib/models/closure";
import { Booking } from "@/lib/models/booking";
import { Service } from "@/lib/models/service";
import { Business } from "@/lib/models/business";

/**
 * Availability Engine (Sprint 3)
 *
 * Input: businessId, date (YYYY-MM-DD), serviceId
 *
 * Steps:
 * 1. Load working hours for that day of week
 * 2. Load closures for that date
 * 3. Load existing CONFIRMED bookings for that date
 * 4. Compute open intervals (working hours minus closures)
 * 5. Generate slots on a grid (every service duration)
 * 6. Exclude slots overlapping confirmed bookings
 * 7. Apply minLeadTimeMinutes
 * 8. Return list of available start times
 *
 * V1 rule: only CONFIRMED blocks slots, PENDING does not.
 */

interface TimeRange {
  start: number; // minutes from midnight
  end: number;
}

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Subtract blocked ranges from open ranges */
function subtractRanges(
  open: TimeRange[],
  blocked: TimeRange[]
): TimeRange[] {
  let result = [...open];

  for (const block of blocked) {
    const next: TimeRange[] = [];
    for (const range of result) {
      if (block.end <= range.start || block.start >= range.end) {
        // No overlap
        next.push(range);
      } else {
        // Overlap -- split
        if (block.start > range.start) {
          next.push({ start: range.start, end: block.start });
        }
        if (block.end < range.end) {
          next.push({ start: block.end, end: range.end });
        }
      }
    }
    result = next;
  }

  return result;
}

export interface AvailableSlot {
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export async function getAvailableSlots(
  businessId: string,
  date: string, // "YYYY-MM-DD"
  serviceId: string
): Promise<AvailableSlot[]> {
  await connectDB();

  // 1. Load service
  const service = await Service.findById(serviceId);
  if (!service || String(service.businessId) !== businessId) {
    return [];
  }

  const slotDuration = service.durationMinutes + service.bufferMinutes;

  // 2. Load business for policies
  const business = await Business.findById(businessId);
  if (!business || !business.isActive) return [];

  // 3. Get day of week for this date
  const dateObj = new Date(date + "T00:00:00");
  const dayOfWeek = dateObj.getDay(); // 0=Sun ... 6=Sat

  // 4. Load working hours for this day
  const hours = await WorkingHours.find({
    businessId,
    dayOfWeek,
  });

  if (hours.length === 0) return []; // closed this day

  // Build open intervals from working hours
  let openIntervals: TimeRange[] = hours.map((h) => ({
    start: parseTime(h.startTime),
    end: parseTime(h.endTime),
  }));

  // 5. Load closures for this date
  const closures = await Closure.find({ businessId, date });
  const blockedByClosures: TimeRange[] = [];

  for (const closure of closures) {
    if (closure.type === "HOLIDAY") {
      // Entire day blocked
      return [];
    }
    if (closure.type === "BREAK" && closure.startTime && closure.endTime) {
      blockedByClosures.push({
        start: parseTime(closure.startTime),
        end: parseTime(closure.endTime),
      });
    }
  }

  // Subtract closures from open intervals
  openIntervals = subtractRanges(openIntervals, blockedByClosures);

  // 6. Load confirmed bookings for this date
  const dayStart = new Date(date + "T00:00:00Z");
  const dayEnd = new Date(date + "T23:59:59Z");

  const confirmedBookings = await Booking.find({
    businessId,
    status: "CONFIRMED",
    startAt: { $gte: dayStart },
    endAt: { $lte: dayEnd },
  });

  // Convert bookings to time ranges (in local minutes)
  // Since we store UTC and timezone is Europe/Skopje, we convert
  const tz = business.timezone || "Europe/Skopje";
  const blockedByBookings: TimeRange[] = confirmedBookings.map((b) => {
    const startLocal = new Date(
      b.startAt.toLocaleString("en-US", { timeZone: tz })
    );
    const endLocal = new Date(
      b.endAt.toLocaleString("en-US", { timeZone: tz })
    );
    return {
      start: startLocal.getHours() * 60 + startLocal.getMinutes(),
      end: endLocal.getHours() * 60 + endLocal.getMinutes(),
    };
  });

  // Subtract confirmed bookings
  openIntervals = subtractRanges(openIntervals, blockedByBookings);

  // 7. Generate slots from open intervals
  const slots: AvailableSlot[] = [];

  for (const interval of openIntervals) {
    let cursor = interval.start;
    while (cursor + service.durationMinutes <= interval.end) {
      slots.push({
        startTime: formatTime(cursor),
        endTime: formatTime(cursor + service.durationMinutes),
      });
      cursor += slotDuration; // move by duration + buffer
    }
  }

  // 8. Apply minLeadTimeMinutes
  const minLead = business.policies?.minLeadTimeMinutes ?? 0;
  if (minLead > 0) {
    const nowInTz = new Date(
      new Date().toLocaleString("en-US", { timeZone: tz })
    );
    const todayStr = `${nowInTz.getFullYear()}-${String(nowInTz.getMonth() + 1).padStart(2, "0")}-${String(nowInTz.getDate()).padStart(2, "0")}`;

    if (date === todayStr) {
      const nowMinutes =
        nowInTz.getHours() * 60 + nowInTz.getMinutes() + minLead;
      return slots.filter((s) => parseTime(s.startTime) >= nowMinutes);
    }
  }

  return slots;
}
