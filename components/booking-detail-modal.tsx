"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { apiClient } from "@/lib/api-client";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Scissors,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import type { BookingStatus } from "@/lib/models/booking";

export interface BookingDetail {
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

interface BookingDetailModalProps {
  booking: BookingDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdated: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
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

// Status actions available from each state
const STATUS_ACTIONS: Record<
  string,
  { label: string; newStatus: BookingStatus; variant: "default" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }[]
> = {
  PENDING: [
    { label: "Confirm", newStatus: "CONFIRMED", variant: "default", icon: CheckCircle },
    { label: "Cancel", newStatus: "CANCELLED_BY_BUSINESS", variant: "destructive", icon: XCircle },
  ],
  CONFIRMED: [
    { label: "Complete", newStatus: "COMPLETED", variant: "default", icon: CheckCircle },
    { label: "No Show", newStatus: "NO_SHOW", variant: "outline", icon: AlertTriangle },
    { label: "Cancel", newStatus: "CANCELLED_BY_BUSINESS", variant: "destructive", icon: XCircle },
  ],
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function BookingDetailModal({
  booking,
  open,
  onOpenChange,
  onStatusUpdated,
}: BookingDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(newStatus: BookingStatus) {
    if (!booking) return;
    setIsUpdating(true);
    setError(null);

    const res = await apiClient.patch(`/bookings/${booking._id}/status`, {
      status: newStatus,
    });

    if (res.error) {
      setError(res.error);
      setIsUpdating(false);
      return;
    }

    setIsUpdating(false);
    onStatusUpdated();
    onOpenChange(false);
  }

  if (!booking) return null;

  const actions = STATUS_ACTIONS[booking.status] || [];
  const isTerminal = actions.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg">Booking Details</DialogTitle>
            <BookingStatusBadge status={booking.status} />
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          {/* Service info */}
          <div className="rounded-lg bg-secondary/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Scissors className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">
                {booking.serviceId?.name || "Unknown Service"}
              </span>
            </div>
            {booking.serviceId && (
              <p className="text-xs text-muted-foreground ml-6">
                {booking.serviceId.durationMinutes} min
                {booking.serviceId.price != null &&
                  ` -- ${booking.serviceId.price} MKD`}
              </p>
            )}
          </div>

          {/* Date & Time */}
          <div className="flex flex-col gap-3">
            <InfoRow
              icon={Calendar}
              label="Date"
              value={formatDate(booking.startAt)}
            />
            <InfoRow
              icon={Clock}
              label="Time"
              value={`${formatTime(booking.startAt)} - ${formatTime(booking.endAt)}`}
            />
          </div>

          <Separator />

          {/* Customer info */}
          <div className="flex flex-col gap-3">
            <InfoRow
              icon={User}
              label="Customer"
              value={booking.customer.fullName}
            />
            <InfoRow
              icon={Phone}
              label="Phone"
              value={booking.customer.phone}
            />
            <InfoRow
              icon={Mail}
              label="Email"
              value={booking.customer.email}
            />
            <InfoRow icon={FileText} label="Note" value={booking.note} />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">
              {error}
            </p>
          )}

          {/* Actions */}
          {!isTerminal && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.newStatus}
                      variant={action.variant}
                      size="sm"
                      onClick={() => handleStatusChange(action.newStatus)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            </>
          )}

          {isTerminal && (
            <p className="text-xs text-muted-foreground text-center italic">
              This booking is in a final state and cannot be changed.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
