import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Business } from "@/lib/models";
import { getAuthFromRequest, requireRole } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/api-error";
import { z } from "zod";

const updateNotificationSettingsSchema = z.object({
  emailEnabled: z.boolean().optional(),
  reminders: z
    .object({
      enabled: z.boolean(),
      hoursBefore: z.array(z.number().int().min(1)).max(5),
    })
    .optional(),
});

// PATCH /api/business/me/notifications -- update notification settings
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const auth = getAuthFromRequest(request);
    requireRole(auth, "OWNER");

    const body = await request.json();
    const data = updateNotificationSettingsSchema.parse(body);

    const update: Record<string, unknown> = {};
    if (data.emailEnabled !== undefined) update["notificationSettings.emailEnabled"] = data.emailEnabled;
    if (data.reminders !== undefined) {
      update["notificationSettings.reminders.enabled"] = data.reminders.enabled;
      update["notificationSettings.reminders.hoursBefore"] = data.reminders.hoursBefore;
    }

    const business = await Business.findOneAndUpdate(
      { ownerId: auth.userId },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!business) {
      throw new ApiError("Business not found.", 404);
    }

    return NextResponse.json({ notificationSettings: business.notificationSettings });
  } catch (error) {
    return handleApiError(error);
  }
}
