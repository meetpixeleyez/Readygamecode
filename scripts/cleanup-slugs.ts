import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function cleanSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("Checking and cleaning product slugs...");
  const products = await prisma.product.findMany({
    select: { id: true, title: true, slug: true },
  });

  let updatedCount = 0;
  for (const p of products) {
    if (!p.slug) continue;
    let targetSlug = cleanSlug(p.slug);
    if (!targetSlug) {
      targetSlug = cleanSlug(p.title) || `product-${p.id}`;
    }

    if (p.slug !== targetSlug) {
      // Check if targetSlug already exists on another product
      const existing = await prisma.product.findFirst({
        where: { slug: targetSlug, id: { not: p.id } },
      });

      if (!existing) {
        await prisma.product.update({
          where: { id: p.id },
          data: { slug: targetSlug },
        });
        console.log(`Updated slug for "${p.title}": "${p.slug}" -> "${targetSlug}"`);
        updatedCount++;
      } else {
        const altSlug = `${targetSlug}-${p.id.slice(0, 6)}`;
        await prisma.product.update({
          where: { id: p.id },
          data: { slug: altSlug },
        });
        console.log(`Updated slug with unique suffix for "${p.title}": "${p.slug}" -> "${altSlug}"`);
        updatedCount++;
      }
    }
  }

  console.log(`Finished slug cleanup. ${updatedCount} products updated.`);
}

main()
  .catch((e) => {
    console.error("Error during slug cleanup:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
