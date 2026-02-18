import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Closure, Business } from "@/lib/models";
import { getAuthFromRequest, requireRole } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/api-error";

// DELETE /api/closures/:id
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

    const closure = await Closure.findOneAndDelete({
      _id: id,
      businessId: business._id,
    });

    if (!closure) throw new ApiError("Closure not found.", 404);

    return NextResponse.json({ message: "Closure deleted." });
  } catch (error) {
    return handleApiError(error);
  }
}
