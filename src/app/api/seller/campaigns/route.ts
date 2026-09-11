import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const campaignSchema = z.object({
  name: z.string().min(3),
  discountMin: z.number().min(1).max(99),
  discountMax: z.number().min(1).max(99),
  startDate: z.string(),
  endDate: z.string(),
  productIds: z.array(z.string()).min(1),
  discounts: z.record(z.string(), z.number()), // productId -> discount
});

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.sub },
      select: { isAuthor: true }
    });
    if (!user || user.isAuthor !== 1) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = campaignSchema.parse(body);

    const start = new Date(validatedData.startDate);
    const end = new Date(validatedData.endDate);

    if (start >= end) {
      return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 });
    }

    // Verify ownership of products
    const products = await db.product.findMany({
      where: {
        id: { in: validatedData.productIds },
        userId: session.sub,
        status: 1, // only approved products
      }
    });

    if (products.length !== validatedData.productIds.length) {
      return NextResponse.json({ error: "Invalid products selected" }, { status: 400 });
    }

    // Create Campaign and CampaignProducts in a transaction
    const campaign = await db.$transaction(async (tx) => {
      const camp = await tx.campaign.create({
        data: {
          name: validatedData.name,
          discountMin: validatedData.discountMin,
          discountMax: validatedData.discountMax,
          startDate: start,
          endDate: end,
          status: 1, // 1 = active
        }
      });

      const campaignProducts = validatedData.productIds.map(pid => ({
        campaignId: camp.id,
        productId: pid,
        userId: session.sub,
        discountPercentage: validatedData.discounts[pid] || validatedData.discountMin,
        status: 1, // automatically approved if they are the author
      }));

      await tx.campaignProduct.createMany({
        data: campaignProducts
      });

      return camp;
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    console.error("Create campaign error:", error);
    return NextResponse.json({ error: error.message || "Failed to create campaign" }, { status: 500 });
  }
}
