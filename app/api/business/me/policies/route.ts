import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Business } from "@/lib/models";
import { updatePoliciesSchema } from "@/lib/validations";
import { getAuthFromRequest, requireRole } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/api-error";

// PATCH /api/business/me/policies -- update booking policies
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const auth = getAuthFromRequest(request);
    requireRole(auth, "OWNER");

    const body = await request.json();
    const data = updatePoliciesSchema.parse(body);

    const update: Record<string, unknown> = {};
    if (data.autoConfirm !== undefined) update["policies.autoConfirm"] = data.autoConfirm;
    if (data.cancelWindowHours !== undefined) update["policies.cancelWindowHours"] = data.cancelWindowHours;
    if (data.minLeadTimeMinutes !== undefined) update["policies.minLeadTimeMinutes"] = data.minLeadTimeMinutes;

    const business = await Business.findOneAndUpdate(
      { ownerId: auth.userId },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!business) {
      throw new ApiError("Business not found.", 404);
    }

    return NextResponse.json({ policies: business.policies });
  } catch (error) {
    return handleApiError(error);
  }
}
