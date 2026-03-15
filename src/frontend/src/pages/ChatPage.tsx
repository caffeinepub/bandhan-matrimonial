import { Input } from "@/components/ui/input";
import { Edit, Menu, Plus, Search } from "lucide-react";
import { useRef, useState } from "react";
import type { Profile } from "../backend";
import StoryViewerModal from "../components/StoryViewerModal";
import { useAddStory, useMutualMatches, useStories } from "../hooks/useQueries";
import { useStorageUpload } from "../hooks/useStorageUpload";

const STORY_MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface Props {
  onOpenConversation: (p: Profile) => void;
}

// Online indicator: show green dot for every 3rd profile (index % 3 === 0)
function OnlineDot({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400"
      style={{ border: "2px solid #0a0010" }}
    />
  );
}

const FAKE_TIMES = [
  "2m",
  "15m",
  "1h",
  "3h",
  "now",
  "5m",
  "30m",
  "2h",
  "4h",
  "6m",
];

export default function ChatPage({ onOpenConversation }: Props) {
  const { data: matches = [], isLoading } = useMutualMatches();
  const { data: allStories = [] } = useStories();
  const addStory = useAddStory();
  const { uploadFile, uploading, progress } = useStorageUpload();
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(
    null,
  );
  const [chatSearch, setChatSearch] = useState("");
  const storyFileRef = useRef<HTMLInputElement>(null);

  const stories = allStories.filter(
    (s) => Date.now() - Number(s.timestamp) / 1_000_000 <= STORY_MAX_AGE_MS,
  );

  const handleAddStory = () => {
    storyFileRef.current?.click();
  };

  const handleStoryFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file);
      const caption = window.prompt("Add a caption (optional):") ?? "";
      await addStory.mutateAsync({ imageUrl: url, caption });
    } catch {}
    e.target.value = "";
  };

  const filteredMatches = chatSearch.trim()
    ? matches.filter((p) =>
        p.name.toLowerCase().includes(chatSearch.toLowerCase()),
      )
    : matches;

  return (
    <div className="min-h-screen pb-4" style={{ background: "#0a0010" }}>
      <input
        ref={storyFileRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleStoryFileChange}
        data-ocid="chat.dropzone"
      />

      {/* Messenger-style Header */}
      <div
        className="flex items-center justify-between px-4 pt-12 pb-3"
        style={{ background: "#0a0010" }}
      >
        <button
          type="button"
          data-ocid="chat.button"
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.15 0.05 300)" }}
        >
          <Menu className="w-5 h-5 text-white/70" />
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight">Chats</h1>
        <button
          type="button"
          data-ocid="chat.secondary_button"
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.15 0.05 300)" }}
        >
          <Edit className="w-4 h-4 text-white/70" />
        </button>
      </div>

      {/* Pill search bar */}
      <div className="px-4 mb-4">
        <div
          className="flex items-center gap-2 h-10 rounded-full px-4"
          style={{ background: "oklch(0.16 0.05 300)" }}
        >
          <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
          <Input
            type="text"
            placeholder="Search or start new chat"
            value={chatSearch}
            onChange={(e) => setChatSearch(e.target.value)}
            data-ocid="chat.search_input"
            className="flex-1 h-8 text-sm text-white placeholder:text-white/35 bg-transparent border-none shadow-none focus-visible:ring-0 p-0"
          />
        </div>
      </div>

      {/* Active contacts row */}
      <div className="px-4 mb-5">
        <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none">
          {/* Add story button */}
          <button
            type="button"
            onClick={handleAddStory}
            data-ocid="chat.upload_button"
            className="flex flex-col items-center gap-1 flex-shrink-0"
            disabled={uploading}
          >
            <div
              className="relative w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "oklch(0.18 0.06 300)",
                border: "2px dashed oklch(0.35 0.1 300)",
              }}
            >
              {uploading ? (
                <span className="text-white/70 text-[10px] font-bold">
                  {progress}%
                </span>
              ) : (
                <Plus className="w-5 h-5 text-white/60" />
              )}
            </div>
            <span className="text-white/50 text-[10px]">
              {uploading ? "..." : "Story"}
            </span>
          </button>

          {/* Active story contacts */}
          {matches.slice(0, 10).map((profile, i) => {
            const hasStory = stories.some((s) => s.authorName === profile.name);
            const storyIdx = hasStory
              ? stories.findIndex((s) => s.authorName === profile.name)
              : -1;
            return (
              <button
                key={profile.userId.toString()}
                type="button"
                data-ocid={`chat.item.${i + 1}`}
                className="flex flex-col items-center gap-1 flex-shrink-0"
                onClick={() =>
                  hasStory && storyIdx >= 0
                    ? setViewingStoryIndex(storyIdx)
                    : onOpenConversation(profile)
                }
              >
                <div className="relative" style={{ width: 56, height: 56 }}>
                  {hasStory && (
                    <svg
                      width={56}
                      height={56}
                      viewBox="0 0 56 56"
                      style={{ position: "absolute", top: 0, left: 0 }}
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient
                          id={`cg${i}`}
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#e11d48" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx={28}
                        cy={28}
                        r={25}
                        fill="none"
                        stroke={`url(#cg${i})`}
                        strokeWidth={2.5}
                      />
                    </svg>
                  )}
                  <div
                    className="absolute rounded-full overflow-hidden"
                    style={{
                      inset: hasStory ? 4 : 2,
                      background: "linear-gradient(135deg,#e11d48,#7c3aed)",
                    }}
                  >
                    {profile.photoUrl ? (
                      <img
                        src={profile.photoUrl}
                        alt={profile.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold">
                        {profile.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  {/* Online dot */}
                  {i % 3 === 0 && (
                    <span
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400"
                      style={{ border: "2px solid #0a0010" }}
                    />
                  )}
                </div>
                <span className="text-white/60 text-[10px] w-14 text-center truncate">
                  {profile.name.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div
        className="mx-4 mb-3"
        style={{ height: 1, background: "oklch(0.2 0.05 300)" }}
      />

      {/* Chat list */}
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
      {!isLoading && matches.length > 0 && filteredMatches.length === 0 && (
        <div className="text-center py-8" data-ocid="chat.empty_state">
          <p className="text-white/40 text-sm">
            No matches found for "{chatSearch}"
          </p>
        </div>
      )}

      <div className="space-y-0">
        {filteredMatches.map((profile, i) => (
          <button
            key={profile.userId.toString()}
            type="button"
            onClick={() => onOpenConversation(profile)}
            data-ocid={`chat.item.${i + 1}`}
            className="w-full flex items-center gap-3 px-4 py-3 transition-all active:bg-white/5"
          >
            <div className="relative flex-shrink-0">
              <div
                className="w-14 h-14 rounded-full overflow-hidden"
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
              <OnlineDot show={i % 3 === 0} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-white font-semibold text-sm">{profile.name}</p>
              <p className="text-white/40 text-xs truncate">
                {profile.bio || "Tap to start chatting"}
              </p>
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
              <span className="text-white/35 text-[10px]">
                {FAKE_TIMES[i % FAKE_TIMES.length]}
              </span>
              {i % 2 === 0 && (
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
                  }}
                />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Story viewer */}
      {viewingStoryIndex !== null && (
        <StoryViewerModal
          stories={stories}
          initialIndex={viewingStoryIndex}
          onClose={() => setViewingStoryIndex(null)}
        />
      )}
    </div>
  );
}
