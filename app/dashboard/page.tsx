"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Users,
  Scissors,
  Clock,
  Plus,
  ArrowRight,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import {
  BookingDetailModal,
  type BookingDetail,
} from "@/components/booking-detail-modal";
import Link from "next/link";
import type { BookingStatus } from "@/lib/models/booking";

interface BusinessData {
  _id: string;
  name: string;
  slug: string;
  category: string;
  phone: string;
  address: string;
  policies: {
    autoConfirm: boolean;
  };
}

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

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-md bg-secondary">
          <Icon className="h-4 w-4 text-secondary-foreground" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-card-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
    </div>
  );
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [todayBookings, setTodayBookings] = useState<BookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadTodayBookings = useCallback(async () => {
    const today = getTodayStr();
    const res = await apiClient.get<{ bookings: BookingItem[] }>(
      `/bookings?from=${today}&to=${today}`
    );
    if (res.data?.bookings) {
      setTodayBookings(res.data.bookings);
    }
  }, []);

  useEffect(() => {
    async function loadBusiness() {
      const res = await apiClient.get<{ business: BusinessData }>(
        "/business/me"
      );
      if (res.status === 404) {
        router.push("/onboarding");
        return;
      }
      if (res.data?.business) {
        setBusiness(res.data.business);
        await refreshUser();
      }
      setIsLoading(false);
    }

    if (user) {
      loadBusiness();
    }
  }, [user, router, refreshUser]);

  useEffect(() => {
    if (business) {
      loadTodayBookings();
    }
  }, [business, loadTodayBookings]);

  function handleBookingClick(booking: BookingItem) {
    setSelectedBooking(booking as BookingDetail);
    setModalOpen(true);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!business) return null;

  const activeBookings = todayBookings.filter(
    (b) => b.status === "PENDING" || b.status === "CONFIRMED"
  );
  const completedBookings = todayBookings.filter(
    (b) => b.status === "COMPLETED"
  );
  const pendingCount = todayBookings.filter((b) => b.status === "PENDING").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{business.name}</h1>
          <p className="text-muted-foreground mt-1">
            {business.category} &middot; {business.address}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/bookings/new">
            <Plus className="h-4 w-4" />
            New Booking
          </Link>
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          icon={CalendarDays}
          label="Today's Bookings"
          value={String(todayBookings.length)}
          subtext={pendingCount > 0 ? `${pendingCount} pending confirmation` : "All confirmed"}
        />
        <StatCard
          icon={Users}
          label="Active"
          value={String(activeBookings.length)}
          subtext="Pending + confirmed today"
        />
        <StatCard
          icon={Scissors}
          label="Completed"
          value={String(completedBookings.length)}
          subtext="Finished today"
        />
        <StatCard
          icon={Clock}
          label="Next Up"
          value={
            activeBookings.length > 0
              ? formatTime(activeBookings[0].startAt)
              : "--"
          }
          subtext={
            activeBookings.length > 0
              ? activeBookings[0].customer.fullName
              : "No upcoming bookings"
          }
        />
      </div>

      {/* Today's bookings list */}
      <div className="rounded-lg border border-border bg-card mb-6">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">
            {"Today's Schedule"}
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/calendar">
              <CalendarDays className="h-4 w-4" />
              View Calendar
            </Link>
          </Button>
        </div>

        {todayBookings.length === 0 ? (
          <div className="p-8 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No bookings for today</p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link href="/dashboard/bookings/new">
                <Plus className="h-4 w-4" />
                Add a Booking
              </Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {todayBookings.map((booking) => (
              <button
                key={booking._id}
                onClick={() => handleBookingClick(booking)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-secondary/50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center w-14 shrink-0">
                  <span className="text-sm font-semibold text-foreground">
                    {formatTime(booking.startAt)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(booking.endAt)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {booking.customer.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {booking.serviceId?.name || "Unknown Service"}
                    {booking.serviceId
                      ? ` -- ${booking.serviceId.durationMinutes} min`
                      : ""}
                  </p>
                </div>
                <BookingStatusBadge status={booking.status} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="rounded-lg border border-border bg-card p-6 mb-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button variant="outline" asChild>
            <Link href="/dashboard/calendar">
              <CalendarDays className="h-4 w-4" />
              View Calendar
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/services">
              <Scissors className="h-4 w-4" />
              Manage Services
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/schedule">
              <Clock className="h-4 w-4" />
              Working Hours
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings">
              <ArrowRight className="h-4 w-4" />
              Business Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Booking URL */}
      <div className="rounded-lg border border-border bg-secondary/30 p-4">
        <p className="text-sm text-muted-foreground mb-1">
          Your public booking page
        </p>
        <div className="flex items-center gap-2">
          <p className="text-sm font-mono text-foreground">
            /book/{business.slug}
          </p>
          <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
            <Link href={`/book/${business.slug}`} target="_blank">
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Booking Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onStatusUpdated={loadTodayBookings}
      />
    </div>
  );
}
