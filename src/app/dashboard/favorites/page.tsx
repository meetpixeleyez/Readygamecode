import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FavoriteButton } from "@/components/FavoriteButton";

export default async function FavoritesPage() {
  const session = await getCurrentUser();

  if (!session || !session.sub) {
    redirect("/login");
  }

  const favorites = await db.productUser.findMany({
    where: { userId: session.sub },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          price: true,
          user: {
            select: {
              username: true,
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Favorites</h1>
        <p className="text-muted-foreground mt-2">
          Products you have saved to your favorites.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12 border border-border rounded-lg bg-card/50">
          <p className="text-muted-foreground mb-4">You haven&apos;t favorited any products yet.</p>
          <Link href="/products" className="text-primary hover:underline">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((fav) => {
            const cleanSlug = fav.product.slug ? fav.product.slug.replace(/-+$/, "") : fav.product.id;
            return (
              <div key={fav.productId} className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
                <Link href={`/game-source-code/${cleanSlug}`} className="relative aspect-[860/450] w-full overflow-hidden bg-muted/40">
                  <Image
                    src={fav.product.thumbnail || "/placeholder.png"}
                    alt={fav.product.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </Link>
                
                <div className="absolute top-2 right-2 z-10 bg-background/80 rounded-full backdrop-blur-sm">
                  <FavoriteButton productId={fav.product.id} initialIsFavorited={true} />
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <Link href={`/game-source-code/${cleanSlug}`}>
                    <h3 className="line-clamp-1 font-semibold hover:text-primary transition-colors">
                      {fav.product.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">
                    by {fav.product.user?.username || "Unknown"}
                  </p>
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="font-bold text-lg">${fav.product.price}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
