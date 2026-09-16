import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getCurrentUser } from "@/lib/auth";
import { getCartContext } from "@/lib/cart-session";
import { db } from "@/lib/db";
import { ChatWidgets } from "@/components/chat-widgets";
import { ThemeProvider } from "@/components/theme-provider";
import { WelcomeModal } from "@/components/welcome-modal";
import { JsonLd } from "@/components/seo/json-ld";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://readygamecode.com'),
  title: {
    default: "Ready Game Code — Buy Unity Source Codes & Game Templates",
    template: "%s | Ready Game Code",
  },
  description:
    "Turn Your Game Dreams into Reality with Premium Source Codes! Buy high-quality Unity, Android, and iOS game source codes at affordable prices. Ready-to-publish game templates with AdMob integration, easy reskin options, and full documentation.",
  keywords: [
    "digital product",
    "buy unity game source code",
    "buy unity source code",
    "unity 3d template",
    "android game code",
    "ios game code",
    "reskin game",
    "admob integration",
  ],
  authors: [{ name: "Ready Game Code" }],
  icons: {
    icon: "/favicon.ico",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Buy Unity Source Code | Ready Game Code",
    description:
      "Buy high-quality Unity, Android, and iOS game source codes at affordable prices. Ready-to-publish game templates with AdMob integration, easy reskin options, and full documentation.",
    url: "https://readygamecode.com",
    siteName: "Ready Game Code",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Ready Game Code Logo",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Ready Game Code — Unity Source Codes Marketplace",
    description:
      "Buy high-quality Unity, Android, and iOS game source codes at affordable prices.",
    images: ["/logo.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentUser();
  let cartCount = 0;
  let categories: any[] = [];

  try {
    const cartCtx = await getCartContext();
    cartCount = await db.cart.count({
      where: cartCtx.userId ? { userId: cartCtx.userId } : { sessionId: cartCtx.sessionId },
    });

    categories = await db.category.findMany({
      where: { status: 1 },
      include: { subCategories: { where: { status: 1 }, orderBy: { name: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  } catch (err) {
    console.error("Failed to load layout database data:", err);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://readygamecode.com';

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Ready Game Code",
    "url": appUrl,
    "logo": `${appUrl}/logo.png`,
    "sameAs": [
      "https://twitter.com/readygamecode",
      "https://facebook.com/readygamecode"
    ],
    "description": "Premium marketplace for Unity, Android, and iOS game source codes and templates."
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Ready Game Code",
    "url": appUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${appUrl}/products?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${outfit.variable} antialiased min-h-screen flex flex-col font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <JsonLd data={[organizationSchema, websiteSchema]} />
          <Header session={session} cartCount={cartCount} categories={categories} />
          <main className="flex-1">{children}</main>
          <Footer />
          <ChatWidgets />
          <Toaster />
          <WelcomeModal />
        </ThemeProvider>
      </body>
    </html>
  );
}
