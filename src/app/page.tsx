import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Gamepad2,
  ShieldCheck,
  Headphones,
  Code2,
  Sparkles,
  TrendingUp,
  Package,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getHomepageData() {
  const [featuredProducts, popularProducts, blogPosts, totalProducts, totalAuthors] =
    await Promise.all([
      db.product.findMany({
        where: {
          status: 1,
          isFeatured: 1,
        },
        include: { user: true },
        orderBy: { totalSold: "desc" },
        take: 12,
      }),
      db.product.findMany({
        where: { status: 1 },
        include: { user: true },
        orderBy: { totalSold: "desc" },
        take: 8,
      }),
      db.blogPost.findMany({
        where: { isPublished: 1 },
        include: { blogCategory: true },
        orderBy: { publishedAt: "desc" },
        take: 4,
      }),
      db.product.count({ where: { status: 1 } }),
      db.user.count({ where: { isAuthor: 1 } }),
    ]);

  return { featuredProducts, popularProducts, blogPosts, totalProducts, totalAuthors };
}

export default async function Home() {
  const { featuredProducts, popularProducts, blogPosts, totalProducts, totalAuthors } =
    await getHomepageData();

  const session = await getCurrentUser();
  let userFavoriteIds = new Set<string>();
  if (session?.sub) {
    const favs = await db.productUser.findMany({
      where: { userId: session.sub },
      select: { productId: true },
    });
    userFavoriteIds = new Set(favs.map((f) => f.productId));
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden mesh-gradient">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="outline" className="glass py-1.5 px-4 text-sm font-medium border-primary/20 text-primary">
              <Sparkles className="w-4 h-4 mr-2" />
              The Ultimate Marketplace for Game Developers
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
              Turn Your Game Dreams Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">Reality</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Buy high-quality Unity, Android, and iOS game source codes at affordable prices. Ready-to-publish templates with full documentation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" asChild className="w-full sm:w-auto h-12 px-8 text-base shadow-lg shadow-primary/25">
                <Link href="#products">
                  Explore Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto h-12 px-8 text-base glass hover:bg-background/80">
                <Link href="/seller/products/new">Become an Author</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard
            icon={Gamepad2}
            title="Helpful resources for game developers"
            description="Curated guides, tutorials, and resources to help you ship your game faster."
            link="/blog"
            linkText="Read guides"
          />
          <InfoCard
            icon={Code2}
            title="Unity source code marketplace"
            description="Browse hundreds of premium Unity source codes with AdMob integration and full documentation."
            link="/#products"
            linkText="Explore products"
          />
          <InfoCard
            icon={Headphones}
            title="Trusted support and licensing"
            description="Personal and commercial licenses with dedicated support from our team."
            link="/contact"
            linkText="Contact support"
          />
        </div>
      </section>

      {/* Featured Products */}
      <section id="products" className="container mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Featured Products</h2>
            <p className="text-muted-foreground mt-1">
              Hand-picked premium game source codes
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden sm:flex">
            <Link href="/products?featured=true">
              View All Items
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredProducts.map((product, idx) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              priority={idx < 4} 
              initialIsFavorited={userFavoriteIds.has(product.id)}
            />
          ))}
        </div>
      </section>

      {/* Popular Items */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Popular Items</h2>
            <p className="text-muted-foreground mt-1">
              Most purchased game source codes this week
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {popularProducts.slice(0, 4).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              initialIsFavorited={userFavoriteIds.has(product.id)}
            />
          ))}
        </div>
      </section>

      {/* Latest Blog Posts */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Latest Developer Articles</h2>
            <p className="text-muted-foreground mt-1">
              Insights, tips, and growth strategies for game developers
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden sm:flex">
            <Link href="/blog">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="group rounded-lg border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
            >
              <Link href={`/blog/${post.slug}`} className="block">
                <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center">
                  <Code2 className="h-10 w-10 text-primary/60" />
                </div>
                <div className="p-4 space-y-2">
                  {post.blogCategory && (
                    <Badge variant="secondary" className="text-xs">
                      {post.blogCategory.name}
                    </Badge>
                  )}
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-2xl bg-gradient-to-r from-orange-500 via-primary to-amber-500 p-8 md:p-12 text-center text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <h2 className="text-2xl md:text-4xl font-extrabold mb-3 tracking-tight">
            Ready to Launch Your Game?
          </h2>
          <p className="text-primary-foreground/90 max-w-2xl mx-auto mb-6 text-sm md:text-base">
            Join thousands of developers who bought our source codes and launched their
            games on Google Play and App Store.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
            <Button size="lg" variant="secondary" asChild className="font-semibold shadow-md">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="bg-transparent text-primary-foreground border-primary-foreground/80 hover:bg-primary-foreground hover:text-primary font-semibold"
            >
              <Link href="/contact">Hire Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5 text-center card-hover">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-1 font-medium">{label}</div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
  link,
  linkText,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  link: string;
  linkText: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-6 space-y-3 card-hover">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-orange-400/10 flex items-center justify-center border border-primary/20">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      <Button variant="link" asChild className="px-0 text-primary font-medium hover:underline">
        <Link href={link}>
          {linkText}
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}
