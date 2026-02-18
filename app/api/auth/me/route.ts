import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { getAuthFromRequest } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const auth = getAuthFromRequest(request);

    const user = await User.findById(auth.userId).select("-passwordHash");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
