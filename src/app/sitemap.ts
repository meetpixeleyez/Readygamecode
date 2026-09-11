import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://readygamecode.com';

  // Fetch approved products
  const products = await db.product.findMany({
    where: { status: 1 },
    select: { slug: true, updatedAt: true },
  });

  const productUrls = products.map((product) => ({
    url: `${baseUrl}/game-source-code/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Fetch published blog posts
  const blogPosts = await db.blogPost.findMany({
    where: { isPublished: 1 },
    select: { slug: true, updatedAt: true },
  });

  const blogUrls = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Fetch active seller authors
  const authors = await db.user.findMany({
    where: { isAuthor: 1, status: 1 },
    select: { username: true, updatedAt: true },
  });

  const authorUrls = authors
    .filter((a) => a.username)
    .map((author) => ({
      url: `${baseUrl}/authors/${author.username}`,
      lastModified: author.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  // Fetch active categories
  const categories = await db.category.findMany({
    where: { status: 1 },
    select: { name: true, updatedAt: true },
  });

  const categoryUrls = categories.map((cat) => ({
    url: `${baseUrl}/products?category=${encodeURIComponent(cat.name)}`,
    lastModified: cat.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Static routes
  const routes = [
    '',
    '/about',
    '/contact',
    '/products',
    '/free-products',
    '/blog',
    '/privacy-policy',
    '/terms-conditions',
    '/refund-policy'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.7,
  }));

  return [...routes, ...categoryUrls, ...productUrls, ...blogUrls, ...authorUrls];
}
