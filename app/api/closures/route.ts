import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Closure, Business } from "@/lib/models";
import { createClosureSchema } from "@/lib/validations";
import { getAuthFromRequest, requireRole } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/api-error";

// POST /api/closures - Create a closure (break or holiday)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const auth = getAuthFromRequest(request);
    requireRole(auth, "OWNER");

    const business = await Business.findOne({ ownerId: auth.userId });
    if (!business) throw new ApiError("Business not found.", 404);

    const body = await request.json();
    const data = createClosureSchema.parse(body);

    const closure = await Closure.create({
      ...data,
      businessId: business._id,
    });

    return NextResponse.json({ closure }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/closures?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const auth = getAuthFromRequest(request);
    requireRole(auth, "OWNER", "STAFF");

    const business = await Business.findOne({ ownerId: auth.userId });
    if (!business) throw new ApiError("Business not found.", 404);

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const query: Record<string, unknown> = {
      businessId: business._id,
    };

    if (from || to) {
      query.date = {};
      if (from) (query.date as Record<string, string>).$gte = from;
      if (to) (query.date as Record<string, string>).$lte = to;
    }

    const closures = await Closure.find(query).sort({ date: 1 });

    return NextResponse.json({ closures });
  } catch (error) {
    return handleApiError(error);
  }
}
