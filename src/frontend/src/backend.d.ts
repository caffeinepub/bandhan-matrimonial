import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface StoryComment {
    id: bigint;
    userId: Principal;
    storyId: bigint;
    text: string;
    authorName: string;
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
}
export interface Message {
    id: bigint;
    text: string;
    toUserId: Principal;
    fromUserId: Principal;
    timestamp: bigint;
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
    religion: string;
    thoughts: string;
    maritalStatus: string;
    location: string;
    hobbies: Array<string>;
}
export enum Gender {
    other = "other",
    female = "female",
    male = "male"
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
    addStory(imageUrl: string, caption: string): Promise<void>;
    addStoryComment(storyId: bigint, text: string): Promise<void>;
    adminDeleteProfile(profileId: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createOrUpdateProfile(name: string, age: bigint, gender: Gender, religion: string, location: string, bio: string, photoUrl: string | null, occupation: string, height: string, motherTongue: string, maritalStatus: string, interests: Array<string>, hobbies: Array<string>, education: string, favoriteMovies: Array<string>, favoriteSongs: Array<string>, thoughts: string, mood: string, mediaUrls: Array<string>, aboutMe: string): Promise<void>;
    declineMatchRequest(fromUserId: Principal): Promise<void>;
    getAllProfiles(): Promise<Array<Profile>>;
    getAllWithRequestedCount(): Promise<Array<[Profile, bigint]>>;
    getCallerUserProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMatchRequests(): Promise<Array<[Profile, Variant_pending_accepted_declined]>>;
    getMessages(withUserId: Principal): Promise<Array<Message>>;
    getMutualMatches(): Promise<Array<Profile>>;
    getStories(): Promise<Array<Story>>;
    getStoryComments(storyId: bigint): Promise<Array<StoryComment>>;
    getUserProfile(userId: Principal): Promise<Profile | null>;
    isAdmin(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    searchProfiles(term: string): Promise<Array<Profile>>;
    sendMatchRequest(toUserId: Principal): Promise<void>;
    sendMessage(toUserId: Principal, text: string): Promise<void>;
}
