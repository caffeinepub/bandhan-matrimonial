import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import type { Profile } from "./backend";
import BottomNav from "./components/BottomNav";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useCallerProfile, useIsAdmin } from "./hooks/useQueries";
import AdminPage from "./pages/AdminPage";
import BrowsePage from "./pages/BrowsePage";
import ChatPage from "./pages/ChatPage";
import ConversationPage from "./pages/ConversationPage";
import LoginPage from "./pages/LoginPage";
import MatchesPage from "./pages/MatchesPage";
import MyProfilePage from "./pages/MyProfilePage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import RequestsPage from "./pages/RequestsPage";
import VideoCallPage from "./pages/VideoCallPage";
import ViewProfilePage from "./pages/ViewProfilePage";
import VoiceCallPage from "./pages/VoiceCallPage";

export type Page =
  | "browse"
  | "requests"
  | "matches"
  | "chat"
  | "conversation"
  | "profile"
  | "admin"
  | "viewProfile"
  | "voiceCall"
  | "videoCall";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [currentPage, setCurrentPage] = useState<Page>("browse");
  const [selectedMatchForChat, setSelectedMatchForChat] =
    useState<Profile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const { data: isAdmin } = useIsAdmin();

  const isLoggedIn = !!identity;
  const needsProfile = isLoggedIn && !profileLoading && profile === null;

  useEffect(() => {
    if (!isLoggedIn) setCurrentPage("browse");
  }, [isLoggedIn]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4" data-ocid="app.loading_state">
          <div className="relative w-16 h-16 mx-auto">
            <div
              className="w-16 h-16 rounded-full border-2 animate-spin"
              style={{
                borderColor: "oklch(0.65 0.22 10 / 0.3)",
                borderTopColor: "oklch(0.65 0.22 10)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">💍</span>
            </div>
          </div>
          <p className="text-muted-foreground font-body text-sm">
            Loading Bandhan...
          </p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn)
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  if (needsProfile)
    return (
      <>
        <ProfileSetupPage onComplete={() => setCurrentPage("browse")} />
        <Toaster />
      </>
    );

  if (currentPage === "voiceCall" && selectedProfile) {
    return (
      <>
        <VoiceCallPage
          profile={selectedProfile}
          onEnd={() =>
            setCurrentPage(selectedMatchForChat ? "conversation" : "browse")
          }
        />
        <Toaster />
      </>
    );
  }
  if (currentPage === "videoCall" && selectedProfile) {
    return (
      <>
        <VideoCallPage
          profile={selectedProfile}
          onEnd={() =>
            setCurrentPage(selectedMatchForChat ? "conversation" : "browse")
          }
        />
        <Toaster />
      </>
    );
  }
  if (currentPage === "viewProfile" && selectedProfile) {
    return (
      <>
        <ViewProfilePage
          profile={selectedProfile}
          onBack={() => setCurrentPage("browse")}
          onChat={() => {
            setSelectedMatchForChat(selectedProfile);
            setCurrentPage("conversation");
          }}
          onVoiceCall={() => setCurrentPage("voiceCall")}
          onVideoCall={() => setCurrentPage("videoCall")}
        />
        <Toaster />
      </>
    );
  }
  if (currentPage === "conversation" && selectedMatchForChat) {
    return (
      <div className="min-h-screen bg-background">
        <ConversationPage
          profile={selectedMatchForChat}
          onBack={() => setCurrentPage("chat")}
          onVoiceCall={() => {
            setSelectedProfile(selectedMatchForChat);
            setCurrentPage("voiceCall");
          }}
          onVideoCall={() => {
            setSelectedProfile(selectedMatchForChat);
            setCurrentPage("videoCall");
          }}
        />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-20">
        {currentPage === "browse" && (
          <BrowsePage
            onViewProfile={(p) => {
              setSelectedProfile(p);
              setCurrentPage("viewProfile");
            }}
          />
        )}
        {currentPage === "requests" && <RequestsPage />}
        {currentPage === "matches" && (
          <MatchesPage
            onOpenChat={(p) => {
              setSelectedMatchForChat(p);
              setCurrentPage("conversation");
            }}
          />
        )}
        {currentPage === "chat" && (
          <ChatPage
            onOpenConversation={(p) => {
              setSelectedMatchForChat(p);
              setCurrentPage("conversation");
            }}
          />
        )}
        {currentPage === "profile" && <MyProfilePage />}
        {currentPage === "admin" && isAdmin && <AdminPage />}
      </main>
      <BottomNav
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isAdmin={!!isAdmin}
      />
      <Toaster />
    </div>
  );
}
