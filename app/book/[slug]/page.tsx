"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Phone,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ── Types ──

interface ServiceData {
  _id: string;
  name: string;
  durationMinutes: number;
  price?: number;
  bufferMinutes: number;
}

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string;
  phone: string;
  email?: string;
  address: string;
  timezone: string;
  policies: {
    autoConfirm: boolean;
    cancelWindowHours: number;
    minLeadTimeMinutes: number;
  };
}

interface AvailableSlot {
  startTime: string;
  endTime: string;
}

interface BookingResult {
  booking: {
    id: string;
    status: string;
    startAt: string;
    endAt: string;
    service: { name: string; durationMinutes: number };
    customer: { fullName: string; phone: string; email?: string };
  };
  message: string;
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

// ── Helpers ──

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getNext14Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// ── Steps ──

type Step = "service" | "datetime" | "details" | "success";

// ── Page ──

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, error, isLoading } = useSWR(
    slug ? `/api/public/${slug}` : null,
    (url: string) => fetchJSON<{ business: BusinessData; services: ServiceData[] }>(url)
  );

  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<ServiceData | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(
    null
  );

  // Customer form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Business not found
            </h2>
            <p className="text-sm text-muted-foreground">
              The booking page you are looking for does not exist or is
              inactive.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { business, services } = data;

  function handleSelectService(service: ServiceData) {
    setSelectedService(service);
    setSelectedSlot(null);
    setStep("datetime");
  }

  function handleSelectSlot(slot: AvailableSlot) {
    setSelectedSlot(slot);
    setStep("details");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedSlot) return;

    setSubmitting(true);

    try {
      const res = await fetch(`/api/public/${slug}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService._id,
          date: selectedDate,
          startTime: selectedSlot.startTime,
          customer: { fullName, phone, email: email || undefined },
          note: note || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Booking failed");
        setSubmitting(false);
        return;
      }

      setBookingResult(result);
      setStep("success");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }

    setSubmitting(false);
  }

  function resetBooking() {
    setStep("service");
    setSelectedService(null);
    setSelectedDate("");
    setSelectedSlot(null);
    setBookingResult(null);
    setFullName("");
    setPhone("");
    setEmail("");
    setNote("");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {business.name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{business.category}</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {business.address}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6">
        <div className="flex items-center gap-2 mb-6">
          {(["service", "datetime", "details"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step === s || step === "success" || i < ["service", "datetime", "details"].indexOf(step)
                    ? "bg-primary"
                    : "bg-border"
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 pb-12 sm:px-6">
        {step === "service" && (
          <ServicePicker
            services={services}
            onSelect={handleSelectService}
          />
        )}

        {step === "datetime" && selectedService && (
          <DateTimePicker
            slug={slug}
            service={selectedService}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedSlot={selectedSlot}
            onSelectSlot={handleSelectSlot}
            onBack={() => setStep("service")}
          />
        )}

        {step === "details" && selectedService && selectedSlot && (
          <BookingForm
            service={selectedService}
            date={selectedDate}
            slot={selectedSlot}
            fullName={fullName}
            setFullName={setFullName}
            phone={phone}
            setPhone={setPhone}
            email={email}
            setEmail={setEmail}
            note={note}
            setNote={setNote}
            submitting={submitting}
            onSubmit={handleSubmit}
            onBack={() => setStep("datetime")}
            autoConfirm={business.policies.autoConfirm}
          />
        )}

        {step === "success" && bookingResult && (
          <SuccessScreen
            result={bookingResult}
            business={business}
            onNewBooking={resetBooking}
          />
        )}
      </main>
    </div>
  );
}

// ──────────────────────────────────────────────
// Step 1: Service Picker
// ──────────────────────────────────────────────

function ServicePicker({
  services,
  onSelect,
}: {
  services: ServiceData[];
  onSelect: (s: ServiceData) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Choose a service
        </h2>
        <p className="text-sm text-muted-foreground">
          Select the service you would like to book
        </p>
      </div>

      <div className="grid gap-3">
        {services.map((service) => (
          <Card
            key={service._id}
            className="cursor-pointer transition-colors hover:border-primary/50"
            onClick={() => onSelect(service)}
          >
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-foreground">{service.name}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {service.durationMinutes} min
                  </span>
                  {service.price != null && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      {service.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              No services available at this time.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Step 2: Date + Time Slot Picker
// ──────────────────────────────────────────────

function DateTimePicker({
  slug,
  service,
  selectedDate,
  setSelectedDate,
  selectedSlot,
  onSelectSlot,
  onBack,
}: {
  slug: string;
  service: ServiceData;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  selectedSlot: AvailableSlot | null;
  onSelectSlot: (s: AvailableSlot) => void;
  onBack: () => void;
}) {
  const days = getNext14Days();
  const [scrollOffset, setScrollOffset] = useState(0);

  const handleSelectDate = useCallback(
    (dateStr: string) => {
      setSelectedDate(dateStr);
    },
    [setSelectedDate]
  );

  // Auto-select today
  useEffect(() => {
    if (!selectedDate && days.length > 0) {
      handleSelectDate(getDateStr(days[0]));
    }
  }, [selectedDate, days, handleSelectDate]);

  // Fetch slots when date is selected
  const { data: slotsData, isLoading: loadingSlots } = useSWR(
    selectedDate
      ? `/api/public/${slug}/availability?date=${selectedDate}&serviceId=${service._id}`
      : null,
    (url: string) => fetchJSON<{ slots: AvailableSlot[] }>(url)
  );

  const visibleDays = days.slice(scrollOffset, scrollOffset + 7);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Pick a date & time
          </h2>
          <p className="text-sm text-muted-foreground">
            {service.name} - {service.durationMinutes} min
          </p>
        </div>
      </div>

      {/* Date scroller */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={scrollOffset === 0}
          onClick={() => setScrollOffset(Math.max(0, scrollOffset - 7))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex gap-2 flex-1 justify-center">
          {visibleDays.map((day) => {
            const dateStr = getDateStr(day);
            const isSelected = dateStr === selectedDate;
            return (
              <button
                key={dateStr}
                onClick={() => handleSelectDate(dateStr)}
                className={`flex flex-col items-center px-3 py-2 rounded-lg text-sm transition-colors min-w-[52px] ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground hover:border-primary/40"
                }`}
              >
                <span className="text-xs opacity-80">
                  {DAY_SHORT[day.getDay()]}
                </span>
                <span className="text-lg font-semibold">{day.getDate()}</span>
                <span className="text-xs opacity-80">
                  {MONTH_SHORT[day.getMonth()]}
                </span>
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={scrollOffset + 7 >= days.length}
          onClick={() =>
            setScrollOffset(Math.min(days.length - 7, scrollOffset + 7))
          }
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Time slots */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">
          Available times for {selectedDate ? formatDate(selectedDate) : "..."}
        </h3>

        {loadingSlots ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : slotsData?.slots && slotsData.slots.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slotsData.slots.map((slot) => {
              const isSelected =
                selectedSlot?.startTime === slot.startTime;
              return (
                <button
                  key={slot.startTime}
                  onClick={() => onSelectSlot(slot)}
                  className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-foreground hover:border-primary/40"
                  }`}
                >
                  {slot.startTime}
                </button>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No available slots for this date. Try another day.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Step 3: Booking Form
// ──────────────────────────────────────────────

function BookingForm({
  service,
  date,
  slot,
  fullName,
  setFullName,
  phone,
  setPhone,
  email,
  setEmail,
  note,
  setNote,
  submitting,
  onSubmit,
  onBack,
  autoConfirm,
}: {
  service: ServiceData;
  date: string;
  slot: AvailableSlot;
  fullName: string;
  setFullName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  autoConfirm: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Your details
          </h2>
          <p className="text-sm text-muted-foreground">
            Almost done! Fill in your contact info.
          </p>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{service.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(date)} at {slot.startTime}
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{service.durationMinutes} min</p>
              {service.price != null && <p>${service.price.toFixed(2)}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name *</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+389 7X XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Textarea
            id="note"
            placeholder="Any special requests or notes..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
        </div>

        {!autoConfirm && (
          <p className="text-sm text-muted-foreground bg-secondary/50 rounded-md px-3 py-2">
            Note: This business reviews bookings before confirming. You will
            receive confirmation once approved.
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {autoConfirm ? "Confirm booking" : "Request booking"}
        </Button>
      </form>
    </div>
  );
}

// ──────────────────────────────────────────────
// Step 4: Success Screen
// ──────────────────────────────────────────────

function SuccessScreen({
  result,
  business,
  onNewBooking,
}: {
  result: BookingResult;
  business: BusinessData;
  onNewBooking: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="text-center py-12">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {result.message}
          </h2>
          <p className="text-muted-foreground mb-6">
            Your booking reference: {result.booking.id.slice(-8).toUpperCase()}
          </p>

          <Card className="text-left max-w-sm mx-auto">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="text-foreground font-medium">
                  {result.booking.service.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="text-foreground font-medium">
                  {new Date(result.booking.startAt).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    }
                  )}{" "}
                  at{" "}
                  {new Date(result.booking.startAt).toLocaleTimeString(
                    "en-US",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    }
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="text-foreground font-medium">
                  {result.booking.service.durationMinutes} min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={`font-medium ${
                    result.booking.status === "CONFIRMED"
                      ? "text-success"
                      : "text-warning-foreground"
                  }`}
                >
                  {result.booking.status}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 space-y-2">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              Contact: {business.phone}
            </p>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {business.address}
            </p>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={onNewBooking}>
        Book another appointment
      </Button>
    </div>
  );
}
