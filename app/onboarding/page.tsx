"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calendar, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugEdited) {
      setSlug(generateSlug(name));
    }
  }, [name, slugEdited]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const res = await apiClient.post("/business", {
      name,
      slug,
      category,
      description: description || undefined,
      phone,
      email: email || undefined,
      address,
      timezone: "Europe/Skopje",
    });

    if (res.error) {
      toast.error(res.error);
      setIsLoading(false);
      return;
    }

    toast.success("Business created! Welcome to your dashboard.");
    router.push("/dashboard");
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <Calendar className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">BookIt</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Set up your business</CardTitle>
            <CardDescription>
              Fill in the details below to create your booking page
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="flex flex-col gap-4">
              {/* Business Name */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Business name</Label>
                <Input
                  id="name"
                  placeholder="My Barber Shop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Slug */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="slug">Booking URL slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground shrink-0">
                    /book/
                  </span>
                  <Input
                    id="slug"
                    placeholder="my-barber-shop"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugEdited(true);
                    }}
                    required
                    pattern="^[a-z0-9-]+$"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, numbers, and dashes only
                </p>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
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

              {/* Description */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">
                  Description{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Tell clients about your business..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+389 7X XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="businessEmail">
                  Business email{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="businessEmail"
                  type="email"
                  placeholder="info@mybusiness.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Address */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="ul. Makedonija 1, Skopje"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={isLoading || !category}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <ArrowRight />
                )}
                {isLoading ? "Creating..." : "Create business"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
