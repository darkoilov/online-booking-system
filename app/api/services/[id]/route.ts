import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Service, Business } from "@/lib/models";
import { updateServiceSchema } from "@/lib/validations";
import { getAuthFromRequest, requireRole } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/api-error";

// PATCH /api/services/:id - Update a service
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const auth = getAuthFromRequest(request);
    requireRole(auth, "OWNER");
    const { id } = await params;

    const business = await Business.findOne({ ownerId: auth.userId });
    if (!business) throw new ApiError("Business not found.", 404);

    const body = await request.json();
    const data = updateServiceSchema.parse(body);

    const service = await Service.findOneAndUpdate(
      { _id: id, businessId: business._id },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!service) throw new ApiError("Service not found.", 404);

    return NextResponse.json({ service });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/services/:id - Soft delete (deactivate) a service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const auth = getAuthFromRequest(request);
    requireRole(auth, "OWNER");
    const { id } = await params;

    const business = await Business.findOne({ ownerId: auth.userId });
    if (!business) throw new ApiError("Business not found.", 404);

    const service = await Service.findOneAndUpdate(
      { _id: id, businessId: business._id },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!service) throw new ApiError("Service not found.", 404);

    return NextResponse.json({ message: "Service deactivated.", service });
  } catch (error) {
    return handleApiError(error);
  }
}
