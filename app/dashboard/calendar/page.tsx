"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import {
  BookingDetailModal,
  type BookingDetail,
} from "@/components/booking-detail-modal";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";
import type { BookingStatus } from "@/lib/models/booking";

// ─── Types ───────────────────────────────────────────

interface BookingItem {
  _id: string;
  serviceId: {
    _id: string;
    name: string;
    durationMinutes: number;
    price?: number;
  } | null;
  startAt: string;
  endAt: string;
  status: BookingStatus;
  customer: {
    fullName: string;
    phone: string;
    email?: string;
  };
  note?: string;
  createdAt: string;
}

type ViewMode = "day" | "week";

// ─── Helpers ─────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatFullDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Hour grid for the time column (7am to 9pm)
const HOUR_START = 7;
const HOUR_END = 21;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
const TOTAL_MINUTES = (HOUR_END - HOUR_START + 1) * 60;

function getMinutePosition(dateStr: string): number {
  const d = new Date(dateStr);
  const mins = d.getHours() * 60 + d.getMinutes();
  return Math.max(0, mins - HOUR_START * 60);
}

function getDurationMinutes(startStr: string, endStr: string): number {
  return (new Date(endStr).getTime() - new Date(startStr).getTime()) / 60000;
}

// ─── Booking Block Component ─────────────────────────

function BookingBlock({
  booking,
  onClick,
}: {
  booking: BookingItem;
  onClick: () => void;
}) {
  const topPx = (getMinutePosition(booking.startAt) / TOTAL_MINUTES) * 100;
  const heightPx = (getDurationMinutes(booking.startAt, booking.endAt) / TOTAL_MINUTES) * 100;

  const statusColors: Record<string, string> = {
    PENDING: "bg-warning/20 border-warning/40 hover:bg-warning/30",
    CONFIRMED: "bg-primary/15 border-primary/30 hover:bg-primary/25",
    COMPLETED: "bg-success/15 border-success/30 hover:bg-success/25",
    NO_SHOW: "bg-destructive/15 border-destructive/30 hover:bg-destructive/25",
    CANCELLED_BY_CLIENT: "bg-muted border-border hover:bg-muted/80",
    CANCELLED_BY_BUSINESS: "bg-muted border-border hover:bg-muted/80",
  };

  return (
    <button
      onClick={onClick}
      className={`absolute left-1 right-1 rounded-md border px-2 py-1 text-left transition-colors overflow-hidden cursor-pointer ${statusColors[booking.status] || "bg-secondary border-border"}`}
      style={{
        top: `${topPx}%`,
        height: `${Math.max(heightPx, 2.5)}%`,
        minHeight: "24px",
      }}
    >
      <p className="text-xs font-medium text-foreground truncate">
        {booking.customer.fullName}
      </p>
      <p className="text-[10px] text-muted-foreground truncate">
        {formatTime(booking.startAt)} - {booking.serviceId?.name || "Service"}
      </p>
    </button>
  );
}

// ─── Day View ────────────────────────────────────────

function DayView({
  date,
  bookings,
  onBookingClick,
}: {
  date: Date;
  bookings: BookingItem[];
  onBookingClick: (b: BookingItem) => void;
}) {
  const dayBookings = bookings.filter((b) =>
    isSameDay(new Date(b.startAt), date)
  );

  return (
    <div className="flex flex-col">
      <div className="text-center py-3 border-b border-border">
        <p className="text-sm font-semibold text-foreground">
          {formatFullDate(date)}
        </p>
        <p className="text-xs text-muted-foreground">
          {dayBookings.length} booking{dayBookings.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-1">
        {/* Time gutter */}
        <div className="w-14 shrink-0 border-r border-border">
          {HOURS.map((h) => (
            <div key={h} className="h-16 flex items-start justify-end pr-2 pt-0.5">
              <span className="text-[10px] text-muted-foreground">
                {String(h).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        {/* Day column */}
        <div className="flex-1 relative">
          {/* Hour grid lines */}
          {HOURS.map((h) => (
            <div key={h} className="h-16 border-b border-border/50" />
          ))}

          {/* Booking blocks (positioned absolutely) */}
          {dayBookings.map((booking) => (
            <BookingBlock
              key={booking._id}
              booking={booking}
              onClick={() => onBookingClick(booking)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Week View ───────────────────────────────────────

function WeekView({
  weekStart,
  bookings,
  onBookingClick,
}: {
  weekStart: Date;
  bookings: BookingItem[];
  onBookingClick: (b: BookingItem) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  return (
    <div className="flex flex-col overflow-x-auto">
      {/* Day headers */}
      <div className="flex border-b border-border">
        <div className="w-14 shrink-0" />
        {days.map((d) => {
          const isToday = isSameDay(d, today);
          const dayBookings = bookings.filter((b) =>
            isSameDay(new Date(b.startAt), d)
          );
          return (
            <div
              key={d.toISOString()}
              className={`flex-1 min-w-[120px] text-center py-2 border-l border-border ${isToday ? "bg-primary/5" : ""}`}
            >
              <p className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                {d.toLocaleDateString("en-US", { weekday: "short" })}
              </p>
              <p className={`text-lg font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>
                {d.getDate()}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {dayBookings.length > 0 ? `${dayBookings.length} appt` : ""}
              </p>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex flex-1">
        {/* Time gutter */}
        <div className="w-14 shrink-0 border-r border-border">
          {HOURS.map((h) => (
            <div key={h} className="h-14 flex items-start justify-end pr-2 pt-0.5">
              <span className="text-[10px] text-muted-foreground">
                {String(h).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((d) => {
          const dayBookings = bookings.filter((b) =>
            isSameDay(new Date(b.startAt), d)
          );
          const isToday = isSameDay(d, today);

          return (
            <div
              key={d.toISOString()}
              className={`flex-1 min-w-[120px] relative border-l border-border ${isToday ? "bg-primary/5" : ""}`}
            >
              {/* Hour grid lines */}
              {HOURS.map((h) => (
                <div key={h} className="h-14 border-b border-border/50" />
              ))}

              {/* Booking blocks */}
              {dayBookings.map((booking) => (
                <BookingBlock
                  key={booking._id}
                  booking={booking}
                  onClick={() => onBookingClick(booking)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sidebar List View ───────────────────────────────

function BookingList({
  bookings,
  onBookingClick,
}: {
  bookings: BookingItem[];
  onBookingClick: (b: BookingItem) => void;
}) {
  if (bookings.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">No bookings in this period</p>
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, BookingItem[]> = {};
  for (const b of bookings) {
    const dateKey = toDateStr(new Date(b.startAt));
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(b);
  }

  return (
    <div className="divide-y divide-border">
      {Object.entries(grouped).map(([dateKey, dayBookings]) => (
        <div key={dateKey}>
          <div className="px-4 py-2 bg-secondary/30">
            <p className="text-xs font-medium text-muted-foreground">
              {formatShortDate(new Date(dateKey + "T12:00:00"))}
            </p>
          </div>
          {dayBookings.map((booking) => (
            <button
              key={booking._id}
              onClick={() => onBookingClick(booking)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
            >
              <div className="w-12 shrink-0 text-center">
                <span className="text-xs font-semibold text-foreground">
                  {formatTime(booking.startAt)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {booking.customer.fullName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {booking.serviceId?.name || "Service"}
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Main Calendar Page ──────────────────────────────

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);

    let from: string;
    let to: string;

    if (view === "day") {
      from = toDateStr(currentDate);
      to = from;
    } else {
      const monday = getMonday(currentDate);
      from = toDateStr(monday);
      to = toDateStr(addDays(monday, 6));
    }

    const res = await apiClient.get<{ bookings: BookingItem[] }>(
      `/bookings?from=${from}&to=${to}`
    );
    if (res.data?.bookings) {
      setBookings(res.data.bookings);
    }
    setIsLoading(false);
  }, [view, currentDate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  function navigatePrev() {
    if (view === "day") {
      setCurrentDate((d) => addDays(d, -1));
    } else {
      setCurrentDate((d) => addDays(d, -7));
    }
  }

  function navigateNext() {
    if (view === "day") {
      setCurrentDate((d) => addDays(d, 1));
    } else {
      setCurrentDate((d) => addDays(d, 7));
    }
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function handleBookingClick(booking: BookingItem) {
    setSelectedBooking(booking as BookingDetail);
    setModalOpen(true);
  }

  const weekStart = getMonday(currentDate);

  // Title text
  const title =
    view === "day"
      ? formatFullDate(currentDate)
      : `${formatShortDate(weekStart)} - ${formatShortDate(addDays(weekStart, 6))}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={navigatePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground ml-2 text-balance">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setView("day")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "day"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-border ${
                view === "week"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              Week
            </button>
          </div>

          <Button size="sm" asChild>
            <Link href="/dashboard/bookings/new">
              <Plus className="h-4 w-4" />
              New Booking
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Calendar grid */}
          <div className="flex-1 rounded-lg border border-border bg-card overflow-hidden">
            {view === "day" ? (
              <DayView
                date={currentDate}
                bookings={bookings}
                onBookingClick={handleBookingClick}
              />
            ) : (
              <WeekView
                weekStart={weekStart}
                bookings={bookings}
                onBookingClick={handleBookingClick}
              />
            )}
          </div>

          {/* Sidebar booking list */}
          <div className="lg:w-72 rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                Bookings ({bookings.length})
              </h2>
            </div>
            <BookingList bookings={bookings} onBookingClick={handleBookingClick} />
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onStatusUpdated={fetchBookings}
      />
    </div>
  );
}
