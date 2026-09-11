"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageCircle, Lock, CornerDownRight, Send } from "lucide-react";

interface CommentUser {
  id: string;
  username: string | null;
  firstname: string | null;
  lastname: string | null;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: CommentUser;
  replies?: Comment[];
}

interface CommentsSectionProps {
  productId: string;
  userId?: string;
}

export function CommentsSection({ productId, userId }: CommentsSectionProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [authUser, setAuthUser] = useState<{ id: string } | null>(userId ? { id: userId } : null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetch(`/api/products/${productId}/comments`)
      .then((r) => r.json())
      .then((commentData) => {
        if (commentData.comments) setComments(commentData.comments);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newComment }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Failed to post comment",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Comment posted!" });
      setComments([data.comment, ...comments]);
      setNewComment("");
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(parentId: string) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText, parentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Failed to post reply",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Reply posted!" });
      // Update comments: add reply to parent
      const updated = comments.map((c) => {
        if (c.id === parentId) {
          return { ...c, replies: [...(c.replies || []), data.comment] };
        }
        return c;
      });
      setComments(updated);
      setReplyText("");
      setReplyTo(null);
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

  return (
    <div className="space-y-6">
      {/* New comment form */}
      {authUser ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            required
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
          />
          <Button type="submit" disabled={submitting || !newComment.trim()}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Post Comment
              </>
            )}
          </Button>
        </form>
      ) : (
        <div className="text-center py-6 rounded-lg border border-dashed border-border">
          <Lock className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            Sign in to join the conversation
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">Sign In to Comment</Link>
          </Button>
        </div>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            No comments yet. Start the conversation!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              {/* Comment */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-bold text-primary text-xs">
                      {(comment.user.firstname || comment.user.username || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {comment.user.firstname} {comment.user.lastname}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{comment.text}</p>
                {authUser && (
                  <button
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    className="cursor-pointer text-xs text-primary hover:underline mt-2"
                  >
                    Reply
                  </button>
                )}
              </div>

              {/* Reply form */}
              {replyTo === comment.id && (
                <div className="ml-6 space-y-2">
                  <Textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleReply(comment.id)}
                      disabled={submitting || !replyText.trim()}
                    >
                      Post Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyTo(null);
                        setReplyText("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-6 space-y-3">
                  {comment.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="rounded-lg border border-border bg-accent/30 p-3"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <CornerDownRight className="h-3 w-3 text-muted-foreground" />
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-bold text-primary text-xs">
                            {(reply.user.firstname || reply.user.username || "U").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="font-medium text-xs">
                          {reply.user.firstname} {reply.user.lastname}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(reply.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground ml-5">{reply.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
