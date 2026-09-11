"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  Star,
  Users,
  Package,
  TrendingUp,
  CheckCircle2,
  ShoppingCart,
  Mail,
  Loader2
} from "lucide-react";

interface AuthorHeaderProps {
  author: {
    id: string;
    firstname: string | null;
    lastname: string | null;
    username: string | null;
    isAuthorFeatured: number;
    totalSold: number;
    totalReview: number;
    avgRating: number;
    totalFollower: number;
    countryName: string | null;
    createdAt: Date;
  };
  productsCount: number;
  initialIsFollowing: boolean;
  currentUserId?: string;
}

export function AuthorHeader({
  author,
  productsCount,
  initialIsFollowing,
  currentUserId,
}: AuthorHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(author.totalFollower);
  const [loading, setLoading] = useState(false);

  const displayName =
    `${author.firstname || ""} ${author.lastname || ""}`.trim() || author.username || "Author";
  const initials = displayName.charAt(0).toUpperCase();

  const handleFollowToggle = async () => {
    if (!currentUserId) {
      toast({ title: "Please sign in to follow authors", description: "You need an active account to follow authors.", variant: "destructive" });
      router.push("/login");
      return;
    }
    
    // Prevent following yourself (optional but good practice)
    if (currentUserId === author.id) {
      toast({ title: "You cannot follow yourself", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/authors/${author.username}/follow`, {
        method: "POST",
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to toggle follow");

      setIsFollowing(data.isFollowing);
      setFollowersCount(data.followersCount);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6 mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="font-bold text-primary text-3xl">{initials}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {author.isAuthorFeatured === 1 && (
              <Badge className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Featured Author
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">@{author.username}</p>

          {author.countryName && (
            <p className="text-sm text-muted-foreground mt-2">
              {author.countryName}
            </p>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            Member since{" "}
            {new Date(author.createdAt).toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full md:w-auto">
          <Stat icon={Package} value={productsCount} label="Products" />
          <Stat icon={TrendingUp} value={author.totalSold} label="Sales" />
          <Stat
            icon={Star}
            value={author.avgRating.toFixed(1)}
            label={`(${author.totalReview})`}
          />
          <Stat icon={Users} value={followersCount} label="Followers" />
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-wrap gap-2">
        {currentUserId === author.id ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block cursor-not-allowed">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    disabled
                    className="pointer-events-none opacity-60"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Follow
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>You cannot follow yourself</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button 
            size="sm" 
            variant={isFollowing ? "default" : "outline"} 
            onClick={handleFollowToggle}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Users className="mr-2 h-4 w-4" />
            )}
            {isFollowing ? "Following" : "Follow"}
          </Button>
        )}
        <Button size="sm" variant="outline" asChild>
          <Link href="/contact">
            <Mail className="mr-2 h-4 w-4" />
            Contact
          </Link>
        </Button>
        {productsCount > 0 && (
          <Button size="sm" asChild>
            <Link href="/products">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Browse Products
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
}) {
  return (
    <div className="text-center">
      <Icon className="h-5 w-5 text-primary mx-auto mb-1" />
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
