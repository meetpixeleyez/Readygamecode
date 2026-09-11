import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCartContext } from "@/lib/cart-session";
import { z } from "zod";

const addSchema = z.object({
  productId: z.string().min(1),
  license: z.enum(["1", "2"]).default("1"), // 1=Personal, 2=Commercial
  reskinSelected: z.boolean().default(false),
  publishSelected: z.boolean().default(false),
  storeOptimizationSelected: z.boolean().default(false),
  isExtended: z.boolean().default(false),
});

export async function GET() {
  try {
    const { userId, sessionId } = await getCartContext();
    const where = userId ? { userId } : { sessionId };

    const items = await db.cart.findMany({
      where,
      include: {
        product: {
          include: { 
            user: true, 
            category: true,
            campaignProducts: {
              include: { campaign: true }
            }
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute totals
    let subtotal = 0;
    let buyerFeeTotal = 0;
    let extendedTotal = 0;
    let addonTotal = 0;

    const enrichedItems = items.map((item) => {
      const addonPrice =
        (item.reskinSelected ? item.product.reskinPrice : 0) +
        (item.publishSelected ? item.product.publishPrice : 0) +
        (item.storeOptimizationSelected ? item.product.storeOptimizationPrice : 0);
      let campaignDiscount = 0;
      if (item.product.campaignProducts) {
        const now = new Date();
        const activeCampaign = item.product.campaignProducts.find(
          cp => cp.campaign.status === 1 && new Date(cp.campaign.startDate) <= now && new Date(cp.campaign.endDate) >= now
        );
        if (activeCampaign) {
          campaignDiscount = (item.price * activeCampaign.discountPercentage) / 100;
        }
      }

      const itemTotal = (item.price - campaignDiscount) + item.buyerFee + item.extendedAmount + addonPrice;

      subtotal += itemTotal;
      buyerFeeTotal += item.buyerFee;
      extendedTotal += item.extendedAmount;
      addonTotal += addonPrice;

      return {
        ...item,
        addonPrice,
        campaignDiscount,
        itemTotal,
      };
    });

    return NextResponse.json({
      items: enrichedItems,
      count: items.length,
      totals: {
        subtotal,
        buyerFee: buyerFeeTotal,
        extended: extendedTotal,
        addon: addonTotal,
        discount: 0, // coupon system
        total: subtotal,
      },
    });
  } catch (error) {
    console.error("GET /api/cart error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { productId, license, reskinSelected, publishSelected, storeOptimizationSelected, isExtended } = parsed.data;
    const { userId, sessionId } = await getCartContext({ setCookieIfMissing: true });

    // Load product + category for price calculation
    const product = await db.product.findUnique({
      where: { id: productId, status: 1 },
      include: { 
        user: true,
        category: true,
        campaignProducts: {
          include: { campaign: true }
        }
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found or not approved" }, { status: 404 });
    }

    // Prevent adding own products (if user is logged in)
    if (userId && product.userId === userId) {
      return NextResponse.json(
        { error: "You cannot purchase your own products" },
        { status: 400 }
      );
    }

    // Check if already in cart
    const existing = await db.cart.findFirst({
      where: {
        productId,
        ...(userId ? { userId } : { sessionId }),
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Item already in cart", redirectUrl: "/cart" },
        { status: 409 }
      );
    }

    // Calculate price based on license type
    const isPersonal = license === "1";
    const price = isPersonal ? product.price : product.priceCl;
    const buyerFee = isPersonal
      ? product.category?.personalBuyerFee || 0
      : product.category?.commercialBuyerFee || 0;
    const extendedAmount = isExtended
      ? product.category?.twelveMonthExtendedFee || 0
      : 0;

    let campaignDiscount = 0;
    if (product.campaignProducts) {
      const now = new Date();
      const activeCampaign = product.campaignProducts.find(
        cp => cp.campaign.status === 1 && new Date(cp.campaign.startDate) <= now && new Date(cp.campaign.endDate) >= now
      );
      if (activeCampaign) {
        campaignDiscount = (price * activeCampaign.discountPercentage) / 100;
      }
    }

    const cart = await db.cart.create({
      data: {
        productId,
        userId,
        sessionId,
        title: product.title,
        categoryId: product.categoryId,
        category: product.category?.name,
        license,
        isExtended: isExtended ? 1 : 0,
        extendedAmount,
        price,
        discount: campaignDiscount,
        buyerFee,
        sellerFee: 0, // calculated at checkout based on author level
        quantity: 1,
        reskinSelected: reskinSelected ? 1 : 0,
        publishSelected: publishSelected ? 1 : 0,
        storeOptimizationSelected: storeOptimizationSelected ? 1 : 0,
      },
    });

    // Get updated cart count
    const where = userId ? { userId } : { sessionId };
    const count = await db.cart.count({ where });

    return NextResponse.json(
      {
        success: true,
        cartItem: {
          ...cart,
          product: {
            id: product.id,
            title: product.title,
            thumbnail: product.thumbnail,
            user: {
              username: product.user?.username || "Ready Game Code",
            },
          },
        },
        cartCount: count,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/cart error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { userId, sessionId } = await getCartContext();
    const where = userId ? { userId } : { sessionId };
    
    await db.cart.deleteMany({ where });
    
    return NextResponse.json({ success: true, message: "Cart cleared" });
  } catch (error) {
    console.error("DELETE /api/cart error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
