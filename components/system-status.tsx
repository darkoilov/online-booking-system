"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Database,
  Server,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

interface HealthData {
  status: string;
  timestamp: string;
  database: string;
  environment: string;
  error?: string;
}

type CheckStatus = "loading" | "ok" | "error";

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === "loading") {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }
  if (status === "ok") {
    return <CheckCircle2 className="h-4 w-4 text-success" />;
  }
  return <XCircle className="h-4 w-4 text-destructive" />;
}

function StatusRow({
  icon: Icon,
  label,
  value,
  status,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  status: CheckStatus;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-secondary">
          <Icon className="h-4 w-4 text-secondary-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{value}</p>
        </div>
      </div>
      <StatusIcon status={status} />
    </div>
  );
}

export function SystemStatus() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [status, setStatus] = useState<CheckStatus>("loading");

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("/api/health");
        const data: HealthData = await res.json();
        setHealth(data);
        setStatus(data.status === "ok" ? "ok" : "error");
      } catch {
        setStatus("error");
        setHealth(null);
      }
    }
    checkHealth();
  }, []);

  const dbStatus: CheckStatus =
    status === "loading"
      ? "loading"
      : health?.database === "connected"
        ? "ok"
        : "error";

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-card-foreground">
          System Status
        </h2>
      </div>

      <div className="space-y-0">
        <StatusRow
          icon={Server}
          label="API Server"
          value={
            status === "loading"
              ? "Checking..."
              : status === "ok"
                ? "Running"
                : "Unreachable"
          }
          status={status}
        />
        <StatusRow
          icon={Database}
          label="MongoDB"
          value={
            dbStatus === "loading"
              ? "Connecting..."
              : dbStatus === "ok"
                ? "Connected"
                : health?.error || "Disconnected"
          }
          status={dbStatus}
        />
        <StatusRow
          icon={Server}
          label="Environment"
          value={health?.environment || "..."}
          status={status === "loading" ? "loading" : "ok"}
        />
      </div>

      {health?.timestamp && (
        <p className="text-xs text-muted-foreground mt-4">
          {"Last checked: "}
          {new Date(health.timestamp).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
