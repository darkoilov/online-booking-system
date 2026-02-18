import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Business } from "@/lib/models";
import { getAvailableSlots } from "@/lib/availability";
import { handleApiError } from "@/lib/api-error";

// GET /api/public/:slug/availability?date=YYYY-MM-DD&serviceId=...
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const serviceId = searchParams.get("serviceId");

    if (!date || !serviceId) {
      return NextResponse.json(
        { error: "date and serviceId query params are required." },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "date must be in YYYY-MM-DD format." },
        { status: 400 }
      );
    }

    const business = await Business.findOne({ slug, isActive: true });
    if (!business) {
      return NextResponse.json(
        { error: "Business not found." },
        { status: 404 }
      );
    }

    const slots = await getAvailableSlots(
      String(business._id),
      date,
      serviceId
    );

    return NextResponse.json({ date, slots });
  } catch (error) {
    return handleApiError(error);
  }
}
