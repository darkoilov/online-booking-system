"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CATEGORIES = [
  "Barber Shop",
  "Hair Salon",
  "Beauty Salon",
  "Nail Salon",
  "Spa & Wellness",
  "Dental Clinic",
  "Medical Clinic",
  "Fitness Studio",
  "Consulting",
  "Photography",
  "Tutoring",
  "Other",
];

interface BusinessData {
  _id: string;
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

export default function SettingsPage() {
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    async function load() {
      const res = await apiClient.get<{ business: BusinessData }>(
        "/business/me"
      );
      if (res.data?.business) {
        const b = res.data.business;
        setBusiness(b);
        setName(b.name);
        setSlug(b.slug);
        setCategory(b.category);
        setDescription(b.description || "");
        setPhone(b.phone);
        setEmail(b.email || "");
        setAddress(b.address);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    const res = await apiClient.patch<{ business: BusinessData }>(
      "/business/me",
      {
        name,
        slug,
        category,
        description: description || undefined,
        phone,
        email: email || undefined,
        address,
      }
    );

    if (res.error) {
      toast.error(res.error);
      setIsSaving(false);
      return;
    }

    if (res.data?.business) {
      setBusiness(res.data.business);
    }

    toast.success("Settings saved.");
    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!business) {
    return (
      <p className="text-muted-foreground py-10 text-center">
        No business found. Please complete onboarding first.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Business Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Update your business profile information
        </p>
      </div>

      <form onSubmit={handleSave}>
        <div className="flex flex-col gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Basic information about your business
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Business name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="slug">URL slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground shrink-0">
                    /book/
                  </span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                    pattern="^[a-z0-9-]+$"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
              <CardDescription>How clients can reach you</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Business email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Policies</CardTitle>
              <CardDescription>
                Booking rules and cancellation settings (editable in Sprint 5)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-foreground">Auto-confirm bookings</span>
                <span className="text-sm text-muted-foreground">
                  {business.policies.autoConfirm ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-foreground">
                  Cancel window (hours)
                </span>
                <span className="text-sm text-muted-foreground">
                  {business.policies.cancelWindowHours}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">
                  Min lead time (minutes)
                </span>
                <span className="text-sm text-muted-foreground">
                  {business.policies.minLeadTimeMinutes}
                </span>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isSaving} className="self-start">
            {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
