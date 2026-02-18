import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { registerSchema } from "@/lib/validations";
import { signToken } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await User.create({
      fullName: data.fullName,
      email: data.email,
      passwordHash,
      role: "OWNER",
    });

    // Generate JWT
    const token = signToken({
      userId: user._id.toString(),
      role: user.role,
      businessId: user.businessId?.toString(),
    });

    return NextResponse.json(
      {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          businessId: user.businessId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
