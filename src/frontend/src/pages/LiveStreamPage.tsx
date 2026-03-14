import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Mic, MicOff, Send, Settings, Users, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  LiveMessage,
  LiveReaction,
  LiveStream,
  Profile,
} from "../backend";
import { useActor } from "../hooks/useActor";
import { useCallerProfile } from "../hooks/useQueries";

interface LiveStreamPageProps {
  liveId: bigint;
  isHost: boolean;
  onBack: () => void;
}

const REACTION_EMOJIS = ["❤️", "🔥", "😂", "😮", "😢", "👏"];

const CSS_FILTERS: Array<{ label: string; value: string }> = [
  { label: "Normal", value: "none" },
  { label: "Warm", value: "sepia(0.4) saturate(1.3) hue-rotate(-15deg)" },
  { label: "Cool", value: "saturate(0.9) hue-rotate(30deg) brightness(1.05)" },
  { label: "Vintage", value: "sepia(0.6) contrast(1.1) brightness(0.9)" },
  { label: "B&W", value: "grayscale(1) contrast(1.1)" },
];

interface FloatingReaction {
  id: number;
  emoji: string;
  x: number;
}

export default function LiveStreamPage({
  liveId,
  isHost,
  onBack,
}: LiveStreamPageProps) {
  const { actor } = useActor();
  const { data: myProfile } = useCallerProfile();

  const [liveInfo, setLiveInfo] = useState<LiveStream | null>(null);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [viewers, setViewers] = useState<Profile[]>([]);
  const [reactions, setReactions] = useState<LiveReaction[]>([]);
  const [floatingReactions, setFloatingReactions] = useState<
    FloatingReaction[]
  >([]);
  const [msgText, setMsgText] = useState("");
  const [muted, setMuted] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(0);
  const [matchesOnly, setMatchesOnly] = useState(false);
  const [ending, setEnding] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const reactionCounter = useRef(0);

  const fetchData = useCallback(async () => {
    if (!actor) return;
    try {
      const [msgs, reacts, vwrs, allLives] = await Promise.all([
        actor.getLiveMessages(liveId),
        actor.getLiveReactions(liveId),
        actor.getLiveViewers(liveId),
        actor.getActiveLives(),
      ]);
      setMessages(msgs);
      setReactions(reacts);
      setViewers(vwrs);
      const info = allLives.find((l) => l.id === liveId);
      if (info) {
        setLiveInfo(info);
        setMatchesOnly(info.matchesOnly);
      }
    } catch {}
  }, [actor, liveId]);

  useEffect(() => {
    if (!actor) return;
    actor.joinLive(liveId).catch(() => {});
    fetchData();
    const msgInterval = setInterval(async () => {
      if (!actor) return;
      const [msgs, reacts] = await Promise.all([
        actor.getLiveMessages(liveId).catch(() => [] as LiveMessage[]),
        actor.getLiveReactions(liveId).catch(() => [] as LiveReaction[]),
      ]);
      setMessages(msgs);
      setReactions(reacts);
    }, 2000);
    const viewerInterval = setInterval(async () => {
      if (!actor) return;
      const vwrs = await actor
        .getLiveViewers(liveId)
        .catch(() => [] as Profile[]);
      setViewers(vwrs);
    }, 5000);
    return () => {
      clearInterval(msgInterval);
      clearInterval(viewerInterval);
    };
  }, [actor, liveId, fetchData]);

  // Scroll to bottom on new messages
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message update
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!actor || !msgText.trim()) return;
    const text = msgText.trim();
    setMsgText("");
    try {
      await actor.sendLiveMessage(liveId, text);
    } catch {}
  };

  const sendReaction = async (emoji: string) => {
    if (!actor) return;
    reactionCounter.current += 1;
    const id = reactionCounter.current;
    setFloatingReactions((prev) => [
      ...prev,
      { id, emoji, x: 30 + Math.random() * 40 },
    ]);
    setTimeout(
      () => setFloatingReactions((prev) => prev.filter((r) => r.id !== id)),
      2500,
    );
    try {
      await actor.addLiveReaction(liveId, emoji);
    } catch {}
  };

  const handleEndLive = async () => {
    if (!actor || ending) return;
    setEnding(true);
    try {
      await actor.endLive(liveId);
    } catch {}
    onBack();
  };

  const handleLeave = async () => {
    if (!actor) return;
    try {
      await actor.leaveLive(liveId);
    } catch {}
    onBack();
  };

  const handleBlockViewer = async (
    userId: import("../backend").Profile["userId"],
  ) => {
    if (!actor) return;
    try {
      await actor.blockFromLive(liveId, userId);
      setViewers((prev) =>
        prev.filter((v) => v.userId.toString() !== userId.toString()),
      );
    } catch {}
  };

  const handleFilterChange = async (idx: number) => {
    setSelectedFilter(idx);
    if (!actor || !isHost) return;
    try {
      await actor.setLiveFilter(liveId, { __kind__: "all", all: null });
    } catch {}
  };

  const handleMatchesOnlyToggle = async (val: boolean) => {
    setMatchesOnly(val);
    if (!actor || !isHost) return;
    try {
      await actor.setLiveFilter(liveId, { __kind__: "all", all: null });
    } catch {}
  };

  // Group reactions by emoji for display
  const reactionCounts = reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  const hostPhoto = liveInfo?.hostPhoto;
  const hostName = liveInfo?.hostName ?? "Host";
  const title = liveInfo?.title ?? "Live Stream";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: "#050008" }}
    >
      {/* Host image with filter */}
      <div className="absolute inset-0">
        {hostPhoto ? (
          <img
            src={hostPhoto}
            alt={hostName}
            className="w-full h-full object-cover"
            style={{ filter: CSS_FILTERS[selectedFilter].value }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: "linear-gradient(135deg,#1a0030,#300060,#180030)",
              filter: CSS_FILTERS[selectedFilter].value,
            }}
          />
        )}
        {/* Dark overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.7) 100%)",
          }}
        />
        {/* Pulse rings around host avatar */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div
              className="w-32 h-32 rounded-full animate-ping opacity-20"
              style={{ background: "linear-gradient(135deg,#e11d48,#7c3aed)" }}
            />
            <div
              className="absolute inset-3 w-26 h-26 rounded-full animate-ping opacity-15"
              style={{
                background: "linear-gradient(135deg,#e11d48,#7c3aed)",
                animationDelay: "0.5s",
              }}
            />
            <div className="absolute inset-8 flex items-center justify-center">
              <Avatar className="w-16 h-16 border-2 border-white/40">
                <AvatarImage src={hostPhoto} />
                <AvatarFallback
                  className="text-2xl"
                  style={{
                    background: "linear-gradient(135deg,#e11d48,#7c3aed)",
                  }}
                >
                  {hostName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center gap-2 px-4 pt-safe pt-4 pb-2">
        {/* LIVE badge */}
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{ background: "#e11d48" }}
        >
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-white text-xs font-bold">LIVE</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{title}</p>
          <p className="text-white/60 text-xs">{hostName}</p>
        </div>
        {/* Viewer count */}
        <button
          type="button"
          data-ocid="live_stream.viewers_button"
          onClick={() => setShowViewers(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <Users className="w-3.5 h-3.5 text-white" />
          <span className="text-white text-xs font-semibold">
            {viewers.length}
          </span>
        </button>
        {/* Host controls */}
        {isHost && (
          <>
            <button
              type="button"
              data-ocid="live_stream.toggle"
              onClick={() => setMuted((m) => !m)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{
                background: muted ? "#e11d48" : "rgba(255,255,255,0.15)",
              }}
            >
              {muted ? (
                <MicOff className="w-4 h-4 text-white" />
              ) : (
                <Mic className="w-4 h-4 text-white" />
              )}
            </button>
            <button
              type="button"
              data-ocid="live_stream.secondary_button"
              onClick={() => setShowSettings(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <Settings className="w-4 h-4 text-white" />
            </button>
          </>
        )}
        {/* End / Leave */}
        {isHost ? (
          <button
            type="button"
            data-ocid="live_stream.delete_button"
            onClick={handleEndLive}
            disabled={ending}
            className="px-3 py-1.5 rounded-full text-xs font-bold text-white transition-all"
            style={{ background: "#e11d48" }}
          >
            End
          </button>
        ) : (
          <button
            type="button"
            data-ocid="live_stream.close_button"
            onClick={handleLeave}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* CSS filter selector (host only) */}
      {isHost && (
        <div
          className="relative z-10 flex items-center gap-2 px-4 py-1 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {CSS_FILTERS.map((f, i) => (
            <button
              key={f.label}
              type="button"
              data-ocid={`live_stream.tab.${i + 1}`}
              onClick={() => handleFilterChange(i)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background:
                  selectedFilter === i
                    ? "linear-gradient(135deg,#e11d48,#7c3aed)"
                    : "rgba(255,255,255,0.12)",
                color: "white",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Floating reactions */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-48 text-2xl animate-bounce"
            style={{
              left: `${r.x}%`,
              animation: "floatUp 2.5s ease-out forwards",
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Reaction counts display */}
      {Object.keys(reactionCounts).length > 0 && (
        <div className="absolute right-4 top-1/3 z-10 flex flex-col gap-2 pointer-events-none">
          {Object.entries(reactionCounts).map(([emoji, count]) => (
            <div
              key={emoji}
              className="flex items-center gap-1 px-2 py-1 rounded-full"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              <span className="text-base">{emoji}</span>
              <span className="text-white text-xs font-bold">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom area: chat + reactions */}
      <div className="relative z-10 mt-auto px-3 pb-5 flex flex-col gap-2">
        {/* Chat messages */}
        <div
          className="max-h-48 overflow-y-auto space-y-1.5 px-1"
          style={{ scrollbarWidth: "none" }}
        >
          {messages.map((msg) => (
            <div key={msg.id.toString()} className="flex items-end gap-2">
              <div
                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                style={{
                  background: "linear-gradient(135deg,#e11d48,#7c3aed)",
                }}
              >
                {msg.userName.charAt(0)}
              </div>
              <div
                className="px-3 py-1.5 rounded-2xl rounded-bl-sm max-w-[75%]"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <span className="text-pink-400 text-[10px] font-semibold mr-1.5">
                  {msg.userName}
                </span>
                <span className="text-white/90 text-xs">{msg.text}</span>
              </div>
            </div>
          ))}
          <div ref={msgEndRef} />
        </div>

        {/* Emoji reactions row */}
        <div
          className="flex items-center gap-2 overflow-x-auto pb-0.5"
          style={{ scrollbarWidth: "none" }}
        >
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              data-ocid="live_stream.toggle"
              onClick={() => sendReaction(emoji)}
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all active:scale-90"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Text input */}
        <div className="flex items-center gap-2">
          <Input
            data-ocid="live_stream.input"
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            placeholder="Say something..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 h-10 rounded-full border-white/15 text-white placeholder:text-white/30 text-sm"
            style={{ background: "rgba(255,255,255,0.1)" }}
          />
          <button
            type="button"
            data-ocid="live_stream.submit_button"
            onClick={sendMessage}
            disabled={!msgText.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{ background: "linear-gradient(135deg,#e11d48,#7c3aed)" }}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Viewers Sheet */}
      <Sheet open={showViewers} onOpenChange={setShowViewers}>
        <SheetContent
          side="bottom"
          data-ocid="live_stream.sheet"
          className="rounded-t-3xl border-0 pb-10"
          style={{
            background: "oklch(0.11 0.05 300)",
            borderTop: "1px solid oklch(0.22 0.07 300)",
          }}
        >
          <SheetHeader className="px-6 pt-2 mb-4">
            <SheetTitle className="text-white font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-400" /> Viewers (
              {viewers.length})
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 space-y-2 max-h-64 overflow-y-auto">
            {viewers.length === 0 ? (
              <p
                className="text-white/40 text-sm text-center py-6"
                data-ocid="live_stream.empty_state"
              >
                No viewers yet
              </p>
            ) : (
              viewers.map((v, idx) => (
                <div
                  key={v.userId.toString()}
                  data-ocid={`live_stream.item.${idx + 1}`}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "oklch(0.14 0.05 300)" }}
                >
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={v.photoUrl} />
                    <AvatarFallback
                      style={{
                        background: "linear-gradient(135deg,#e11d48,#7c3aed)",
                      }}
                      className="text-white"
                    >
                      {v.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {v.name}
                    </p>
                    <p className="text-white/40 text-xs">{v.location}</p>
                  </div>
                  {isHost &&
                    v.userId.toString() !== myProfile?.userId.toString() && (
                      <button
                        type="button"
                        data-ocid={`live_stream.delete_button.${idx + 1}`}
                        onClick={() => handleBlockViewer(v.userId)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium text-red-400 transition-colors"
                        style={{ background: "rgba(225,29,72,0.15)" }}
                      >
                        Remove
                      </button>
                    )}
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Settings Sheet (host only) */}
      {isHost && (
        <Sheet open={showSettings} onOpenChange={setShowSettings}>
          <SheetContent
            side="bottom"
            data-ocid="live_stream.modal"
            className="rounded-t-3xl border-0 pb-10"
            style={{
              background: "oklch(0.11 0.05 300)",
              borderTop: "1px solid oklch(0.22 0.07 300)",
            }}
          >
            <SheetHeader className="px-6 pt-2 mb-6">
              <SheetTitle className="text-white font-bold">
                Stream Settings
              </SheetTitle>
            </SheetHeader>
            <div className="px-6 space-y-4">
              <div
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: "oklch(0.14 0.05 300)" }}
              >
                <div>
                  <p className="text-white text-sm font-medium">Matches Only</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    Restrict to your matches
                  </p>
                </div>
                <Switch
                  data-ocid="live_stream.switch"
                  checked={matchesOnly}
                  onCheckedChange={handleMatchesOnlyToggle}
                />
              </div>
              <p className="text-white/40 text-xs text-center">
                Visual filters can be changed from the top filter bar
              </p>
            </div>
          </SheetContent>
        </Sheet>
      )}

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-200px) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
