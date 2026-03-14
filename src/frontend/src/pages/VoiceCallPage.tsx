import { Mic, MicOff, Phone, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Profile } from "../backend";

interface Props {
  profile: Profile;
  onEnd: () => void;
}

export default function VoiceCallPage({ profile, onEnd }: Props) {
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between pb-16 pt-20 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg,#1a0030 0%,#0a0010 50%,#1a000f 100%)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        {["ring1", "ring2", "ring3"].map((ringId) => (
          <div
            key={ringId}
            className="absolute rounded-full"
            style={{
              width: 300 + ["ring1", "ring2", "ring3"].indexOf(ringId) * 100,
              height: 300 + ["ring1", "ring2", "ring3"].indexOf(ringId) * 100,
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              border: "1px solid oklch(0.65 0.22 10 / 0.15)",
              animation: `ping ${2 + ["ring1", "ring2", "ring3"].indexOf(ringId) * 0.5}s cubic-bezier(0,0,0.2,1) infinite`,
              animationDelay: `${["ring1", "ring2", "ring3"].indexOf(ringId) * 0.4}s`,
            }}
          />
        ))}
      </div>
      <div className="text-center z-10">
        <p className="text-white/50 text-sm mb-2">Voice Call</p>
        <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
        <p className="text-white/60 text-sm mt-1">{fmt(seconds)}</p>
      </div>
      <div className="z-10 flex flex-col items-center gap-4">
        <div
          className="w-36 h-36 rounded-full overflow-hidden flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg,#e11d48,#7c3aed)",
            padding: 4,
            boxShadow: "0 0 60px oklch(0.65 0.22 10 / 0.4)",
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
              <span className="text-5xl font-bold text-white">
                {profile.name.charAt(0)}
              </span>
            )}
          </div>
        </div>
        <p className="text-white/40 text-sm">Calling...</p>
      </div>
      <div className="z-10 flex items-center gap-6">
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          data-ocid="call.toggle"
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{
            background: muted
              ? "oklch(0.65 0.22 10 / 0.3)"
              : "oklch(0.22 0.05 300)",
          }}
        >
          {muted ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </button>
        <button
          type="button"
          onClick={onEnd}
          data-ocid="call.delete_button"
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg,#ef4444,#dc2626)",
            boxShadow: "0 4px 20px rgba(239,68,68,0.5)",
          }}
        >
          <Phone className="w-7 h-7 text-white rotate-[135deg]" />
        </button>
        <button
          type="button"
          onClick={() => setSpeaker((s) => !s)}
          data-ocid="call.toggle"
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{
            background: speaker
              ? "oklch(0.65 0.22 280 / 0.3)"
              : "oklch(0.22 0.05 300)",
          }}
        >
          <Volume2 className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}
