"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Clock,
  CalendarOff,
  Plus,
  Trash2,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ──

interface WorkingHour {
  _id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Closure {
  _id: string;
  type: "BREAK" | "HOLIDAY";
  date: string;
  startTime?: string;
  endTime?: string;
  note?: string;
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Fetchers ──

const hoursFetcher = async (url: string) => {
  const res = await apiClient.get<{ hours: WorkingHour[] }>(url);
  if (res.error) throw new Error(res.error);
  return res.data!.hours;
};

const closuresFetcher = async (url: string) => {
  const res = await apiClient.get<{ closures: Closure[] }>(url);
  if (res.error) throw new Error(res.error);
  return res.data!.closures;
};

// ── Default weekly schedule ──

interface DayRow {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

function buildDayRows(hours: WorkingHour[]): DayRow[] {
  return Array.from({ length: 7 }, (_, i) => {
    const entry = hours.find((h) => h.dayOfWeek === i);
    return {
      dayOfWeek: i,
      enabled: !!entry,
      startTime: entry?.startTime ?? "09:00",
      endTime: entry?.endTime ?? "17:00",
    };
  });
}

// ── Page ──

export default function SchedulePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Schedule</h1>
        <p className="text-sm text-muted-foreground">
          Set your weekly working hours and manage closures
        </p>
      </div>

      <WorkingHoursSection />
      <ClosuresSection />
    </div>
  );
}

// ──────────────────────────────────────────────
// Working Hours Editor
// ──────────────────────────────────────────────

function WorkingHoursSection() {
  const {
    data: hours,
    isLoading,
    mutate,
  } = useSWR("/working-hours", hoursFetcher);
  const [rows, setRows] = useState<DayRow[] | null>(null);
  const [saving, setSaving] = useState(false);

  // Initialize rows when data arrives
  const dayRows = rows ?? (hours ? buildDayRows(hours) : null);

  function updateRow(dayOfWeek: number, updates: Partial<DayRow>) {
    if (!dayRows) return;
    const next = dayRows.map((r) =>
      r.dayOfWeek === dayOfWeek ? { ...r, ...updates } : r
    );
    setRows(next);
  }

  async function handleSave() {
    if (!dayRows) return;
    setSaving(true);

    const filtered = dayRows
      .filter((r) => r.enabled)
      .map(({ dayOfWeek, startTime, endTime }) => ({
        dayOfWeek,
        startTime,
        endTime,
      }));

    const res = await apiClient.put("/working-hours", { hours: filtered });
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Working hours saved");
      mutate();
      setRows(null);
    }
    setSaving(false);
  }

  if (isLoading || !dayRows) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Working Hours
          </CardTitle>
          <CardDescription>
            Set the hours your business is open each day
          </CardDescription>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dayRows.map((row) => (
            <div
              key={row.dayOfWeek}
              className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5"
            >
              <button
                type="button"
                onClick={() =>
                  updateRow(row.dayOfWeek, { enabled: !row.enabled })
                }
                className={`w-12 shrink-0 text-sm font-medium rounded-md px-2 py-1 transition-colors ${
                  row.enabled
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {DAY_SHORT[row.dayOfWeek]}
              </button>

              <span className="w-24 text-sm text-foreground hidden sm:block">
                {DAYS[row.dayOfWeek]}
              </span>

              {row.enabled ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={row.startTime}
                    onChange={(e) =>
                      updateRow(row.dayOfWeek, { startTime: e.target.value })
                    }
                    className="w-28"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input
                    type="time"
                    value={row.endTime}
                    onChange={(e) =>
                      updateRow(row.dayOfWeek, { endTime: e.target.value })
                    }
                    className="w-28"
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground italic">
                  Closed
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────
// Closures Manager
// ──────────────────────────────────────────────

function ClosuresSection() {
  const {
    data: closures,
    isLoading,
    mutate,
  } = useSWR("/closures", closuresFetcher);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [type, setType] = useState<"BREAK" | "HOLIDAY">("HOLIDAY");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");

  function resetForm() {
    setType("HOLIDAY");
    setDate("");
    setStartTime("");
    setEndTime("");
    setNote("");
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const body: Record<string, unknown> = { type, date };
    if (startTime) body.startTime = startTime;
    if (endTime) body.endTime = endTime;
    if (note) body.note = note;

    const res = await apiClient.post("/closures", body);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Closure added");
      mutate();
      resetForm();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    const res = await apiClient.delete(`/closures/${id}`);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Closure removed");
      mutate();
    }
    setDeleting(null);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5 text-primary" />
            Closures
          </CardTitle>
          <CardDescription>
            Block out holidays, breaks, or any days/times you won't be available
          </CardDescription>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add closure
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 mb-6 pb-6 border-b border-border"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as "BREAK" | "HOLIDAY")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOLIDAY">
                      Holiday (full day)
                    </SelectItem>
                    <SelectItem value="BREAK">
                      Break (time range)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="closure-date">Date</Label>
                <Input
                  id="closure-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              {type === "BREAK" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="closure-start">Start time</Label>
                    <Input
                      id="closure-start"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closure-end">End time</Label>
                    <Input
                      id="closure-end"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="closure-note">Note (optional)</Label>
                <Input
                  id="closure-note"
                  placeholder="e.g. National holiday, Lunch break"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Add closure
              </Button>
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {closures && closures.length === 0 && !showForm ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No closures set. Add holidays or breaks to block booking slots.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {closures?.map((closure) => (
              <div
                key={closure._id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      closure.type === "HOLIDAY"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/10 text-warning-foreground"
                    }`}
                  >
                    {closure.type}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(closure.date + "T00:00:00").toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {closure.startTime && closure.endTime
                        ? `${closure.startTime} - ${closure.endTime}`
                        : "All day"}
                      {closure.note ? ` - ${closure.note}` : ""}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(closure._id)}
                  disabled={deleting === closure._id}
                  className="text-destructive hover:text-destructive"
                >
                  {deleting === closure._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
