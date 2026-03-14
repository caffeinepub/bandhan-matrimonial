import { Heart, Home, MessageCircle, Shield, User, Users } from "lucide-react";
import type { Page } from "../App";

interface BottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isAdmin: boolean;
}

export default function BottomNav({
  currentPage,
  onNavigate,
  isAdmin,
}: BottomNavProps) {
  const navItems = [
    { id: "browse" as Page, icon: Home, label: "Home" },
    { id: "requests" as Page, icon: Heart, label: "Requests" },
    { id: "matches" as Page, icon: Users, label: "Matches" },
    { id: "chat" as Page, icon: MessageCircle, label: "Chats" },
    { id: "profile" as Page, icon: User, label: "Profile" },
    ...(isAdmin ? [{ id: "admin" as Page, icon: Shield, label: "Admin" }] : []),
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "oklch(0.1 0.05 330 / 0.97)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid oklch(0.26 0.07 330 / 0.4)",
      }}
    >
      <div className="flex items-center justify-around px-1 py-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              type="button"
              key={item.id}
              data-ocid={`nav.${item.id}.link`}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[48px] relative"
            >
              {isActive && (
                <span
                  className="absolute inset-0 rounded-xl opacity-15"
                  style={{
                    background:
                      "linear-gradient(135deg, #f43f5e, #ec4899, #a855f7)",
                  }}
                />
              )}
              <Icon
                className={`w-5 h-5 relative z-10 transition-all duration-200 ${isActive ? "stroke-[2.2]" : "stroke-[1.6]"}`}
                style={
                  isActive
                    ? { color: "#f43f5e" }
                    : { color: "oklch(0.45 0.04 330)" }
                }
              />
              <span
                className="text-[9px] font-body font-medium leading-none relative z-10 transition-all duration-200"
                style={
                  isActive
                    ? { color: "#f43f5e" }
                    : { color: "oklch(0.45 0.04 330)" }
                }
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
