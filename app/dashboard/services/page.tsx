"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Plus,
  Pencil,
  Trash2,
  Clock,
  DollarSign,
  Loader2,
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

interface Service {
  _id: string;
  name: string;
  durationMinutes: number;
  price?: number;
  bufferMinutes: number;
  isActive: boolean;
}

const fetcher = async (url: string) => {
  const res = await apiClient.get<{ services: Service[] }>(url);
  if (res.error) throw new Error(res.error);
  return res.data!.services;
};

export default function ServicesPage() {
  const {
    data: services,
    error,
    isLoading,
    mutate,
  } = useSWR("/services", fetcher);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [price, setPrice] = useState("");
  const [bufferMinutes, setBufferMinutes] = useState(0);

  function resetForm() {
    setName("");
    setDurationMinutes(30);
    setPrice("");
    setBufferMinutes(0);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(service: Service) {
    setName(service.name);
    setDurationMinutes(service.durationMinutes);
    setPrice(service.price != null ? String(service.price) : "");
    setBufferMinutes(service.bufferMinutes);
    setEditingId(service._id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const body = {
      name,
      durationMinutes,
      price: price ? Number(price) : undefined,
      bufferMinutes,
    };

    if (editingId) {
      const res = await apiClient.patch(`/services/${editingId}`, body);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Service updated");
        mutate();
        resetForm();
      }
    } else {
      const res = await apiClient.post("/services", body);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Service created");
        mutate();
        resetForm();
      }
    }

    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    const res = await apiClient.delete(`/services/${id}`);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Service deleted");
      mutate();
    }
    setDeleting(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-destructive">
        Failed to load services. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground">
            Manage the services your business offers
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Add service
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Edit service" : "New service"}
            </CardTitle>
            <CardDescription>
              {editingId
                ? "Update this service's details"
                : "Add a new service that clients can book"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Service name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Haircut, Manicure"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={5}
                    step={5}
                    value={durationMinutes}
                    onChange={(e) =>
                      setDurationMinutes(Number(e.target.value))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (optional)</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buffer">Buffer time (minutes)</Label>
                  <Input
                    id="buffer"
                    type="number"
                    min={0}
                    step={5}
                    value={bufferMinutes}
                    onChange={(e) =>
                      setBufferMinutes(Number(e.target.value))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Break time between appointments
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "Update" : "Create"} service
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {services && services.length === 0 && !showForm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-secondary p-4 mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">
              No services yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first service so clients can start booking
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              Add your first service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {services?.map((service) => (
            <Card key={service._id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      service.isActive ? "bg-success" : "bg-muted-foreground"
                    }`}
                  />
                  <div>
                    <p className="font-medium text-foreground">
                      {service.name}
                    </p>
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
                      {service.bufferMinutes > 0 && (
                        <span>+{service.bufferMinutes} min buffer</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(service)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(service._id)}
                    disabled={deleting === service._id}
                    className="text-destructive hover:text-destructive"
                  >
                    {deleting === service._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
