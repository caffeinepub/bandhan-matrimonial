import { Toaster } from "@/components/ui/sonner";
import { useCallback, useEffect, useState } from "react";
import type { Profile } from "./backend";
import { CallType } from "./backend";
import { CallSignalType } from "./backend";
import BottomNav from "./components/BottomNav";
import {
  IncomingCallOverlay,
  useIncomingCallPoller,
} from "./components/IncomingCallOverlay";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useCallerProfile,
  useIsAdmin,
  useMutualMatches,
  useStoreCallSignal,
} from "./hooks/useQueries";
import AdminPage from "./pages/AdminPage";
import BrowsePage from "./pages/BrowsePage";
import CallHistoryPage from "./pages/CallHistoryPage";
import ChatPage from "./pages/ChatPage";
import ConversationPage from "./pages/ConversationPage";
import DailySuggestionsPage from "./pages/DailySuggestionsPage";
import LiveStreamListPage from "./pages/LiveStreamListPage";
import LiveStreamPage from "./pages/LiveStreamPage";
import LoginPage from "./pages/LoginPage";
import MatchesPage from "./pages/MatchesPage";
import MyProfilePage from "./pages/MyProfilePage";
import NotificationHistoryPage from "./pages/NotificationHistoryPage";
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
  | "videoCall"
  | "callHistory"
  | "notifications"
  | "liveStreamList"
  | "liveStream"
  | "dailySuggestions";

interface IncomingCallInfo {
  fromProfile: Profile;
  callType: CallType;
  offerData: string;
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [currentPage, setCurrentPage] = useState<Page>("browse");
  const [selectedMatchForChat, setSelectedMatchForChat] =
    useState<Profile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isInitiator, setIsInitiator] = useState(true);
  const [initialOfferData, setInitialOfferData] = useState<
    string | undefined
  >();
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(
    null,
  );
  const [activeLiveId, setActiveLiveId] = useState<bigint | null>(null);
  const [isLiveHost, setIsLiveHost] = useState(false);
  const [activeLiveMode, setActiveLiveMode] = useState<"video" | "audio">(
    "video",
  );

  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const { data: isAdmin } = useIsAdmin();
  const { data: mutualMatches = [] } = useMutualMatches();
  const storeSignal = useStoreCallSignal();

  const isLoggedIn = !!identity;
  const needsProfile = isLoggedIn && !profileLoading && profile === null;
  const isInCall = currentPage === "voiceCall" || currentPage === "videoCall";

  useEffect(() => {
    if (!isLoggedIn) setCurrentPage("browse");
  }, [isLoggedIn]);

  const handleIncomingCall = useCallback((info: IncomingCallInfo) => {
    setIncomingCall(info);
  }, []);

  useIncomingCallPoller({
    mutualMatches,
    onIncomingCall: handleIncomingCall,
    currentCallActive: isInCall,
  });

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    setSelectedProfile(incomingCall.fromProfile);
    setIsInitiator(false);
    setInitialOfferData(incomingCall.offerData);
    const page =
      incomingCall.callType === CallType.video ? "videoCall" : "voiceCall";
    setCurrentPage(page);
    setIncomingCall(null);
  };

  const handleDeclineCall = () => {
    if (!incomingCall) return;
    if (storeSignal) {
      storeSignal.mutate({
        toUserId: incomingCall.fromProfile.userId,
        signalType: CallSignalType.callDecline,
        callType: incomingCall.callType,
        data: "",
      });
    }
    setIncomingCall(null);
  };

  if (isInitializing || profileLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0a0010" }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{
            borderColor: "oklch(0.65 0.22 10/0.3)",
            borderTopColor: "oklch(0.65 0.22 10)",
          }}
        />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

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
          isInitiator={isInitiator}
          initialOfferData={initialOfferData}
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
          isInitiator={isInitiator}
          initialOfferData={initialOfferData}
          onEnd={() =>
            setCurrentPage(selectedMatchForChat ? "conversation" : "browse")
          }
        />
        <Toaster />
      </>
    );
  }
  if (currentPage === "callHistory") {
    return (
      <>
        <CallHistoryPage onBack={() => setCurrentPage("profile")} />
        <Toaster />
      </>
    );
  }
  if (currentPage === "notifications") {
    return (
      <>
        <NotificationHistoryPage onBack={() => setCurrentPage("browse")} />
        <Toaster />
      </>
    );
  }
  if (currentPage === "liveStreamList") {
    return (
      <>
        <LiveStreamListPage
          onBack={() => setCurrentPage("browse")}
          onJoinLive={(liveId, host, liveMode) => {
            setActiveLiveId(liveId);
            setIsLiveHost(host);
            setActiveLiveMode(liveMode ?? "video");
            setCurrentPage("liveStream");
          }}
        />
        <Toaster />
      </>
    );
  }
  if (currentPage === "liveStream" && activeLiveId !== null) {
    return (
      <>
        <LiveStreamPage
          liveId={activeLiveId}
          isHost={isLiveHost}
          liveMode={activeLiveMode}
          onBack={() => setCurrentPage("liveStreamList")}
        />
        <Toaster />
      </>
    );
  }
  if (currentPage === "dailySuggestions") {
    return (
      <>
        <DailySuggestionsPage onBack={() => setCurrentPage("browse")} />
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
          onVoiceCall={() => {
            setIsInitiator(true);
            setInitialOfferData(undefined);
            setCurrentPage("voiceCall");
          }}
          onVideoCall={() => {
            setIsInitiator(true);
            setInitialOfferData(undefined);
            setCurrentPage("videoCall");
          }}
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
            setIsInitiator(true);
            setInitialOfferData(undefined);
            setCurrentPage("voiceCall");
          }}
          onVideoCall={() => {
            setSelectedProfile(selectedMatchForChat);
            setIsInitiator(true);
            setInitialOfferData(undefined);
            setCurrentPage("videoCall");
          }}
        />
        <IncomingCallOverlay
          incomingCall={incomingCall}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
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
            onNotifications={() => setCurrentPage("notifications")}
            onGoLive={() => setCurrentPage("liveStreamList")}
          />
        )}
        {currentPage === "requests" && <RequestsPage />}
        {currentPage === "matches" && (
          <MatchesPage
            onOpenChat={(p) => {
              setSelectedMatchForChat(p);
              setCurrentPage("conversation");
            }}
            onViewProfile={(p) => {
              setSelectedProfile(p);
              setCurrentPage("viewProfile");
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
        {currentPage === "profile" && (
          <MyProfilePage
            onCallHistory={() => setCurrentPage("callHistory")}
            onGoLive={() => setCurrentPage("liveStreamList")}
            onSuggestions={() => setCurrentPage("dailySuggestions")}
          />
        )}
        {currentPage === "admin" && isAdmin && <AdminPage />}
      </main>
      <BottomNav
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isAdmin={!!isAdmin}
      />
      <IncomingCallOverlay
        incomingCall={incomingCall}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />
      <Toaster />
    </div>
  );
}
