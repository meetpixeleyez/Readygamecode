import { db } from "../src/lib/db";

async function main() {
  console.log("🌱 Seeding reviews + comments...");

  // Get products
  const products = await db.product.findMany({ take: 6 });
  const seller = await db.user.findFirst({
    where: { email: "readygamecode@example.com" },
  });

  if (!seller) {
    console.log("Seller not found. Run main seed first.");
    return;
  }

  // Create a few buyer users for reviews
  const reviewers: any[] = [];
  const reviewUsers = [
    { firstname: "John", lastname: "Doe", email: "john.reviewer@test.com", username: "johnd", countryName: "United States", countryCode: "US" },
    { firstname: "Maria", lastname: "Garcia", email: "maria.reviewer@test.com", username: "mariag", countryName: "Spain", countryCode: "ES" },
    { firstname: "Chen", lastname: "Wei", email: "chen.reviewer@test.com", username: "chenw", countryName: "China", countryCode: "CN" },
    { firstname: "Anya", lastname: "Petrova", email: "anya.reviewer@test.com", username: "anyap", countryName: "Russia", countryCode: "RU" },
  ];

  for (const ru of reviewUsers) {
    const existing = await db.user.findUnique({ where: { email: ru.email } });
    if (!existing) {
      const u = await db.user.create({
        data: {
          ...ru,
          password: "$2b$12$placeholderhashforseedusersXXXXXXXXXXXXXXXXXXXXXXX",
          profileComplete: 1,
        },
      });
      reviewers.push(u);
    } else {
      reviewers.push(existing);
    }
  }
  console.log(`✓ ${reviewers.length} reviewer users ready`);

  // Review categories
  const reviewCategories = await db.reviewCategory.findMany();
  if (reviewCategories.length === 0) {
    console.log("Review categories not found. Run main seed first.");
    return;
  }

  // Review phrases (matching Laravel reviews:add-foreign Artisan command style)
  const phrases = [
    "Solid experience — performs as advertised.",
    "Impressed with the quality and attention to detail.",
    "Easy to use and integrates smoothly.",
    "Great value; saved me a lot of time.",
    "Documentation is clear; setup was straightforward.",
    "Supportive author and responsive to questions.",
    "Works well on my stack without issues.",
    "Reliable performance across different environments.",
    "Exactly what I needed for my project.",
    "Sleek, efficient, and well-built.",
  ];

  // Add 2-3 reviews per product
  let reviewsCreated = 0;
  for (const product of products) {
    const numReviews = Math.floor(Math.random() * 2) + 2; // 2-3 reviews
    for (let i = 0; i < numReviews; i++) {
      const reviewer = reviewers[Math.floor(Math.random() * reviewers.length)];
      // Skip if already reviewed
      const existing = await db.review.findFirst({
        where: { userId: reviewer.id, productId: product.id },
      });
      if (existing) continue;

      const rating = Math.random() > 0.3 ? 5 : 4; // 70% 5-star, 30% 4-star
      const phrase = phrases[Math.floor(Math.random() * phrases.length)];
      const description = `${phrase} Reviewed from ${reviewer.countryName}.`;

      await db.review.create({
        data: {
          userId: reviewer.id,
          authorId: product.userId,
          productId: product.id,
          reviewCategoryId: reviewCategories[Math.floor(Math.random() * reviewCategories.length)].id,
          rating,
          review: description,
          isSynthetic: 1, // flag as synthetic (matches Phase 0 Part B MDR-014)
        },
      });
      reviewsCreated++;
    }

    // Update product aggregates
    const productReviews = await db.review.findMany({
      where: { productId: product.id },
      select: { rating: true },
    });
    const total = productReviews.length;
    const avg = total > 0 ? productReviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    await db.product.update({
      where: { id: product.id },
      data: { totalReview: total, avgRating: avg },
    });
  }
  console.log(`✓ ${reviewsCreated} reviews created`);

  // Update seller aggregates
  if (seller) {
    const sellerReviews = await db.review.findMany({
      where: { authorId: seller.id },
      select: { rating: true },
    });
    const total = sellerReviews.length;
    const avg = total > 0 ? sellerReviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    await db.user.update({
      where: { id: seller.id },
      data: { totalReview: total, avgRating: avg },
    });
    console.log(`✓ Seller aggregates updated: ${total} reviews, ${avg.toFixed(1)} avg`);
  }

  // Add a few comments
  const comments = [
    "Does this support Unity 2022 LTS?",
    "Is there AdMob integration included?",
    "Can I reskin the characters easily?",
    "What's the minimum Android version supported?",
    "Great template, thanks for sharing!",
  ];

  let commentsCreated = 0;
  for (const product of products.slice(0, 4)) {
    const numComments = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numComments; i++) {
      const commenter = reviewers[Math.floor(Math.random() * reviewers.length)];
      const text = comments[Math.floor(Math.random() * comments.length)];

      const comment = await db.comment.create({
        data: {
          userId: commenter.id,
          productId: product.id,
          text,
        },
      });

      // 50% chance of a reply from the author
      if (Math.random() > 0.5 && seller) {
        await db.comment.create({
          data: {
            userId: seller.id,
            productId: product.id,
            parentId: comment.id,
            text: "Yes, it does! Check the documentation for details. Feel free to contact support if you have more questions.",
            authorReply: 1,
          },
        });
      }
      commentsCreated++;
    }
  }
  console.log(`✓ ${commentsCreated} comments created (with replies)`);

  console.log("\n✅ Reviews + comments seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
