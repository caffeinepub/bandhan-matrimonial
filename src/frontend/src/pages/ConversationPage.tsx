import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, Phone, Send, Video } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Profile } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useMarkMessageRead,
  useMessages,
  useSendMessage,
  useSetTyping,
  useTypingStatus,
} from "../hooks/useQueries";

interface Props {
  profile: Profile;
  onBack: () => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
}

export default function ConversationPage({
  profile,
  onBack,
  onVoiceCall,
  onVideoCall,
}: Props) {
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString();
  const { data: messages = [] } = useMessages(profile.userId, true);
  const sendMessage = useSendMessage();
  const markRead = useMarkMessageRead();
  const setTypingMutation = useSetTyping();
  const { data: isTyping } = useTypingStatus(profile.userId);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markedReadRef = useRef<Set<string>>(new Set());

  // biome-ignore lint/correctness/useExhaustiveDependencies: ref scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark incoming messages as read
  useEffect(() => {
    for (const msg of messages) {
      const key = msg.id.toString();
      if (
        msg.toUserId.toString() === myPrincipal &&
        !msg.read &&
        !markedReadRef.current.has(key)
      ) {
        markedReadRef.current.add(key);
        markRead.mutate(msg.id);
      }
    }
  }, [messages, myPrincipal, markRead]);

  const handleTyping = useCallback(
    (val: string) => {
      setInputValue(val);
      setTypingMutation.mutate({ toUserId: profile.userId, isTyping: true });
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setTypingMutation.mutate({ toUserId: profile.userId, isTyping: false });
      }, 3000);
    },
    [profile.userId, setTypingMutation],
  );

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue("");
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setTypingMutation.mutate({ toUserId: profile.userId, isTyping: false });
    try {
      await sendMessage.mutateAsync({ toUserId: profile.userId, text });
    } catch {
      toast.error("Failed to send message");
    }
  };

  return (
    <div
      className="flex flex-col h-screen"
      style={{ background: "oklch(0.08 0.03 300)" }}
    >
      <div
        className="flex items-center gap-3 px-4 pt-12 pb-4 flex-shrink-0"
        style={{
          background:
            "linear-gradient(180deg,oklch(0.14 0.07 340) 0%,oklch(0.1 0.04 320) 100%)",
          borderBottom: "1px solid oklch(0.22 0.06 330 / 0.5)",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          data-ocid="conversation.button"
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.2 0.06 330)" }}
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div className="flex-1 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg,#e11d48,#7c3aed)",
              padding: 2,
            }}
          >
            <div
              className="w-full h-full rounded-full overflow-hidden"
              style={{ background: "#1a0a1e" }}
            >
              {profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                  {profile.name.charAt(0)}
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{profile.name}</p>
            <p className="text-[10px] text-green-400">
              {isTyping ? "typing..." : "Online"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onVoiceCall}
            data-ocid="conversation.secondary_button"
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: "oklch(0.65 0.22 10 / 0.2)",
              border: "1px solid oklch(0.65 0.22 10 / 0.4)",
            }}
          >
            <Phone
              className="w-4 h-4"
              style={{ color: "oklch(0.75 0.18 10)" }}
            />
          </button>
          <button
            type="button"
            onClick={onVideoCall}
            data-ocid="conversation.secondary_button"
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: "oklch(0.55 0.22 280 / 0.2)",
              border: "1px solid oklch(0.55 0.22 280 / 0.4)",
            }}
          >
            <Video
              className="w-4 h-4"
              style={{ color: "oklch(0.75 0.18 280)" }}
            />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div
            className="text-center py-12"
            data-ocid="conversation.empty_state"
          >
            <p className="text-4xl mb-3">💬</p>
            <p className="text-white/50 text-sm">
              Start a conversation with {profile.name}
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.fromUserId.toString() === myPrincipal;
          const time = new Date(
            Number(msg.timestamp) / 1_000_000,
          ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          return (
            <div
              key={msg.id.toString()}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[75%]">
                {!isMine && (
                  <div
                    className="w-6 h-6 rounded-full overflow-hidden mb-1 flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg,#e11d48,#7c3aed)",
                    }}
                  >
                    {profile.photoUrl ? (
                      <img
                        src={profile.photoUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-bold">
                        {profile.name.charAt(0)}
                      </span>
                    )}
                  </div>
                )}
                <div
                  className="px-4 py-2.5 rounded-2xl text-sm"
                  style={
                    isMine
                      ? {
                          background: "linear-gradient(135deg,#e11d48,#7c3aed)",
                          color: "white",
                        }
                      : { background: "oklch(0.18 0.05 320)", color: "white" }
                  }
                >
                  {msg.text}
                </div>
                <div
                  className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <p className="text-[10px] text-white/40">{time}</p>
                  {isMine && (
                    <span
                      className="flex items-center"
                      title={msg.read ? "Read" : "Sent"}
                    >
                      {msg.read ? (
                        <span className="flex" style={{ color: "#3b82f6" }}>
                          <Check className="w-3 h-3" />
                          <Check className="w-3 h-3 -ml-1.5" />
                        </span>
                      ) : (
                        <Check className="w-3 h-3 text-white/30" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div
              className="px-4 py-3 rounded-2xl flex gap-1 items-center"
              style={{ background: "oklch(0.18 0.05 320)" }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: "oklch(0.65 0.22 10)",
                    animation: `bounce 1s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
        style={{
          borderTop: "1px solid oklch(0.22 0.06 330 / 0.5)",
          background: "oklch(0.1 0.04 320)",
        }}
      >
        <Input
          value={inputValue}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          data-ocid="conversation.input"
          className="flex-1 h-11 rounded-2xl text-sm"
          style={{
            background: "oklch(0.16 0.05 320)",
            border: "1px solid oklch(0.26 0.07 330)",
            color: "white",
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sendMessage.isPending}
          data-ocid="conversation.submit_button"
          className="w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg,#e11d48,#7c3aed)" }}
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
