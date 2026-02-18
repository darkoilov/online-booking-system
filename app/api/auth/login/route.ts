import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { loginSchema } from "@/lib/validations";
import { signToken } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/api-error";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const data = loginSchema.parse(body);

    // Find user
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw new ApiError("Invalid email or password.", 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new ApiError("Invalid email or password.", 401);
    }

    // Generate JWT
    const token = signToken({
      userId: user._id.toString(),
      role: user.role,
      businessId: user.businessId?.toString(),
    });

    return NextResponse.json({
      token,
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
