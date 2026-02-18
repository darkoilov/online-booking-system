import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Business, Service } from "@/lib/models";
import { handleApiError } from "@/lib/api-error";

// GET /api/public/:slug - Public business config (services, policies, contact)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;

    const business = await Business.findOne({ slug, isActive: true }).select(
      "-ownerId -notificationSettings -__v"
    );

    if (!business) {
      return NextResponse.json(
        { error: "Business not found." },
        { status: 404 }
      );
    }

    const services = await Service.find({
      businessId: business._id,
      isActive: true,
    }).select("-businessId -__v");

    return NextResponse.json({
      business: {
        id: business._id,
        name: business.name,
        slug: business.slug,
        category: business.category,
        description: business.description,
        phone: business.phone,
        email: business.email,
        address: business.address,
        timezone: business.timezone,
        policies: business.policies,
      },
      services,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
