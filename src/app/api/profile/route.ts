import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

// GET /api/profile — returns full profile for the authenticated user
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        username: true,
        email: true,
        dialCode: true,
        mobile: true,
        countryName: true,
        state: true,
        city: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateSchema = z.object({
  firstname: z.string().min(1).max(40).optional(),
  lastname: z.string().min(1).max(40).optional(),
  username: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional(),
  dialCode: z.string().max(10).optional().nullable(),
  mobile: z.string().max(20).optional().nullable(),
  countryName: z.string().max(255).optional().nullable(),
  state: z.string().max(255).optional().nullable(),
  city: z.string().max(255).optional().nullable(),
});

// PATCH /api/profile — updates user profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check username uniqueness if being changed
    if (parsed.data.username) {
      const existing = await db.user.findFirst({
        where: {
          username: parsed.data.username,
          id: { not: session.sub },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 }
        );
      }
    }

    // Mark profile as complete
    const updated = await db.user.update({
      where: { id: session.sub },
      data: {
        ...parsed.data,
        profileComplete: 1,
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        username: true,
        email: true,
        dialCode: true,
        mobile: true,
        countryName: true,
        state: true,
        city: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("PATCH /api/profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
