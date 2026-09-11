import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Code2, ArrowRight, Tag } from "lucide-react";

export const dynamic = "force-dynamic";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

import { JsonLd } from "@/components/seo/json-ld";

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({
    where: { slug },
    include: { blogCategory: true },
  });

  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.excerpt || post.title,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt || "",
      images: post.coverImage ? [{ url: post.coverImage }] : [],
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({
    where: { slug, isPublished: 1 },
    include: { blogCategory: true },
  });

  if (!post) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://readygamecode.com";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt || post.title,
    "url": `${baseUrl}/blog/${post.slug}`,
    "image": post.coverImage || `${baseUrl}/logo.png`,
    "datePublished": post.publishedAt ? post.publishedAt.toISOString() : post.createdAt.toISOString(),
    "dateModified": post.updatedAt.toISOString(),
    "author": {
      "@type": "Organization",
      "name": "Ready Game Code Team",
      "url": baseUrl,
    },
    "publisher": {
      "@type": "Organization",
      "name": "Ready Game Code",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`,
      },
    },
  };

  // Get related posts (same category, exclude current)
  const related = await db.blogPost.findMany({
    where: {
      isPublished: 1,
      blogCategoryId: post.blogCategoryId,
      id: { not: post.id },
    },
    include: { blogCategory: true },
    take: 3,
    orderBy: { publishedAt: "desc" },
  });

  // Get more recent posts if related is empty
  const fallback = related.length === 0
    ? await db.blogPost.findMany({
        where: { isPublished: 1, id: { not: post.id } },
        include: { blogCategory: true },
        take: 3,
        orderBy: { publishedAt: "desc" },
      })
    : related;

  return (
    <article className="container mx-auto px-4 py-12">
      <JsonLd data={articleSchema} />
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-8">
          {post.blogCategory && (
            <Link href={`/blog?category=${post.blogCategory.slug}`}>
              <Badge variant="secondary" className="mb-3">
                {post.blogCategory.name}
              </Badge>
            </Link>
          )}
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-lg text-muted-foreground mt-3">{post.excerpt}</p>
          )}
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-4">
            <Calendar className="h-4 w-4" />
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "Draft"}
          </div>
        </div>

        {/* Cover */}
        {post.coverImage && (
          <div className="aspect-[16/9] rounded-lg overflow-hidden mb-8 bg-muted relative">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Body */}
        <div
          className="prose prose-sm md:prose-base max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        <Separator className="my-10" />

        {/* Share / actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Posts
            </Link>
          </Button>
          <Button asChild>
            <Link href="/products">
              Browse Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Related posts */}
        {fallback.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {fallback.map((p) => (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="group rounded-lg border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center">
                    <Code2 className="h-8 w-8 text-primary/60" />
                  </div>
                  <div className="p-3 space-y-1.5">
                    {p.blogCategory && (
                      <Badge variant="secondary" className="text-xs">
                        {p.blogCategory.name}
                      </Badge>
                    )}
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                      {p.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {p.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
