import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCartContext } from "@/lib/cart-session";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// DELETE /api/cart/[id] — remove item from cart
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const { userId, sessionId } = await getCartContext();

    // Find item, ensure it belongs to this user/session
    const item = await db.cart.findFirst({
      where: { id, ...(userId ? { userId } : { sessionId }) },
    });

    if (!item) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
    }

    await db.cart.delete({ where: { id } });

    const where = userId ? { userId } : { sessionId };
    const count = await db.cart.count({ where });

    return NextResponse.json({ success: true, cartCount: count });
  } catch (error) {
    console.error("DELETE /api/cart/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateSchema = z.object({
  action: z.enum(["toggle_license", "toggle_extended", "toggle_service"]),
  // For toggle_license: "1" or "2"
  license: z.enum(["1", "2"]).optional(),
  // For toggle_service: which service to toggle
  service: z.enum(["reskin", "publish", "store_optimization"]).optional(),
  // For toggle_service: new state
  selected: z.boolean().optional(),
});

// PATCH /api/cart/[id] — update license, toggle extended, or toggle addon service
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { userId, sessionId } = await getCartContext();

    // Find item with product + category
    const item = await db.cart.findFirst({
      where: { id, ...(userId ? { userId } : { sessionId }) },
      include: { product: { include: { category: true } } },
    });

    if (!item) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
    }

    const { action, license, service, selected } = parsed.data;
    const category = item.product?.category;
    const updateData: any = {};

    if (action === "toggle_license" && license) {
      const isPersonal = license === "1";
      updateData.license = license;
      updateData.price = isPersonal ? item.product!.price : item.product!.priceCl;
      updateData.buyerFee = isPersonal
        ? category?.personalBuyerFee || 0
        : category?.commercialBuyerFee || 0;
    } else if (action === "toggle_extended") {
      const newExtended = item.isExtended === 1 ? 0 : 1;
      updateData.isExtended = newExtended;
      updateData.extendedAmount = newExtended === 1
        ? category?.twelveMonthExtendedFee || 0
        : 0;
    } else if (action === "toggle_service" && service) {
      const flag = selected ? 1 : 0;
      if (service === "reskin") updateData.reskinSelected = flag;
      if (service === "publish") updateData.publishSelected = flag;
      if (service === "store_optimization") updateData.storeOptimizationSelected = flag;
    }

    const updated = await db.cart.update({
      where: { id },
      data: updateData,
      include: { product: { include: { category: true } } },
    });

    // Compute new totals for this item
    const addonPrice =
      (updated.reskinSelected ? updated.product.reskinPrice : 0) +
      (updated.publishSelected ? updated.product.publishPrice : 0) +
      (updated.storeOptimizationSelected ? updated.product.storeOptimizationPrice : 0);
    const itemTotal = updated.price + updated.buyerFee + updated.extendedAmount + addonPrice;

    // Compute cart totals
    const where = userId ? { userId } : { sessionId };
    const allItems = await db.cart.findMany({
      where,
      include: { product: true },
    });
    const subtotal = allItems.reduce((sum, i) => {
      const addon =
        (i.reskinSelected ? i.product.reskinPrice : 0) +
        (i.publishSelected ? i.product.publishPrice : 0) +
        (i.storeOptimizationSelected ? i.product.storeOptimizationPrice : 0);
      return sum + i.price + i.buyerFee + i.extendedAmount + addon;
    }, 0);

    return NextResponse.json({
      success: true,
      item: {
        ...updated,
        addonPrice,
        itemTotal,
      },
      totals: {
        subtotal,
        total: subtotal,
      },
    });
  } catch (error) {
    console.error("PATCH /api/cart/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
