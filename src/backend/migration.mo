import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";

module {
  type Gender = {
    #male;
    #female;
    #other;
  };

  type Message = {
    id : Nat;
    fromUserId : Principal.Principal;
    toUserId : Principal.Principal;
    text : Text;
    timestamp : Int;
    read : Bool;
  };

  type Profile = {
    userId : Principal.Principal;
    name : Text;
    age : Nat;
    gender : Gender;
    religion : Text;
    location : Text;
    bio : Text;
    photoUrl : ?Text;
    occupation : Text;
    height : Text;
    motherTongue : Text;
    maritalStatus : Text;
    interests : [Text];
    hobbies : [Text];
    education : Text;
    favoriteMovies : [Text];
    favoriteSongs : [Text];
    thoughts : Text;
    mood : Text;
    mediaUrls : [Text];
    aboutMe : Text;
    createdAt : Int;
  };

  type Story = {
    id : Nat;
    userId : Principal.Principal;
    authorName : Text;
    authorPhoto : ?Text;
    imageUrl : Text;
    caption : Text;
    timestamp : Int;
  };

  type StoryComment = {
    id : Nat;
    storyId : Nat;
    userId : Principal.Principal;
    authorName : Text;
    text : Text;
    timestamp : Int;
  };

  type TypingStatus = {
    fromUser : Principal.Principal;
    toUser : Principal.Principal;
    isTyping : Bool;
    timestamp : Int;
  };

  type CallSignalType = {
    #offer;
    #answer;
    #iceCandidate;
    #callEnd;
    #callDecline;
  };

  type CallType = {
    #video;
    #voice;
  };

  type CallSignal = {
    id : Nat;
    fromUserId : Principal.Principal;
    toUserId : Principal.Principal;
    signalType : CallSignalType;
    data : Text;
    callType : CallType;
    timestamp : Int;
  };

  type CallStatus = {
    #completed;
    #missed;
    #declined;
  };

  type CallHistory = {
    withUserId : Principal.Principal;
    callType : CallType;
    durationSeconds : Nat;
    status : CallStatus;
    timestamp : Int;
  };

  type OldActor = {
    profiles : Map.Map<Principal.Principal, Profile>;
    matches : Map.Map<Principal.Principal, Set.Set<Principal.Principal>>;
    matchRequests : Map.Map<Principal.Principal, Map.Map<Principal.Principal, { #pending; #accepted; #declined }>>;
    messages : Map.Map<Principal.Principal, List.List<Message>>;
    nextMessageId : Nat;
    stories : Map.Map<Nat, Story>;
    nextStoryId : Nat;
    storyComments : Map.Map<Nat, List.List<StoryComment>>;
    nextCommentId : Nat;
    callSignals : Map.Map<Principal.Principal, List.List<CallSignal>>;
    nextSignalId : Nat;
    typingStatuses : List.List<TypingStatus>;
    callHistories : Map.Map<Principal.Principal, List.List<CallHistory>>;
  };

  type StoryWithLikes = {
    id : Nat;
    userId : Principal.Principal;
    authorName : Text;
    authorPhoto : ?Text;
    imageUrl : Text;
    caption : Text;
    timestamp : Int;
    likesCount : Nat;
  };

  type StoryCommentWithParent = {
    id : Nat;
    storyId : Nat;
    userId : Principal.Principal;
    authorName : Text;
    text : Text;
    timestamp : Int;
    parentCommentId : ?Nat;
  };

  type ProfileWithPhone = {
    userId : Principal.Principal;
    name : Text;
    age : Nat;
    gender : Gender;
    religion : Text;
    location : Text;
    bio : Text;
    photoUrl : ?Text;
    occupation : Text;
    height : Text;
    motherTongue : Text;
    maritalStatus : Text;
    interests : [Text];
    hobbies : [Text];
    education : Text;
    favoriteMovies : [Text];
    favoriteSongs : [Text];
    thoughts : Text;
    mood : Text;
    mediaUrls : [Text];
    aboutMe : Text;
    phone : ?Text;
    createdAt : Int;
  };

  type NewActor = {
    profiles : Map.Map<Principal.Principal, ProfileWithPhone>;
    matches : Map.Map<Principal.Principal, Set.Set<Principal.Principal>>;
    matchRequests : Map.Map<Principal.Principal, Map.Map<Principal.Principal, { #pending; #accepted; #declined }>>;
    messages : Map.Map<Principal.Principal, List.List<Message>>;
    nextMessageId : Nat;
    stories : Map.Map<Nat, StoryWithLikes>;
    nextStoryId : Nat;
    storyComments : Map.Map<Nat, List.List<StoryCommentWithParent>>;
    nextCommentId : Nat;
    storyLikes : Map.Map<Nat, Set.Set<Principal.Principal>>;
    callSignals : Map.Map<Principal.Principal, List.List<CallSignal>>;
    nextSignalId : Nat;
    typingStatuses : List.List<TypingStatus>;
    callHistories : Map.Map<Principal.Principal, List.List<CallHistory>>;
  };

  public func run(old : OldActor) : NewActor {
    let newProfiles = old.profiles.map<Principal.Principal, Profile, ProfileWithPhone>(
      func(_id, p) {
        { p with phone = null };
      }
    );

    let newStories = old.stories.map<Nat, Story, StoryWithLikes>(
      func(_id, s) {
        { s with likesCount = 0 };
      }
    );

    let newComments = old.storyComments.map<Nat, List.List<StoryComment>, List.List<StoryCommentWithParent>>(
      func(_id, comments) {
        List.empty<StoryCommentWithParent>();
      }
    );

    let newStoryLikes = old.stories.map<Nat, Story, Set.Set<Principal.Principal>>(
      func(_id, _story) {
        Set.empty<Principal.Principal>();
      }
    );

    {
      old with profiles = newProfiles;
      stories = newStories;
      storyComments = newComments;
      storyLikes = newStoryLikes;
    };
  };
};
