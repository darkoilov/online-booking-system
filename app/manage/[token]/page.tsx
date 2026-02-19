"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Loader2,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import type { BookingStatus } from "@/lib/models/booking";
import Link from "next/link";

// ── Types ──

interface ManageBookingData {
  id: string;
  status: BookingStatus;
  startAt: string;
  endAt: string;
  customer: {
    fullName: string;
    phone: string;
    email?: string;
  };
  note?: string;
  service: {
    name: string;
    durationMinutes: number;
    price?: number;
  } | null;
  business: {
    name: string;
    phone: string;
    address: string;
    slug: string;
    policies: {
      cancelWindowHours: number;
    };
  } | null;
}

// ── Fetcher ──

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Request failed");
  }
  return res.json();
}

// ── Page ──

export default function ManageBookingPage() {
  const { token } = useParams<{ token: string }>();
  const { data, error, isLoading, mutate } = useSWR(
    token ? `/api/public/manage/${token}` : null,
    (url: string) => fetchJSON<{ booking: ManageBookingData }>(url)
  );

  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await fetch(`/api/public/manage/${token}/cancel`, {
        method: "POST",
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Failed to cancel booking.");
        setCancelling(false);
        return;
      }

      setCancelled(true);
      toast.success("Booking cancelled successfully.");
      mutate();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setCancelling(false);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-10 w-10 text-destructive/60 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Booking not found
            </h2>
            <p className="text-sm text-muted-foreground">
              This link may be invalid or the booking no longer exists.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { booking } = data;
  const canCancel =
    !cancelled &&
    (booking.status === "PENDING" || booking.status === "CONFIRMED");

  const startDate = new Date(booking.startAt);
  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Skopje",
  });
  const formattedTime = startDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Skopje",
  });

  // Cancel window info
  let cancelWindowInfo: string | null = null;
  if (canCancel && booking.business?.policies.cancelWindowHours) {
    const hoursUntil =
      (startDate.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < booking.business.policies.cancelWindowHours) {
      cancelWindowInfo = `Cancellation window has passed (must cancel at least ${booking.business.policies.cancelWindowHours}h before).`;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {booking.business && (
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-lg px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {booking.business.name}
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {booking.business.address}
                </p>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        {/* Cancelled success state */}
        {cancelled && (
          <Card className="mb-6">
            <CardContent className="text-center py-8">
              <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <X className="h-7 w-7 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Booking Cancelled
              </h2>
              <p className="text-sm text-muted-foreground">
                Your appointment has been cancelled. You can rebook anytime.
              </p>
              {booking.business && (
                <Button variant="outline" className="mt-4" asChild>
                  <Link href={`/book/${booking.business.slug}`}>
                    Book a new appointment
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Booking details */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Booking Details</CardTitle>
              <BookingStatusBadge
                status={cancelled ? "CANCELLED_BY_CLIENT" : booking.status}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Service */}
            {booking.service && (
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-md bg-secondary shrink-0 mt-0.5">
                  <Calendar className="h-4 w-4 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {booking.service.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {booking.service.durationMinutes} min
                    {booking.service.price != null &&
                      ` -- $${booking.service.price.toFixed(2)}`}
                  </p>
                </div>
              </div>
            )}

            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-secondary shrink-0 mt-0.5">
                <Clock className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {formattedDate}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formattedTime}
                </p>
              </div>
            </div>

            {/* Contact info */}
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-secondary shrink-0 mt-0.5">
                <Phone className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {booking.customer.fullName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {booking.customer.phone}
                  {booking.customer.email && ` -- ${booking.customer.email}`}
                </p>
              </div>
            </div>

            {/* Note */}
            {booking.note && (
              <div className="rounded-md bg-secondary/50 p-3">
                <p className="text-sm text-muted-foreground">{booking.note}</p>
              </div>
            )}

            {/* Reference */}
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Booking reference: {booking.id.slice(-8).toUpperCase()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cancel action */}
        {canCancel && !cancelled && (
          <div className="mt-6">
            {cancelWindowInfo ? (
              <div className="rounded-md bg-destructive/5 border border-destructive/20 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{cancelWindowInfo}</p>
                </div>
              </div>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" size="lg">
                    Cancel Booking
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Your appointment on{" "}
                      {formattedDate} at {formattedTime} will be cancelled.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep booking</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {cancelling && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      Yes, cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}

        {/* Already terminal state info */}
        {!canCancel && !cancelled && (
          <div className="mt-6">
            {booking.status === "COMPLETED" && (
              <div className="rounded-md bg-secondary/50 p-4 text-center">
                <Check className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  This appointment has been completed. Thank you for visiting!
                </p>
                {booking.business && (
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href={`/book/${booking.business.slug}`}>
                      Book again
                    </Link>
                  </Button>
                )}
              </div>
            )}
            {(booking.status === "CANCELLED_BY_CLIENT" ||
              booking.status === "CANCELLED_BY_BUSINESS") && (
              <div className="rounded-md bg-secondary/50 p-4 text-center">
                <X className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  This booking has been cancelled.
                </p>
                {booking.business && (
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href={`/book/${booking.business.slug}`}>
                      Book a new appointment
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Business contact */}
        {booking.business && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Need help? Contact {booking.business.name} at{" "}
              {booking.business.phone}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
