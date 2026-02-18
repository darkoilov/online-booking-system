import { z } from "zod";

// ──────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────

export const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ──────────────────────────────────────────────
// Business
// ──────────────────────────────────────────────

export const createBusinessSchema = z.object({
  name: z.string().min(2, "Business name is required"),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  phone: z.string().min(6, "Phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(3, "Address is required"),
  timezone: z.string().default("Europe/Skopje"),
});

export const updateBusinessSchema = createBusinessSchema.partial();

// ──────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────

export const createServiceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  durationMinutes: z.number().int().min(5, "Duration must be at least 5 minutes"),
  price: z.number().min(0).optional(),
  bufferMinutes: z.number().int().min(0).default(0),
});

export const updateServiceSchema = createServiceSchema.partial();

// ──────────────────────────────────────────────
// Working Hours
// ──────────────────────────────────────────────

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const workingHoursEntrySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, "Use HH:mm format"),
  endTime: z.string().regex(timeRegex, "Use HH:mm format"),
});

export const replaceWorkingHoursSchema = z.object({
  hours: z.array(workingHoursEntrySchema),
});

// ──────────────────────────────────────────────
// Closures
// ──────────────────────────────────────────────

export const createClosureSchema = z.object({
  type: z.enum(["BREAK", "HOLIDAY"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  startTime: z.string().regex(timeRegex).optional(),
  endTime: z.string().regex(timeRegex).optional(),
  note: z.string().optional(),
});

// ──────────────────────────────────────────────
// Booking (Public guest booking)
// ──────────────────────────────────────────────

export const createBookingSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  startTime: z.string().regex(timeRegex, "Use HH:mm format"),
  customer: z.object({
    fullName: z.string().min(2, "Name is required"),
    phone: z.string().min(6, "Phone number is required"),
    email: z.string().email().optional().or(z.literal("")),
  }),
  note: z.string().optional(),
});

// ──────────────────────────────────────────────
// Manual Booking (Business-side)
// ──────────────────────────────────────────────

export const manualBookingSchema = z.object({
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(timeRegex),
  customer: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(6),
    email: z.string().email().optional().or(z.literal("")),
  }),
  note: z.string().optional(),
});

// ──────────────────────────────────────────────
// Booking Status Update
// ──────────────────────────────────────────────

export const updateBookingStatusSchema = z.object({
  status: z.enum([
    "CONFIRMED",
    "CANCELLED_BY_CLIENT",
    "CANCELLED_BY_BUSINESS",
    "COMPLETED",
    "NO_SHOW",
  ]),
});

// ──────────────────────────────────────────────
// Policies
// ──────────────────────────────────────────────

export const updatePoliciesSchema = z.object({
  autoConfirm: z.boolean().optional(),
  cancelWindowHours: z.number().int().min(0).optional(),
  minLeadTimeMinutes: z.number().int().min(0).optional(),
});

// ──────────────────────────────────────────────
// Type exports for frontend
// ──────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ReplaceWorkingHoursInput = z.infer<typeof replaceWorkingHoursSchema>;
export type CreateClosureInput = z.infer<typeof createClosureSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ManualBookingInput = z.infer<typeof manualBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type UpdatePoliciesInput = z.infer<typeof updatePoliciesSchema>;
