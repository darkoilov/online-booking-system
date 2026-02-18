import { CheckCircle2, Circle } from "lucide-react";

const items = [
  { label: "MongoDB connection utility", done: true },
  { label: "Mongoose data models (7 models)", done: true },
  { label: "Zod validation schemas", done: true },
  { label: "API error handler", done: true },
  { label: "Auth middleware skeleton (JWT)", done: true },
  { label: "Health check endpoint", done: true },
  { label: "API client with interceptors", done: true },
  { label: "Navigation skeleton", done: true },
];

export function FoundationChecklist() {
  const completedCount = items.filter((i) => i.done).length;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-card-foreground">
          Sprint 0 Checklist
        </h2>
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
          {completedCount}/{items.length}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3 py-1">
            {item.done ? (
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span
              className={`text-sm ${
                item.done ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 w-full bg-secondary rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{
            width: `${(completedCount / items.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
