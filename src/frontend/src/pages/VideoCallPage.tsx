import { Camera, CameraOff, Mic, MicOff, Phone, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { Profile } from "../backend";

interface Props {
  profile: Profile;
  onEnd: () => void;
}

export default function VideoCallPage({ profile, onEnd }: Props) {
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "#0a0010" }}
    >
      {/* Remote video */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: "linear-gradient(160deg,#1a0030,#0a0010)" }}
      >
        {profile.photoUrl ? (
          <img
            src={profile.photoUrl}
            alt={profile.name}
            className="w-full h-full object-cover opacity-60"
            style={{ filter: "blur(2px)" }}
          />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center text-5xl font-bold text-white"
              style={{ background: "linear-gradient(135deg,#e11d48,#7c3aed)" }}
            >
              {profile.name.charAt(0)}
            </div>
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom,rgba(10,0,16,0.4) 0%,transparent 30%,transparent 70%,rgba(10,0,16,0.9) 100%)",
          }}
        />
      </div>

      {/* Self view */}
      <div
        className="absolute bottom-28 right-4 w-28 h-40 rounded-2xl overflow-hidden z-10"
        style={{
          border: "2px solid oklch(0.65 0.22 10 / 0.5)",
          background: "linear-gradient(135deg,#7c3aed,#2563eb)",
        }}
      >
        {camOff ? (
          <div className="w-full h-full flex items-center justify-center">
            <CameraOff className="w-8 h-8 text-white/50" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
            You
          </div>
        )}
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 pt-12 pb-4 px-5 z-10 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{profile.name}</h2>
          <p className="text-white/60 text-sm">{fmt(seconds)}</p>
        </div>
        <div
          className="px-3 py-1 rounded-full text-xs text-white/70"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
        >
          HD
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-12 pt-4 px-8 z-10 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          data-ocid="call.toggle"
          className="w-13 h-13 w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: muted
              ? "oklch(0.65 0.22 10 / 0.4)"
              : "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
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
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg,#ef4444,#dc2626)",
            boxShadow: "0 4px 20px rgba(239,68,68,0.5)",
          }}
        >
          <Phone className="w-7 h-7 text-white rotate-[135deg]" />
        </button>
        <button
          type="button"
          onClick={() => setCamOff((c) => !c)}
          data-ocid="call.toggle"
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: camOff
              ? "oklch(0.65 0.22 10 / 0.4)"
              : "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
          }}
        >
          {camOff ? (
            <CameraOff className="w-6 h-6 text-white" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </button>
        <button
          type="button"
          data-ocid="call.toggle"
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
          }}
        >
          <RefreshCw className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}
