import { Plus } from "lucide-react";
import { useState } from "react";
import StoryViewerModal from "./StoryViewerModal";

const STORIES = [
  { name: "Priya", emoji: "🌸", gradient: "from-rose-500 to-pink-400" },
  { name: "Anjali", emoji: "💫", gradient: "from-purple-600 to-pink-500" },
  { name: "Sneha", emoji: "🌺", gradient: "from-pink-500 to-red-400" },
  { name: "Riya", emoji: "✨", gradient: "from-fuchsia-600 to-purple-500" },
  { name: "Meera", emoji: "🌹", gradient: "from-red-500 to-rose-400" },
];

export default function StoriesRow() {
  const [viewing, setViewing] = useState<(typeof STORIES)[0] | null>(null);

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar px-5">
        <button
          type="button"
          data-ocid="stories.add_button"
          className="flex flex-col items-center gap-1.5 flex-shrink-0"
          onClick={() => {}}
        >
          <div className="story-ring">
            <div className="story-ring-inner p-0.5">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "oklch(0.2 0.06 330)" }}
              >
                <Plus className="w-6 h-6" style={{ color: "#f43f5e" }} />
              </div>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground font-body w-14 text-center">
            Add Story
          </span>
        </button>
        {STORIES.map((s, i) => (
          <button
            key={s.name}
            type="button"
            data-ocid={`stories.item.${i + 1}`}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
            onClick={() => setViewing(s)}
          >
            <div className="story-ring">
              <div className="story-ring-inner p-0.5">
                <div
                  className={`w-14 h-14 rounded-full bg-gradient-to-br ${s.gradient} flex items-center justify-center`}
                >
                  <span className="text-2xl">{s.emoji}</span>
                </div>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground font-body w-14 text-center truncate">
              {s.name}
            </span>
          </button>
        ))}
      </div>
      {viewing && (
        <StoryViewerModal
          name={viewing.name}
          gradient={viewing.gradient}
          emoji={viewing.emoji}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
}
