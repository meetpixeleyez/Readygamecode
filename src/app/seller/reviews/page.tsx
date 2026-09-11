import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SellerReviewsPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  // Get all reviews on this seller's products
  const reviews = await db.review.findMany({
    where: { authorId: session.sub },
    include: {
      product: {
        select: { id: true, title: true, slug: true },
      },
      user: {
        select: {
          id: true,
          username: true,
          firstname: true,
          lastname: true,
          countryName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  // Rating distribution
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customer reviews on your products
        </p>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Avg rating */}
            <div className="text-center md:text-left">
              <div className="text-4xl font-bold text-primary">
                {avgRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i <= Math.round(avgRating)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Based on {reviews.length} review{reviews.length === 1 ? "" : "s"}
              </p>
            </div>

            {/* Distribution */}
            <div className="space-y-1.5">
              {distribution.map((d) => (
                <div key={d.star} className="flex items-center gap-2 text-sm">
                  <span className="flex items-center gap-1 w-12">
                    {d.star}
                    <Star className="h-3 w-3 fill-primary text-primary" />
                  </span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${
                          reviews.length > 0
                            ? (d.count / reviews.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold">No reviews yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Reviews from buyers will appear here once they purchase and review your products.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary text-sm">
                          {(review.user.firstname || review.user.username || "U").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {review.user.firstname} {review.user.lastname}
                        </div>
                        {review.user.countryName && (
                          <div className="text-xs text-muted-foreground">
                            {review.user.countryName}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i <= review.rating
                              ? "fill-primary text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/game-source-code/${review.product.slug}`}
                    className="text-xs text-primary hover:underline"
                  >
                    on: {review.product.title}
                  </Link>

                  <p className="text-sm text-muted-foreground mt-2">{review.review}</p>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    {review.isReported === 1 && (
                      <Badge variant="outline" className="text-xs">
                        Reported
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
