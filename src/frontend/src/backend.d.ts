import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface SuperLikeNotification {
    fromProfile: Profile;
    timestamp: bigint;
}
export interface LiveReaction {
    userId: Principal;
    emoji: string;
    timestamp: bigint;
    liveId: bigint;
}
export interface LiveMessage {
    id: bigint;
    userName: string;
    userId: Principal;
    text: string;
    timestamp: bigint;
    liveId: bigint;
}
export interface CallHistory {
    status: CallStatus;
    withUserId: Principal;
    callType: CallType;
    durationSeconds: bigint;
    timestamp: bigint;
}
export interface Story {
    id: bigint;
    userId: Principal;
    authorName: string;
    authorPhoto?: string;
    imageUrl: string;
    timestamp: bigint;
    caption: string;
    likesCount: bigint;
}
export interface Profile {
    age: bigint;
    bio: string;
    occupation: string;
    height: string;
    aboutMe: string;
    favoriteSongs: Array<string>;
    interests: Array<string>;
    userId: Principal;
    mood: string;
    name: string;
    createdAt: bigint;
    education: string;
    photoUrl?: string;
    motherTongue: string;
    gender: Gender;
    favoriteMovies: Array<string>;
    mediaUrls: Array<string>;
    phone?: string;
    religion: string;
    thoughts: string;
    maritalStatus: string;
    location: string;
    hobbies: Array<string>;
}
export interface CallSignal {
    id: bigint;
    data: string;
    toUserId: Principal;
    callType: CallType;
    fromUserId: Principal;
    timestamp: bigint;
    signalType: CallSignalType;
}
export interface StoryComment {
    id: bigint;
    parentCommentId?: bigint;
    userId: Principal;
    storyId: bigint;
    text: string;
    authorName: string;
    timestamp: bigint;
}
export interface StoryNotification {
    id: bigint;
    actorName: string;
    notifType: StoryNotifType;
    storyId: bigint;
    storyOwnerId: Principal;
    actorPhoto?: string;
    text: string;
    actorUserId: Principal;
    timestamp: bigint;
}
export interface MessageWithMeta {
    id: bigint;
    isDeleted: boolean;
    read: boolean;
    text: string;
    toUserId: Principal;
    fromUserId: Principal;
    timestamp: bigint;
    reaction?: string;
}
export type LiveStreamFilter = {
    __kind__: "all";
    all: null;
} | {
    __kind__: "gender";
    gender: Gender;
} | {
    __kind__: "religion";
    religion: string;
};
export interface LiveStream {
    id: bigint;
    title: string;
    startedAt: bigint;
    matchesOnly: boolean;
    hostName: string;
    isActive: boolean;
    hostId: Principal;
    hostPhoto?: string;
    filterSetting: LiveStreamFilter;
}
export enum CallSignalType {
    iceCandidate = "iceCandidate",
    offer = "offer",
    callEnd = "callEnd",
    answer = "answer",
    callDecline = "callDecline"
}
export enum CallStatus {
    completed = "completed",
    missed = "missed",
    declined = "declined"
}
export enum CallType {
    video = "video",
    voice = "voice"
}
export enum Gender {
    other = "other",
    female = "female",
    male = "male"
}
export enum PrivacyVisibility {
    everyone = "everyone",
    matchesOnly = "matchesOnly",
    hidden = "hidden"
}
export enum StoryNotifType {
    like = "like",
    comment = "comment",
    reply = "reply"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_pending_accepted_declined {
    pending = "pending",
    accepted = "accepted",
    declined = "declined"
}
export interface backendInterface {
    acceptMatchRequest(fromUserId: Principal): Promise<void>;
    addLiveReaction(liveId: bigint, emoji: string): Promise<void>;
    addStory(imageUrl: string, caption: string): Promise<void>;
    addStoryComment(storyId: bigint, text: string): Promise<void>;
    addStoryReaction(storyId: bigint, emoji: string): Promise<void>;
    adminDeleteProfile(profileId: Principal): Promise<void>;
    adminDeleteStory(storyId: bigint): Promise<void>;
    adminGetAllStories(): Promise<Array<Story>>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    blockFromLive(liveId: bigint, userId: Principal): Promise<void>;
    consumeCallSignals(fromUserId: Principal): Promise<Array<CallSignal>>;
    createOrUpdateProfile(name: string, age: bigint, gender: Gender, religion: string, location: string, bio: string, photoUrl: string | null, occupation: string, height: string, motherTongue: string, maritalStatus: string, interests: Array<string>, hobbies: Array<string>, education: string, favoriteMovies: Array<string>, favoriteSongs: Array<string>, thoughts: string, mood: string, mediaUrls: Array<string>, aboutMe: string, phone: string | null): Promise<void>;
    declineMatchRequest(fromUserId: Principal): Promise<void>;
    deleteMessage(messageId: bigint): Promise<void>;
    deleteStory(storyId: bigint): Promise<void>;
    editMessage(messageId: bigint, newText: string): Promise<void>;
    endLive(liveId: bigint): Promise<void>;
    getActiveLives(): Promise<Array<LiveStream>>;
    getAllProfiles(): Promise<Array<Profile>>;
    getAllWithRequestedCount(): Promise<Array<[Profile, bigint]>>;
    getCallHistory(): Promise<Array<[CallHistory, Profile]>>;
    getCallerStoryReaction(storyId: bigint): Promise<string | null>;
    getCallerUserProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailySuggestions(): Promise<Array<Profile>>;
    getLiveMessages(liveId: bigint): Promise<Array<LiveMessage>>;
    getLiveReactions(liveId: bigint): Promise<Array<LiveReaction>>;
    getLiveViewers(liveId: bigint): Promise<Array<Profile>>;
    getMatchRequests(): Promise<Array<[Profile, Variant_pending_accepted_declined]>>;
    getMessages(withUserId: Principal): Promise<Array<MessageWithMeta>>;
    getMutualMatches(): Promise<Array<Profile>>;
    getMyNotifications(): Promise<[Array<StoryNotification>, Array<SuperLikeNotification>]>;
    getMyStoryNotifications(): Promise<Array<StoryNotification>>;
    getPremiumStatus(): Promise<boolean>;
    getPrivacyVisibility(): Promise<PrivacyVisibility>;
    getProfileViewCount(): Promise<bigint>;
    getProfileViewers(): Promise<Array<[Profile, bigint]>>;
    getShowLastActive(): Promise<boolean>;
    getStories(): Promise<Array<Story>>;
    getStoryComments(storyId: bigint): Promise<Array<StoryComment>>;
    getStoryReactions(storyId: bigint): Promise<Array<[string, bigint]>>;
    getStoryViewCount(storyId: bigint): Promise<bigint>;
    getStoryViewers(storyId: bigint): Promise<Array<Profile>>;
    getSuperLikeNotifications(): Promise<Array<SuperLikeNotification>>;
    getSuperLikedBy(): Promise<Array<Profile>>;
    getTypingStatus(fromUserId: Principal): Promise<boolean>;
    getUserProfile(userId: Principal): Promise<Profile | null>;
    hasLikedStory(storyId: bigint): Promise<boolean>;
    hasSuperLiked(userId: Principal): Promise<boolean>;
    isAdmin(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    joinLive(liveId: bigint): Promise<void>;
    leaveLive(liveId: bigint): Promise<void>;
    likeStory(storyId: bigint): Promise<void>;
    logCall(withUserId: Principal, callType: CallType, durationSeconds: bigint, status: CallStatus): Promise<void>;
    markMessageRead(messageId: bigint): Promise<void>;
    reactToMessage(messageId: bigint, emoji: string): Promise<void>;
    recordProfileView(userId: Principal): Promise<void>;
    recordStoryView(storyId: bigint): Promise<void>;
    replyToStoryComment(storyId: bigint, parentCommentId: bigint, text: string): Promise<void>;
    saveCallerUserProfile(profile: Profile): Promise<void>;
    searchProfiles(term: string): Promise<Array<Profile>>;
    sendLiveMessage(liveId: bigint, text: string): Promise<void>;
    sendMatchRequest(toUserId: Principal): Promise<void>;
    sendMessage(toUserId: Principal, text: string): Promise<void>;
    setLiveFilter(liveId: bigint, filterSetting: LiveStreamFilter): Promise<void>;
    setPremiumStatus(isPremium: boolean): Promise<void>;
    setPrivacyVisibility(visibility: PrivacyVisibility): Promise<void>;
    setShowLastActive(show: boolean): Promise<void>;
    setTyping(toUserId: Principal, isTyping: boolean): Promise<void>;
    startLive(title: string, matchesOnly: boolean): Promise<bigint>;
    storeCallSignal(toUserId: Principal, signalType: CallSignalType, data: string, callType: CallType): Promise<void>;
    superLikeUser(userId: Principal): Promise<void>;
    unlikeStory(storyId: bigint): Promise<void>;
    unsuperLikeUser(userId: Principal): Promise<void>;
}
