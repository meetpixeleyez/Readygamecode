import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const policies = await db.policy.findMany();
    const policyMap = policies.reduce((acc, p) => {
      acc[p.slug] = p.content;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({ policies: policyMap });
  } catch (error) {
    console.error("GET /api/admin/policies error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { privacy, terms, refund } = await req.json();

    const updates = [
      { slug: "privacy-policy", title: "Privacy Policy", content: privacy || "" },
      { slug: "terms-conditions", title: "Terms & Conditions", content: terms || "" },
      { slug: "refund-policy", title: "Refund Policy", content: refund || "" },
    ];

    await db.$transaction(
      updates.map((u) =>
        db.policy.upsert({
          where: { slug: u.slug },
          update: { content: u.content },
          create: u,
        })
      )
    );

    return NextResponse.json({ success: true, message: "Policies updated successfully" });
  } catch (error) {
    console.error("POST /api/admin/policies error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
