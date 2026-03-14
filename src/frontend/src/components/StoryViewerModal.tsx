import { Input } from "@/components/ui/input";
import { Heart, Reply, Send, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Story } from "../backend";
import {
  useAddStoryComment,
  useHasLikedStory,
  useLikeStory,
  useReplyToStoryComment,
  useStoryComments,
  useUnlikeStory,
} from "../hooks/useQueries";

interface StoryViewerModalProps {
  story: Story;
  onClose: () => void;
}

export default function StoryViewerModal({
  story,
  onClose,
}: StoryViewerModalProps) {
  const [comment, setComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<bigint | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: comments = [], isLoading: commentsLoading } = useStoryComments(
    story.id,
  );
  const { data: hasLiked = false } = useHasLikedStory(story.id);
  const likeStory = useLikeStory();
  const unlikeStory = useUnlikeStory();
  const addComment = useAddStoryComment();
  const replyComment = useReplyToStoryComment();

  const handleLike = async () => {
    try {
      if (hasLiked) {
        await unlikeStory.mutateAsync(story.id);
      } else {
        await likeStory.mutateAsync(story.id);
      }
    } catch {
      toast.error("Failed to update like");
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      await addComment.mutateAsync({ storyId: story.id, text: comment.trim() });
      setComment("");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || replyingTo === null) return;
    try {
      await replyComment.mutateAsync({
        storyId: story.id,
        parentCommentId: replyingTo,
        text: replyText.trim(),
      });
      setReplyText("");
      setReplyingTo(null);
    } catch {
      toast.error("Failed to add reply");
    }
  };

  const topLevelComments = comments.filter((c) => !c.parentCommentId);
  const getReplies = (commentId: bigint) =>
    comments.filter(
      (c) => c.parentCommentId && c.parentCommentId === commentId,
    );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: "rgba(0,0,0,0.97)" }}
      data-ocid="story_viewer.modal"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#e11d48,#7c3aed)",
              padding: 2,
            }}
          >
            <div
              className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: "#1a0a1e" }}
            >
              {story.authorPhoto ? (
                <img
                  src={story.authorPhoto}
                  alt={story.authorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-base">
                  {story.authorName.charAt(0)}
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              {story.authorName}
            </p>
            <p className="text-white/50 text-[10px]">
              {new Date(Number(story.timestamp) / 1_000_000).toLocaleTimeString(
                [],
                { hour: "2-digit", minute: "2-digit" },
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          data-ocid="story_viewer.close_button"
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Story image */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0">
        {story.imageUrl ? (
          story.imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
            <video
              src={story.imageUrl}
              controls
              autoPlay
              className="max-w-full max-h-full rounded-2xl object-contain"
              style={{ maxHeight: "50vh" }}
            >
              <track kind="captions" />
            </video>
          ) : (
            <img
              src={story.imageUrl}
              alt="story"
              className="max-w-full rounded-2xl object-contain"
              style={{ maxHeight: "50vh" }}
            />
          )
        ) : (
          <div
            className="w-full max-w-sm aspect-[9/16] rounded-3xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#e11d48,#7c3aed)",
              maxHeight: "50vh",
            }}
          >
            <p className="text-white text-xl font-bold">
              {story.authorName}'s Story
            </p>
          </div>
        )}
      </div>

      {story.caption && (
        <p className="px-4 py-1 text-white/80 text-sm text-center flex-shrink-0">
          {story.caption}
        </p>
      )}

      {/* Like + comments area */}
      <div
        className="flex-shrink-0 px-4 pb-2 pt-1"
        style={{
          background:
            "linear-gradient(0deg, rgba(10,0,16,0.95) 0%, transparent 100%)",
        }}
      >
        {/* Like row */}
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            data-ocid="story_viewer.toggle"
            onClick={handleLike}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
            style={{
              background: hasLiked
                ? "linear-gradient(135deg,#e11d48,#db2777)"
                : "rgba(255,255,255,0.1)",
            }}
          >
            <Heart
              className={`w-4 h-4 ${
                hasLiked ? "fill-white text-white" : "text-white/70"
              }`}
            />
            <span className="text-white text-xs font-medium">
              {Number(story.likesCount)}
            </span>
          </button>
          <span className="text-white/40 text-xs">
            {commentsLoading ? "..." : `${comments.length} comments`}
          </span>
        </div>

        {/* Comments list */}
        {comments.length > 0 && (
          <div
            className="max-h-28 overflow-y-auto space-y-1.5 mb-2"
            style={{ scrollbarWidth: "none" }}
          >
            {topLevelComments.map((c) => (
              <div key={c.id.toString()}>
                <div className="flex items-start gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                    style={{
                      background: "linear-gradient(135deg,#e11d48,#7c3aed)",
                    }}
                  >
                    {c.authorName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-white/90 text-xs font-semibold">
                      {c.authorName}
                    </span>
                    <span className="text-white/70 text-xs ml-1.5">
                      {c.text}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setReplyingTo(replyingTo === c.id ? null : c.id)
                      }
                      data-ocid="story_viewer.secondary_button"
                      className="ml-2 text-white/40 text-[10px] hover:text-white/70 inline-flex items-center gap-0.5"
                    >
                      <Reply className="w-2.5 h-2.5" /> Reply
                    </button>
                  </div>
                </div>
                {/* Replies */}
                {getReplies(c.id).map((r) => (
                  <div
                    key={r.id.toString()}
                    className="flex items-start gap-2 ml-8 mt-1"
                  >
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white"
                      style={{
                        background: "linear-gradient(135deg,#7c3aed,#2563eb)",
                      }}
                    >
                      {r.authorName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-white/80 text-[10px] font-semibold">
                        {r.authorName}
                      </span>
                      <span className="text-white/60 text-[10px] ml-1">
                        {r.text}
                      </span>
                    </div>
                  </div>
                ))}
                {/* Reply input */}
                {replyingTo === c.id && (
                  <div className="flex items-center gap-2 ml-8 mt-1.5">
                    <Input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${c.authorName}...`}
                      data-ocid="story_viewer.input"
                      className="h-7 text-xs rounded-full border-white/20 text-white placeholder:text-white/40 flex-1"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                      onKeyDown={(e) => e.key === "Enter" && handleReply()}
                    />
                    <button
                      type="button"
                      onClick={handleReply}
                      data-ocid="story_viewer.submit_button"
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg,#7c3aed,#2563eb)",
                      }}
                    >
                      <Send className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Comment input */}
        <div className="flex items-center gap-2">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Comment on ${story.authorName}'s story...`}
            data-ocid="story_viewer.comment_input"
            className="h-10 rounded-full text-sm border-white/20 text-white placeholder:text-white/40 flex-1"
            style={{ background: "rgba(255,255,255,0.08)" }}
            onKeyDown={(e) => e.key === "Enter" && handleComment()}
          />
          <button
            type="button"
            data-ocid="story_viewer.primary_button"
            onClick={handleComment}
            disabled={addComment.isPending}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#e11d48,#db2777)" }}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
