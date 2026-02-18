import { NavHeader } from "@/components/nav-header";
import { SystemStatus } from "@/components/system-status";
import { FoundationChecklist } from "@/components/foundation-checklist";
import { SprintProgress } from "@/components/sprint-progress";
import { Calendar, Code2, Database, Shield, Layers, Zap } from "lucide-react";

function ModuleCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex gap-3">
      <div className="flex items-center justify-center w-9 h-9 rounded-md bg-secondary shrink-0">
        <Icon className="h-4 w-4 text-secondary-foreground" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-card-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <NavHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Hero section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl text-balance">
            BookIt Platform
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            Online booking system for service businesses. Manage appointments,
            services, working hours, and client bookings all in one place.
          </p>
        </div>

        {/* Status + Checklist grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <SystemStatus />
          <FoundationChecklist />
        </div>

        {/* Architecture modules */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Architecture Modules
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ModuleCard
              icon={Shield}
              title="Auth Module"
              description="JWT-based authentication with role-based access control for Owner, Staff, and Admin roles."
            />
            <ModuleCard
              icon={Layers}
              title="Business Module"
              description="Business profiles with slug-based routing, categories, contact info, and booking policies."
            />
            <ModuleCard
              icon={Code2}
              title="Services Module"
              description="Service management with duration, pricing, and buffer time between appointments."
            />
            <ModuleCard
              icon={Calendar}
              title="Schedule Module"
              description="Working hours, breaks, and holidays management for availability calculation."
            />
            <ModuleCard
              icon={Database}
              title="Booking Module"
              description="Full booking lifecycle with status machine: Pending, Confirmed, Completed, Cancelled, No-Show."
            />
            <ModuleCard
              icon={Zap}
              title="Availability Engine"
              description="Slot computation from working hours, closures, and existing bookings with buffer time."
            />
          </div>
        </div>

        {/* Sprint roadmap */}
        <SprintProgress />

        {/* Data models summary */}
        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Data Models
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "User", fields: "role, email, passwordHash, businessId" },
              {
                name: "Business",
                fields: "slug, category, policies, notifications",
              },
              {
                name: "Service",
                fields: "duration, price, buffer, isActive",
              },
              {
                name: "WorkingHours",
                fields: "dayOfWeek, startTime, endTime",
              },
              {
                name: "Closure",
                fields: "type (BREAK/HOLIDAY), date, times",
              },
              {
                name: "Booking",
                fields: "service, times, status, customer",
              },
              {
                name: "BookingAudit",
                fields: "action, actorType, before/after",
              },
            ].map((model) => (
              <div
                key={model.name}
                className="rounded-md border border-border bg-secondary/30 px-3 py-2"
              >
                <p className="text-sm font-medium text-foreground font-mono">
                  {model.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {model.fields}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
