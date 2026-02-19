"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────

interface ServiceItem {
  _id: string;
  name: string;
  durationMinutes: number;
  price?: number;
  bufferMinutes: number;
}

interface SlotItem {
  startTime: string;
  endTime: string;
}

type Step = "service" | "datetime" | "customer" | "success";

// ─── Helpers ─────────────────────────────────────────

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// ─── Main Page ───────────────────────────────────────

export default function NewBookingPage() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<Step>("service");

  // Data
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Customer form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  // Loading states
  const [servicesLoading, setServicesLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load services on mount
  useEffect(() => {
    async function loadServices() {
      const res = await apiClient.get<{ services: ServiceItem[] }>("/services");
      if (res.data?.services) {
        setServices(res.data.services.filter((s) => s.durationMinutes > 0));
      }
      setServicesLoading(false);
    }
    loadServices();
  }, []);

  // Load availability when service and date change
  useEffect(() => {
    if (!selectedService || !selectedDate) return;

    async function loadSlots() {
      setSlotsLoading(true);
      setSelectedSlot(null);
      const res = await apiClient.get<{ slots: SlotItem[] }>(
        `/bookings/availability?date=${selectedDate}&serviceId=${selectedService!._id}`
      );
      if (res.data?.slots) {
        setSlots(res.data.slots);
      } else {
        setSlots([]);
      }
      setSlotsLoading(false);
    }
    loadSlots();
  }, [selectedService, selectedDate]);

  async function handleSubmit() {
    if (!selectedService || !selectedSlot) return;

    setIsSubmitting(true);
    setError(null);

    const res = await apiClient.post("/bookings/manual", {
      serviceId: selectedService._id,
      date: selectedDate,
      startTime: selectedSlot,
      customer: {
        fullName,
        phone,
        email: email || undefined,
      },
      note: note || undefined,
    });

    if (res.error) {
      setError(res.error);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setStep("success");
  }

  // ─── Render by step ──────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/calendar">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">New Booking</h1>
          <p className="text-sm text-muted-foreground">
            Add a manual booking for a walk-in or phone customer
          </p>
        </div>
      </div>

      {/* Step indicator */}
      {step !== "success" && (
        <div className="flex items-center gap-2 mb-6">
          {(["service", "datetime", "customer"] as const).map((s, i) => {
            const stepLabels = ["Service", "Date & Time", "Customer"];
            const isCurrent = s === step;
            const isDone =
              (s === "service" && (step === "datetime" || step === "customer")) ||
              (s === "datetime" && step === "customer");

            return (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && (
                  <div className={`w-8 h-px ${isDone || isCurrent ? "bg-primary" : "bg-border"}`} />
                )}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isDone
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {isDone && <CheckCircle className="h-3 w-3" />}
                  {stepLabels[i]}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Step: Service selection */}
      {step === "service" && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Select a Service
          </h2>

          {servicesLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No services found</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/dashboard/services">Add Services</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {services.map((service) => (
                <button
                  key={service._id}
                  onClick={() => {
                    setSelectedService(service);
                    setStep("datetime");
                  }}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-secondary/50 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {service.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {service.durationMinutes} min
                      {service.bufferMinutes > 0 && ` + ${service.bufferMinutes} min buffer`}
                    </p>
                  </div>
                  {service.price != null && (
                    <span className="text-sm font-semibold text-foreground">
                      {service.price} MKD
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step: Date & Time selection */}
      {step === "datetime" && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-1">
            Pick Date & Time
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {selectedService?.name} -- {selectedService?.durationMinutes} min
          </p>

          {/* Date picker */}
          <div className="mb-4">
            <Label htmlFor="booking-date" className="mb-1.5 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Date
            </Label>
            <Input
              id="booking-date"
              type="date"
              value={selectedDate}
              min={getTodayStr()}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {/* Time slots */}
          <div>
            <Label className="mb-1.5 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Available Slots
            </Label>

            {slotsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No available slots on this date. Try a different date.
              </p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                {slots.map((slot) => (
                  <button
                    key={slot.startTime}
                    onClick={() => setSelectedSlot(slot.startTime)}
                    className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                      selectedSlot === slot.startTime
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    {slot.startTime}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setStep("service")}>
              Back
            </Button>
            <Button
              onClick={() => setStep("customer")}
              disabled={!selectedSlot}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step: Customer info */}
      {step === "customer" && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-1">
            Customer Info
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {selectedService?.name} on{" "}
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}{" "}
            at {selectedSlot}
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="cust-name" className="mb-1.5 flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                Full Name *
              </Label>
              <Input
                id="cust-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label htmlFor="cust-phone" className="mb-1.5 flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Phone *
              </Label>
              <Input
                id="cust-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+389 7X XXX XXX"
              />
            </div>

            <div>
              <Label htmlFor="cust-email" className="mb-1.5 flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email (optional)
              </Label>
              <Input
                id="cust-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@email.com"
              />
            </div>

            <div>
              <Label htmlFor="cust-note" className="mb-1.5 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Note (optional)
              </Label>
              <Textarea
                id="cust-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any special requests..."
                rows={3}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2 mt-4">
              {error}
            </p>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setStep("datetime")}>
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!fullName || !phone || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Booking"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step: Success */}
      {step === "success" && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success/15 mx-auto mb-4">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <h2 className="text-lg font-semibold text-card-foreground mb-1">
            Booking Created
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {selectedService?.name} for {fullName} on{" "}
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}{" "}
            at {selectedSlot}. Status: Confirmed.
          </p>

          <div className="flex justify-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard/calendar">View Calendar</Link>
            </Button>
            <Button
              onClick={() => {
                setStep("service");
                setSelectedService(null);
                setSelectedSlot(null);
                setFullName("");
                setPhone("");
                setEmail("");
                setNote("");
                setError(null);
              }}
            >
              Add Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
