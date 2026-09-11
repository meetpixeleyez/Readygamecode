"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Star, Loader2, MessageSquare, Lock } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  review: string;
  createdAt: string;
  user: {
    id: string;
    username: string | null;
    firstname: string | null;
    lastname: string | null;
    countryName: string | null;
  };
}

interface ReviewsSectionProps {
  productId: string;
  initialAvgRating: number;
  initialTotalReview: number;
  userId?: string;
}

export function ReviewsSection({
  productId,
  initialAvgRating,
  initialTotalReview,
  userId,
}: ReviewsSectionProps) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [authUser, setAuthUser] = useState<{ id: string } | null>(userId ? { id: userId } : null);

  useEffect(() => {
    fetch(`/api/products/${productId}/reviews`)
      .then((r) => r.json())
      .then((reviewData) => {
        if (reviewData.reviews) setReviews(reviewData.reviews);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, review: reviewText }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Failed to post review",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Review posted!", description: "Thank you for your feedback." });
      setReviews([data.review, ...reviews]);
      setReviewText("");
      setRating(5);
      setShowForm(false);
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : initialAvgRating.toFixed(1);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl font-bold text-primary">{avgRating}</div>
          <div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i <= Math.round(parseFloat(avgRating))
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {reviews.length} review{reviews.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {authUser && (
          <Button
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? "outline" : "default"}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            {showForm ? "Cancel" : "Write a Review"}
          </Button>
        )}
      </div>

      {/* Write review form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-card p-4 space-y-4"
        >
          <div>
            <Label className="text-sm font-medium">Rating</Label>
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHoverRating(i)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="cursor-pointer p-1"
                  aria-label={`${i} stars`}
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      i <= (hoverRating || rating)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="review-text" className="text-sm font-medium">
              Your Review
            </Label>
            <Textarea
              id="review-text"
              required
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this product..."
              className="mt-1"
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              "Post Review"
            )}
          </Button>
        </form>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 rounded-lg border border-dashed border-border">
          {authUser ? (
            <>
              <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No reviews yet. Be the first to review!
              </p>
            </>
          ) : (
            <>
              <Lock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                Sign in to leave a review
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
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
              <p className="text-sm text-muted-foreground mt-3">{review.review}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(review.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
