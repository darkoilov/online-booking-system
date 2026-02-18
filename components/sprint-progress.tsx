import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

const sprints = [
  { name: "Sprint 0: Foundation", status: "done" as const },
  { name: "Sprint 1: Auth + Business", status: "done" as const },
  { name: "Sprint 2: Services + Schedule", status: "done" as const },
  { name: "Sprint 3: Availability + Booking", status: "current" as const },
  { name: "Sprint 4: Calendar + Management", status: "upcoming" as const },
  { name: "Sprint 5: Policies + Email", status: "upcoming" as const },
  { name: "Sprint 6: Hardening + Audit", status: "upcoming" as const },
  { name: "Sprint 7: Admin + Launch", status: "upcoming" as const },
];

export function SprintProgress() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-card-foreground mb-4">
        Development Roadmap
      </h2>
      <div className="space-y-3">
        {sprints.map((sprint) => (
          <div
            key={sprint.name}
            className={`flex items-center gap-3 px-3 py-2 rounded-md ${
              sprint.status === "current"
                ? "bg-primary/10 border border-primary/20"
                : sprint.status === "done"
                  ? "bg-secondary/50"
                  : "bg-secondary/50"
            }`}
          >
            {sprint.status === "current" ? (
              <ArrowRight className="h-4 w-4 text-primary shrink-0" />
            ) : sprint.status === "upcoming" ? (
              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            )}
            <span
              className={`text-sm ${
                sprint.status === "current"
                  ? "font-medium text-primary"
                  : sprint.status === "done"
                    ? "text-foreground"
                    : "text-muted-foreground"
              }`}
            >
              {sprint.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
