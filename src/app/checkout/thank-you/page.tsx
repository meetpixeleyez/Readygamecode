import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Download, ArrowRight, Mail } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface ThankYouPageProps {
  searchParams: Promise<{ trx?: string }>;
}

export async function generateMetadata() {
  return {
    title: "Order Confirmation — Thank You!",
  };
}

export default async function ThankYouPage({ searchParams }: ThankYouPageProps) {
  const { trx } = await searchParams;

  if (!trx) {
    notFound();
  }

  const order = await db.order.findUnique({
    where: { trx },
    include: {
      orderItems: {
        include: {
          product: {
            include: { user: true },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-9 w-9 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Thank You for Your Purchase!</h1>
          <p className="text-muted-foreground mt-2">
            Your order has been completed successfully. A confirmation email has been sent.
          </p>
        </div>

        {/* Order details */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground">Order Number</p>
              <p className="font-mono font-medium">{order.trx}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Order Date</p>
              <p className="text-sm">
                {new Date(order.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">Total Paid</span>
            <span className="text-2xl font-bold text-primary">
              ${order.amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Downloads */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            Download Your Items
          </h2>
          <div className="space-y-3">
            {order.orderItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 items-center p-3 rounded-md border border-border"
              >
                <Link
                  href={`/game-source-code/${item.product.slug}`}
                  className="shrink-0"
                >
                  <div className="w-14 h-14 rounded-md overflow-hidden bg-muted relative">
                    <Image
                      src={
                        item.product.thumbnail ||
                        "/products/placeholder.svg"
                      }
                      alt={item.product.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/game-source-code/${item.product.slug}`}
                    className="text-sm font-medium hover:text-primary line-clamp-1"
                  >
                    {item.product.title}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.license === 1 ? "Personal License" : "Commercial License"}
                    {item.isExtended === 1 && " · Extended"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Purchase code:{" "}
                    <code className="font-mono bg-accent px-1 rounded">
                      {item.purchaseCode}
                    </code>
                  </p>
                </div>
                {item.isRefunded === 1 ? (
                  <Badge variant="destructive">Refunded</Badge>
                ) : (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`/api/download/${item.product.id}`} download>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* License info */}
        <div className="rounded-lg border border-border bg-accent/30 p-4 mb-6 text-sm">
          <p className="font-medium mb-1">License Information</p>
          <p className="text-muted-foreground text-xs">
            Your purchase includes future updates and 3 months of support from the author.
            Keep your purchase code safe — you&apos;ll need it to verify your license when
            publishing your game.
          </p>
        </div>

        {/* Next steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              View My Purchases
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild>
            <Link href="/products">
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Support */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-1.5">
            <Mail className="h-4 w-4" />
            Need help?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
