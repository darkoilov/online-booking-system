"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Users,
  Scissors,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

export default function DashboardPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBusiness() {
      const res = await apiClient.get<{ business: BusinessData }>(
        "/business/me"
      );
      if (res.status === 404) {
        // No business yet, redirect to onboarding
        router.push("/onboarding");
        return;
      }
      if (res.data?.business) {
        setBusiness(res.data.business);
        // Refresh user to pick up businessId
        await refreshUser();
      }
      setIsLoading(false);
    }

    if (user) {
      loadBusiness();
    }
  }, [user, router, refreshUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!business) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{business.name}</h1>
        <p className="text-muted-foreground mt-1">
          {business.category} &middot; {business.address}
        </p>
      </div>

      {/* Quick stats (placeholder values -- will be real in Sprint 4) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          icon={CalendarDays}
          label="Today's Bookings"
          value="--"
          subtext="Coming in Sprint 4"
        />
        <StatCard
          icon={Users}
          label="Total Clients"
          value="--"
          subtext="Coming in Sprint 4"
        />
        <StatCard
          icon={Scissors}
          label="Active Services"
          value="--"
          subtext="Coming in Sprint 2"
        />
        <StatCard
          icon={Clock}
          label="Working Hours"
          value="--"
          subtext="Coming in Sprint 2"
        />
      </div>

      {/* Quick actions */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings">
              <ArrowRight className="h-4 w-4" />
              Business Settings
            </Link>
          </Button>
          <Button variant="outline" disabled>
            Add Services (Sprint 2)
          </Button>
          <Button variant="outline" disabled>
            Set Working Hours (Sprint 2)
          </Button>
          <Button variant="outline" disabled>
            View Calendar (Sprint 4)
          </Button>
        </div>
      </div>

      {/* Booking URL */}
      <div className="mt-6 rounded-lg border border-border bg-secondary/30 p-4">
        <p className="text-sm text-muted-foreground mb-1">
          Your public booking page
        </p>
        <p className="text-sm font-mono text-foreground">
          /book/{business.slug}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          This will be active after Sprint 3 (Availability + Public Booking)
        </p>
      </div>
    </div>
  );
}
