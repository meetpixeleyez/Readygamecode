import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding Ready Game Code database...");


  // 2. Categories
  const gameCategory = await db.category.upsert({
    where: { name: "Game" },
    update: {},
    create: {
      name: "Game",
      image: "6835a94879b151748347208.png",
      fileType: "script",
      fileSize: 100,
      previewFileTypes: '["png","jpg","jpeg","mp4"]',
      personalBuyerFee: 1.0,
      commercialBuyerFee: 1.0,
      twelveMonthExtendedFee: 60.0,
      topMenu: 0,
      featured: 1,
      status: 1,
      seoContent: JSON.stringify({
        description: "Buy high-quality Unity, Android, and iOS game source codes at affordable prices.",
        socialTitle: "Buy Unity Source Code | Ready Game Code",
        keywords: ["digital product", "buy unity game source code", "unity 3d template", "android game code"],
      }),
    },
  });

  const servicesCategory = await db.category.upsert({
    where: { name: "Services" },
    update: {},
    create: {
      name: "Services",
      image: "6836a5005108e1748411648.png",
      fileType: "script",
      fileSize: 100,
      personalBuyerFee: 1.0,
      commercialBuyerFee: 1.0,
      twelveMonthExtendedFee: 10000.0,
      featured: 1,
      status: 1,
    },
  });
  console.log("✓ Categories seeded");

  // 3. Sub-categories (game genres)
  const subCategories = [
    { name: "Multiplayer", categoryId: gameCategory.id, formId: null },
    { name: "Racing", categoryId: gameCategory.id, formId: null },
    { name: "Match Tile", categoryId: gameCategory.id, formId: null },
    { name: "Puzzle", categoryId: gameCategory.id, formId: null },
    { name: "Platformer", categoryId: gameCategory.id, formId: null },
    { name: "Casual", categoryId: gameCategory.id, formId: null },
    { name: "Cards", categoryId: gameCategory.id, formId: null },
    { name: "Action", categoryId: gameCategory.id, formId: null },
    { name: "Technical Support", categoryId: servicesCategory.id, formId: null },
  ];
  const subCatRecords: any[] = [];
  for (const sub of subCategories) {
    const rec = await db.subCategory.upsert({
      where: { name_categoryId: { name: sub.name, categoryId: sub.categoryId } },
      update: {},
      create: sub,
    });
    subCatRecords.push(rec);
  }
  console.log(`✓ ${subCatRecords.length} sub-categories seeded`);

  // 4. Admin + Reviewer + Seller
  const adminPassword = await bcrypt.hash("admin123", 10);
  await db.user.upsert({
    where: { email: "admin@readygamecode.com" },
    update: { role: "ADMIN" },
    create: {
      firstname: "Super",
      lastname: "Admin",
      email: "admin@readygamecode.com",
      username: "admin",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const reviewerPassword = await bcrypt.hash("reviewer123", 10);
  await db.user.upsert({
    where: { email: "pranav@readygamecode.com" },
    update: {},
    create: {
      firstname: "Pranav",
      lastname: "Reviewer",
      email: "pranav@readygamecode.com",
      username: "pranav",
      password: reviewerPassword,
      role: "ADMIN",
      status: 1,
    },
  });

  const sellerPassword = await bcrypt.hash("seller123", 10);
  const seller = await db.user.upsert({
    where: { email: "readygamecode@example.com" },
    update: {},
    create: {
      email: "readygamecode@example.com",
      firstname: "Ready",
      lastname: "Game Code",
      username: "readygamecode",
      password: sellerPassword,
      balance: 1926.0,
      totalSold: 50,
      totalSoldAmount: 1926.0,
      status: 1,
      profileComplete: 1,
      isAuthor: 1,
    },
  });
  console.log("✓ Admin, reviewer, seller seeded");

  // 5. Author level
  const authorLevel = await db.authorLevel.upsert({
    where: { name: "Beginner" },
    update: {},
    create: {
      name: "Beginner",
      minimumEarning: 0,
      fee: 30, // 30% seller fee
      status: 1,
      details: "Default author level",
    },
  });
  await db.user.update({
    where: { id: seller.id },
    data: { authorLevels: { connect: { id: authorLevel.id } } },
  });
  console.log("✓ Author level seeded");

  // 6. Products (12 sample products matching the live site)
  const products = [
    {
      title: "Draw and Color – Unity Game Source Code",
      slug: "buy-unity-games-draw-and-color-ready-game-code",
      description: "<p>Inspire Creativity Through Drawing and Color. A creative playground for young artists with brushes, color palettes, and sharing features.</p>",
      price: 18.0,
      priceCl: 180.0,
      reskinPrice: 120.0,
      publishPrice: 25.0,
      storeOptimizationPrice: 50.0,
      thumbnail: "/products/draw-and-color.png",
      previewImage: "/products/draw-and-color.png",
      inlinePreviewImage: "/products/draw-and-color.png",
      demoUrl: "https://readygamecode.com/demo/draw-and-color",
      previewVideo: "https://youtu.be/UtYVb3skpOM",
      tags: '["unity drawing game source code","coloring book unity project","unity kids art game","buy unity full project","ready to publish unity project"]',
      isFeatured: 1,
      totalSold: 15,
      avgRating: 4.8,
      totalReview: 8,
      subCategory: "Puzzle",
    },
    {
      title: "Wavy Trip – Unity Game Source Code",
      slug: "buy-wavy-trip-unity-game-source-code",
      description: "<p>Wavy Trip is a hyper-casual Unity game template perfect for casual gamers. Easy to reskin, AdMob integrated, ready to publish.</p>",
      price: 17.0,
      priceCl: 170.0,
      reskinPrice: 120.0,
      publishPrice: 25.0,
      storeOptimizationPrice: 50.0,
      thumbnail: "/products/wavy-trip.png",
      previewImage: "/products/wavy-trip.png",
      inlinePreviewImage: "/products/wavy-trip.png",
      demoUrl: "https://readygamecode.com/demo/wavy-trip",
      previewVideo: "https://youtu.be/example1",
      tags: '["unity casual game","hyper casual","unity source code"]',
      isFeatured: 1,
      totalSold: 23,
      avgRating: 4.6,
      totalReview: 12,
      subCategory: "Casual",
    },
    {
      title: "Water Sort Puzzle Unity Source Code",
      slug: "water-sort-puzzle-unity-source-code",
      description: "<p>Classic water sort puzzle game built in Unity. Includes 100+ levels, AdMob ads, IAP support, and full source code.</p>",
      price: 15.0,
      priceCl: 150.0,
      reskinPrice: 120.0,
      publishPrice: 25.0,
      storeOptimizationPrice: 50.0,
      thumbnail: "/products/water-sort.png",
      previewImage: "/products/water-sort.png",
      inlinePreviewImage: "/products/water-sort.png",
      demoUrl: "https://readygamecode.com/demo/water-sort",
      previewVideo: "https://youtu.be/example2",
      tags: '["water sort","puzzle game","unity puzzle","casual game"]',
      isFeatured: 1,
      totalSold: 31,
      avgRating: 4.7,
      totalReview: 18,
      subCategory: "Puzzle",
    },
    {
      title: "Emoji Sliding Down – Unity Game Source Code",
      slug: "emoji-sliding-down-unity-game-source-code",
      description: "<p>Fun emoji-themed sliding puzzle game. 50+ levels, smooth gameplay, AdMob integration. Perfect for casual gamers.</p>",
      price: 14.0,
      priceCl: 140.0,
      reskinPrice: 120.0,
      publishPrice: 25.0,
      storeOptimizationPrice: 50.0,
      thumbnail: "/products/emoji-sliding.png",
      previewImage: "/products/emoji-sliding.png",
      inlinePreviewImage: "/products/emoji-sliding.png",
      demoUrl: "https://readygamecode.com/demo/emoji-sliding",
      previewVideo: "https://youtu.be/example3",
      tags: '["emoji game","sliding puzzle","unity source"]',
      isFeatured: 1,
      totalSold: 19,
      avgRating: 4.5,
      totalReview: 7,
      subCategory: "Casual",
    },
    {
      title: "Brain Math Game — Unity Game Source Code",
      slug: "brain-math-game-unity-source-code",
      description: "<p>Brain Math is an educational puzzle game that challenges players with math problems. Perfect for kids learning.</p>",
      price: 12.0,
      priceCl: 120.0,
      reskinPrice: 120.0,
      publishPrice: 25.0,
      storeOptimizationPrice: 50.0,
      thumbnail: "/products/brain-math.png",
      previewImage: "/products/brain-math.png",
      inlinePreviewImage: "/products/brain-math.png",
      demoUrl: "https://readygamecode.com/demo/brain-math",
      previewVideo: "https://youtu.be/example4",
      tags: '["math game","educational","kids game","unity"]',
      isFeatured: 1,
      totalSold: 27,
      avgRating: 4.9,
      totalReview: 14,
      subCategory: "Puzzle",
    },
    {
      title: "Kiwi Adventures | Adventure Platformer Unity Game",
      slug: "kiwi-adventures-adventure-platformer-unity-game",
      description: "<p>Join Kiwi on an epic adventure across 30+ levels. Classic platformer mechanics with modern Unity graphics.</p>",
      price: 25.0,
      priceCl: 250.0,
      reskinPrice: 120.0,
      publishPrice: 25.0,
      storeOptimizationPrice: 50.0,
      thumbnail: "/products/kiwi-adventures.png",
      previewImage: "/products/kiwi-adventures.png",
      inlinePreviewImage: "/products/kiwi-adventures.png",
      demoUrl: "https://readygamecode.com/demo/kiwi-adventures",
      previewVideo: "https://youtu.be/example5",
      tags: '["platformer","adventure game","unity platformer","kiwi"]',
      isFeatured: 1,
      totalSold: 12,
      avgRating: 4.4,
      totalReview: 5,
      subCategory: "Platformer",
    },
    {
      title: "Color Slither – Unity Game Source Code (Full Project)",
      slug: "color-slither-unity-source-code",
      description: "<p>Color Slither is an addictive hyper-casual game where you control a slithering snake. Simple controls, addictive gameplay.</p>",
      price: 13.0,
      priceCl: 130.0,
      reskinPrice: 120.0,
      publishPrice: 25.0,
      storeOptimizationPrice: 50.0,
      thumbnail: "/products/color-slither.png",
      previewImage: "/products/color-slither.png",
      inlinePreviewImage: "/products/color-slither.png",
      demoUrl: "https://readygamecode.com/demo/color-slither",
      previewVideo: "https://youtu.be/example6",
      tags: '["slither","hyper casual","snake game","unity"]',
      isFeatured: 1,
      totalSold: 22,
      avgRating: 4.3,
      totalReview: 9,
      subCategory: "Casual",
    },
    {
      title: "Stack Ball – Unity Game Source Code",
      slug: "stack-ball-unity-source-code",
      description: "<p>Stack Ball is the popular hyper-casual game where you smash through stacks. Full Unity source code with AdMob.</p>",
      price: 14.0,
      priceCl: 140.0,
      reskinPrice: 120.0,
      publishPrice: 25.0,
      storeOptimizationPrice: 50.0,
      thumbnail: "/products/stack-ball.png",
      previewImage: "/products/stack-ball.png",
      inlinePreviewImage: "/products/stack-ball.png",
      demoUrl: "https://readygamecode.com/demo/stack-ball",
      previewVideo: "https://youtu.be/example7",
      tags: '["stack ball","hyper casual","unity source"]',
      isFeatured: 1,
      totalSold: 28,
      avgRating: 4.7,
      totalReview: 11,
      subCategory: "Casual",
    },
    {
      title: "Ant Flow – Guide the Ants, Reach the Food",
      slug: "ant-flow-guide-the-ants-reach-the-food",
      description: "<p>Ant Flow is a puzzle game where you draw paths to guide ants to food. 60+ levels, smooth physics, AdMob integration.</p>",
      price: 14.0,
      priceCl: 140.0,
      reskinPrice: 120.0,
      publishPrice: 25.0,
      storeOptimizationPrice: 50.0,
      thumbnail: "/products/ant-flow.png",
      previewImage: "/products/ant-flow.png",
      inlinePreviewImage: "/products/ant-flow.png",
      demoUrl: "https://readygamecode.com/demo/ant-flow",
      previewVideo: "https://youtu.be/example8",
      tags: '["ant flow","puzzle game","drawing game","unity"]',
      isFeatured: 1,
      totalSold: 18,
      avgRating: 4.6,
      totalReview: 6,
      subCategory: "Puzzle",
    },
    {
      title: "Brain Teaser Screw Puzzle – Unlock Levels & Train Your Mind",
      slug: "brain-teaser-screw-puzzle",
      description: "<p>Brain Teaser Screw Puzzle is a unique puzzle game where you unscrew bolts to solve levels. 80+ levels included.</p>",
      price: 10.0,
      priceCl: 100.0,
      reskinPrice: 120.0,
      publishPrice: 25.0,
      storeOptimizationPrice: 50.0,
      thumbnail: "/products/brain-teaser.png",
      previewImage: "/products/brain-teaser.png",
      inlinePreviewImage: "/products/brain-teaser.png",
      demoUrl: "https://readygamecode.com/demo/brain-teaser",
      previewVideo: "https://youtu.be/example9",
      tags: '["screw puzzle","brain teaser","puzzle game","unity"]',
      isFeatured: 1,
      totalSold: 34,
      avgRating: 4.8,
      totalReview: 16,
      subCategory: "Puzzle",
    },
    {
      title: "Balloon Pop | Fun Colorful Popping Game For Kids",
      slug: "balloon-pop-fun-colorful-popping-game-for-kids",
      description: "<p>Balloon Pop is a colorful, kid-friendly game where you pop balloons to score points. Educational and fun!</p>",
      price: 9.0,
      priceCl: 90.0,
      reskinPrice: 120.0,
      publishPrice: 25.0,
      storeOptimizationPrice: 50.0,
      thumbnail: "/products/balloon-pop.png",
      previewImage: "/products/balloon-pop.png",
      inlinePreviewImage: "/products/balloon-pop.png",
      demoUrl: "https://readygamecode.com/demo/balloon-pop",
      previewVideo: "https://youtu.be/example10",
      tags: '["balloon pop","kids game","casual game","unity"]',
      isFeatured: 1,
      totalSold: 21,
      avgRating: 4.5,
      totalReview: 8,
      subCategory: "Casual",
    },
    {
      title: "DotConnect – Fun & Addictive Line Puzzle Game",
      slug: "dotconnect-fun-addictive-line-puzzle-game",
      description: "<p>DotConnect is a line-connecting puzzle game with 100+ levels. Connect the dots without crossing lines!</p>",
      price: 13.0,
      priceCl: 130.0,
      reskinPrice: 120.0,
      publishPrice: 25.0,
      storeOptimizationPrice: 50.0,
      thumbnail: "/products/dotconnect.png",
      previewImage: "/products/dotconnect.png",
      inlinePreviewImage: "/products/dotconnect.png",
      demoUrl: "https://readygamecode.com/demo/dotconnect",
      previewVideo: "https://youtu.be/example11",
      tags: '["dot connect","line puzzle","puzzle game","unity"]',
      isFeatured: 1,
      totalSold: 17,
      avgRating: 4.4,
      totalReview: 7,
      subCategory: "Puzzle",
    },
  ];

  for (const p of products) {
    const subCat = subCatRecords.find((s) => s.name === p.subCategory);
    if (!subCat) continue;
    await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        userId: seller.id,
        categoryId: gameCategory.id,
        subCategoryId: subCat.id,
        title: p.title,
        slug: p.slug,
        description: p.description,
        price: p.price,
        priceCl: p.priceCl,
        reskinPrice: p.reskinPrice,
        publishPrice: p.publishPrice,
        storeOptimizationPrice: p.storeOptimizationPrice,
        thumbnail: p.thumbnail,
        previewImage: p.previewImage,
        inlinePreviewImage: p.inlinePreviewImage,
        demoUrl: p.demoUrl,
        previewVideo: p.previewVideo,
        tags: p.tags,
        isFeatured: p.isFeatured,
        totalSold: p.totalSold,
        avgRating: p.avgRating,
        totalReview: p.totalReview,
        status: 1, // approved
        productUpdated: 0,
        publishedAt: new Date(),
      },
    });
  }
  console.log(`✓ ${products.length} products seeded`);

  // 7. Sample reviews (marked as synthetic since they may be auto-generated)
  const reviewCategories = [
    { name: "Code Quality", slug: "code-quality" },
    { name: "Documentation", slug: "documentation" },
    { name: "Performance", slug: "performance" },
    { name: "Support", slug: "support" },
    { name: "Value for Money", slug: "value-for-money" },
  ];
  for (const rc of reviewCategories) {
    await db.reviewCategory.upsert({
      where: { slug: rc.slug },
      update: {},
      create: rc,
    });
  }
  console.log(`✓ ${reviewCategories.length} review categories seeded`);

  // 8. Blog categories + posts
  const blogCategories = [
    { name: "ASO & Publishing", slug: "aso-publishing" },
    { name: "Marketing & Growth", slug: "marketing-growth" },
    { name: "Development Tips", slug: "development-tips" },
    { name: "LiveOps", slug: "liveops" },
  ];
  const blogCatRecords: any[] = [];
  for (const bc of blogCategories) {
    const rec = await db.blogCategory.upsert({
      where: { slug: bc.slug },
      update: {},
      create: bc,
    });
    blogCatRecords.push(rec);
  }

  const blogPosts = [
    {
      title: "App Store Copywriting: Structuring High-Converting Store Listing Pages",
      slug: "app-store-copywriting-high-converting-listing-pages",
      excerpt: "Master the art of writing app store descriptions that convert browsers into buyers.",
      body: "<p>App store copywriting is one of the most underappreciated skills in mobile game marketing. A well-crafted listing page can increase your conversion rate by 30-50%...</p>",
      coverImage: "/blog/aso-copywriting.jpg",
      blogCategoryId: blogCatRecords[0].id,
    },
    {
      title: "Reddit Self-Promotion Guide: Participating in Communities without Bans",
      slug: "reddit-self-promotion-guide-communities-without-bans",
      excerpt: "Learn how to promote your game on Reddit without getting banned by moderators.",
      body: "<p>Reddit is one of the best platforms for organic game discovery, but it's also one of the strictest when it comes to self-promotion...</p>",
      coverImage: "/blog/reddit-promotion.jpg",
      blogCategoryId: blogCatRecords[1].id,
    },
    {
      title: "Landing Page Conversion Optimizations: Creating Landing Pages for Games",
      slug: "landing-page-conversion-optimizations-games",
      excerpt: "Design landing pages that turn visitors into players with these proven techniques.",
      body: "<p>Your game's landing page is often the first impression potential players have of your product...</p>",
      coverImage: "/blog/landing-page.jpg",
      blogCategoryId: blogCatRecords[1].id,
    },
    {
      title: "Post-Launch LiveOps: Retaining Players with Events, Updates, and Patches",
      slug: "post-launch-liveops-retaining-players-events-updates-patches",
      excerpt: "Keep your players engaged long after launch with a solid LiveOps strategy.",
      body: "<p>Launching your game is just the beginning. The real work starts post-launch with LiveOps...</p>",
      coverImage: "/blog/liveops.jpg",
      blogCategoryId: blogCatRecords[3].id,
    },
  ];
  for (const bp of blogPosts) {
    await db.blogPost.upsert({
      where: { slug: bp.slug },
      update: {},
      create: {
        ...bp,
        isPublished: 1,
        publishedAt: new Date(),
      },
    });
  }
  console.log(`✓ ${blogPosts.length} blog posts seeded`);


  console.log("\n✅ Seed complete!");
  console.log("   Admin:    admin@readygamecode.com / admin123");
  console.log("   Reviewer: pranav@readygamecode.com / reviewer123");
  console.log("   Seller:   readygamecode@example.com / seller123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
