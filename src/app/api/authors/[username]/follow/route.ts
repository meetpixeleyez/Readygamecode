import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await params;
    
    const author = await db.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: "insensitive" } },
          { id: username },
        ],
      },
    });

    if (!author || author.status === 0) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    if (author.id === user.sub) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    // Check if already following
    const existingFollow = await db.follow.findFirst({
      where: {
        followerId: user.sub,
        followingId: author.id,
      },
    });

    if (existingFollow) {
      // Unfollow
      await db.$transaction([
        db.follow.delete({
          where: { id: existingFollow.id },
        }),
        db.user.update({
          where: { id: author.id },
          data: { totalFollower: { decrement: 1 } },
        }),
        db.user.update({
          where: { id: user.sub },
          data: { totalFollowing: { decrement: 1 } },
        }),
      ]);

      return NextResponse.json({
        isFollowing: false,
        followersCount: Math.max(0, author.totalFollower - 1),
      });
    } else {
      // Follow
      await db.$transaction([
        db.follow.create({
          data: {
            followerId: user.sub,
            followingId: author.id,
          },
        }),
        db.user.update({
          where: { id: author.id },
          data: { totalFollower: { increment: 1 } },
        }),
        db.user.update({
          where: { id: user.sub },
          data: { totalFollowing: { increment: 1 } },
        }),
      ]);

      return NextResponse.json({
        isFollowing: true,
        followersCount: author.totalFollower + 1,
      });
    }
  } catch (error) {
    console.error("[FOLLOW_TOGGLE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
