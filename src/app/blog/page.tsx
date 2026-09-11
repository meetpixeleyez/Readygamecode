import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Code2, Calendar } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";

interface BlogPageProps {
  searchParams: Promise<{ category?: string }>;
}

export async function generateMetadata() {
  const title = "Blog — Game Development Tips, Tutorials & Growth Strategies";
  const description = "Insights, tutorials, and growth strategies for game developers. Learn ASO, marketing, LiveOps, and more from the Ready Game Code blog.";

  return {
    title,
    description,
    alternates: {
      canonical: "/blog",
    },
    openGraph: {
      title: `${title} | Ready Game Code`,
      description,
    },
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { category: categorySlug } = await searchParams;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://readygamecode.com";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": `${baseUrl}/blog`
      }
    ]
  };

  // Load categories
  const categories = await db.blogCategory.findMany({
    where: { isActive: 1 },
    orderBy: { name: "asc" },
  });

  // Build where clause
  const where: any = { isPublished: 1 };
  if (categorySlug) {
    const cat = categories.find((c) => c.slug === categorySlug);
    if (cat) where.blogCategoryId = cat.id;
  }

  const posts = await db.blogPost.findMany({
    where,
    include: { blogCategory: true },
    orderBy: { publishedAt: "desc" },
  });

  const activeCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null;

  return (
    <div className="container mx-auto px-4 py-12">
      <JsonLd data={[breadcrumbSchema]} />
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold">Ready Game Code Blog</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Insights, tutorials, and growth strategies for indie game developers.
            Learn how to publish, market, and grow your games.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <Link
            href="/blog"
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
              !categorySlug
                ? "bg-primary text-primary-foreground"
                : "bg-accent hover:bg-accent/70"
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/blog?category=${cat.slug}`}
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                categorySlug === cat.slug
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent hover:bg-accent/70"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-16 rounded-lg border border-dashed border-border">
            <Code2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold">No posts found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {activeCategory
                ? `No posts in "${activeCategory.name}" yet.`
                : "No blog posts published yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <article
                key={post.id}
                className="group rounded-lg border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  {/* Cover */}
                  <div className="relative aspect-[16/9] bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                        priority={index < 2}
                      />
                    ) : (
                      <Code2 className="h-10 w-10 text-primary/60" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-2">
                    {post.blogCategory && (
                      <Badge variant="secondary" className="text-xs">
                        {post.blogCategory.name}
                      </Badge>
                    )}
                    <h2 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                      <Calendar className="h-3 w-3" />
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Draft"}
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
