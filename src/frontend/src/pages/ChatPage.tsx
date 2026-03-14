import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Profile, Story } from "../backend";
import { useAddStory, useMutualMatches, useStories } from "../hooks/useQueries";

interface Props {
  onOpenConversation: (p: Profile) => void;
}

export default function ChatPage({ onOpenConversation }: Props) {
  const { data: matches = [], isLoading } = useMutualMatches();
  const { data: stories = [] } = useStories();
  const addStory = useAddStory();
  const [viewingStory, setViewingStory] = useState<Story | null>(null);

  const handleAddStory = async () => {
    const url = prompt("Enter image URL for your story:");
    if (!url) return;
    const caption = prompt("Add a caption (optional):") ?? "";
    try {
      await addStory.mutateAsync({ imageUrl: url, caption });
      toast.success("Story added!");
    } catch {
      toast.error("Failed to add story");
    }
  };

  return (
    <div className="min-h-screen pt-14 pb-4" style={{ background: "#0a0010" }}>
      <div className="px-5 py-4">
        <h1 className="text-2xl font-bold text-white">Messages</h1>
      </div>

      {/* Stories */}
      <div className="px-5 mb-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={handleAddStory}
            data-ocid="chat.primary_button"
            className="flex-shrink-0 flex flex-col items-center gap-1"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "oklch(0.18 0.06 300)",
                border: "2px dashed oklch(0.35 0.1 300)",
              }}
            >
              <Plus className="w-6 h-6 text-white/60" />
            </div>
            <span className="text-white/50 text-[10px]">Add Story</span>
          </button>
          {stories.map((story) => (
            <button
              key={story.id.toString()}
              type="button"
              onClick={() => setViewingStory(story)}
              data-ocid="chat.secondary_button"
              className="flex-shrink-0 flex flex-col items-center gap-1"
            >
              <div
                className="w-14 h-14 rounded-full overflow-hidden p-0.5"
                style={{
                  background: "linear-gradient(135deg,#e11d48,#7c3aed)",
                }}
              >
                <div
                  className="w-full h-full rounded-full overflow-hidden"
                  style={{ background: "#1a0a1e" }}
                >
                  {story.authorPhoto ? (
                    <img
                      src={story.authorPhoto}
                      alt={story.authorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                      {story.authorName.charAt(0)}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-white/60 text-[10px] max-w-[56px] truncate">
                {story.authorName}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chats */}
      {isLoading && (
        <div
          className="flex justify-center py-8"
          data-ocid="chat.loading_state"
        >
          <div
            className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{
              borderColor: "oklch(0.65 0.22 10/0.3)",
              borderTopColor: "oklch(0.65 0.22 10)",
            }}
          />
        </div>
      )}
      {!isLoading && matches.length === 0 && (
        <div className="text-center py-16" data-ocid="chat.empty_state">
          <p className="text-5xl mb-4">💬</p>
          <p className="text-white/60">No conversations yet</p>
          <p className="text-white/40 text-sm mt-1">
            Match with someone to start chatting!
          </p>
        </div>
      )}
      <div className="px-5 space-y-1">
        {matches.map((profile, i) => (
          <button
            key={profile.userId.toString()}
            type="button"
            onClick={() => onOpenConversation(profile)}
            data-ocid={`chat.item.${i + 1}`}
            className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-[0.98]"
            style={{ background: "oklch(0.13 0.05 300)" }}
          >
            <div
              className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg,#e11d48,#7c3aed)",
                padding: 2,
              }}
            >
              <div
                className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: "#1a0a1e" }}
              >
                {profile.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-xl">
                    {profile.name.charAt(0)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-white font-semibold text-sm">{profile.name}</p>
              <p className="text-white/40 text-xs truncate">
                {profile.bio || "Tap to start chatting"}
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <div
                className="w-2 h-2 rounded-full ml-auto"
                style={{
                  background: "linear-gradient(135deg,#e11d48,#7c3aed)",
                }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Story viewer */}
      {viewingStory && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: "rgba(0,0,0,0.95)" }}
          data-ocid="chat.modal"
        >
          <button
            type="button"
            onClick={() => setViewingStory(null)}
            data-ocid="chat.close_button"
            className="absolute top-12 right-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            ✕
          </button>
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={viewingStory.imageUrl}
              alt=""
              className="max-w-full max-h-[70vh] rounded-2xl object-contain"
            />
          </div>
          <div className="px-5 pb-12">
            <p className="text-white font-semibold">
              {viewingStory.authorName}
            </p>
            {viewingStory.caption && (
              <p className="text-white/70 text-sm mt-1">
                {viewingStory.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
