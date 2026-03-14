import { Input } from "@/components/ui/input";
import { Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface StoryViewerModalProps {
  name: string;
  gradient: string;
  emoji: string;
  onClose: () => void;
}

export default function StoryViewerModal({
  name,
  gradient,
  emoji,
  onClose,
}: StoryViewerModalProps) {
  const [progress, setProgress] = useState(0);
  const [comment, setComment] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          onClose();
          return 100;
        }
        return p + 1;
      });
    }, 50);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.08 0.06 320) 0%, oklch(0.12 0.05 340) 100%)",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-1 z-10">
        <div
          className="h-full"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #f43f5e, #ec4899, #a855f7)",
          }}
        />
      </div>
      <div className="flex items-center justify-between px-5 pt-8 pb-4 z-10">
        <div className="flex items-center gap-3">
          <div className="story-ring">
            <div className="story-ring-inner p-0.5">
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
              >
                <span className="text-lg">{emoji}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="font-body font-semibold text-white text-sm">{name}</p>
            <p className="text-white/60 text-[10px] font-body">Just now</p>
          </div>
        </div>
        <button
          type="button"
          data-ocid="story_viewer.close_button"
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.2 0.06 330 / 0.7)" }}
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        <div
          className={`w-full max-w-sm aspect-[9/16] rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-2xl`}
          style={{ maxHeight: "60vh" }}
        >
          <div className="text-center">
            <span className="text-8xl">{emoji}</span>
            <p className="font-display text-white text-2xl font-bold mt-4">
              {name}'s Story
            </p>
            <p className="text-white/70 font-body text-sm mt-2">
              Living my best life ✨
            </p>
          </div>
        </div>
      </div>
      <div className="px-5 pb-8 pt-4 flex items-center gap-3 z-10">
        <div className="flex-1">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Reply to ${name}...`}
            data-ocid="story_viewer.comment_input"
            className="h-12 rounded-full font-body text-sm border-white/20 text-white placeholder:text-white/40"
            style={{
              background: "oklch(0.18 0.06 330 / 0.6)",
              backdropFilter: "blur(8px)",
            }}
            onKeyDown={(e) => e.key === "Enter" && setComment("")}
          />
        </div>
        <button
          type="button"
          data-ocid="story_viewer.submit_button"
          onClick={() => setComment("")}
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #e11d48, #db2777)" }}
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
