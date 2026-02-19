import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/models/booking";

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-warning/15 text-warning-foreground border-warning/30",
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-primary/15 text-primary border-primary/30",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-success/15 text-success border-success/30",
  },
  NO_SHOW: {
    label: "No Show",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
  CANCELLED_BY_CLIENT: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border-border",
  },
  CANCELLED_BY_BUSINESS: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", config.className)}
    >
      {config.label}
    </Badge>
  );
}
