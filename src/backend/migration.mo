import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type OldGender = {
    #male;
    #female;
    #other;
  };

  type OldProfile = {
    userId : Principal.Principal;
    name : Text;
    age : Nat;
    gender : OldGender;
    religion : Text;
    location : Text;
    bio : Text;
    photoUrl : ?Text;
  };

  type OldActor = {
    profiles : Map.Map<Principal.Principal, OldProfile>;
    matches : Map.Map<Principal.Principal, Set.Set<Principal.Principal>>;
    matchRequests : Map.Map<Principal.Principal, Map.Map<Principal.Principal, { #pending; #accepted; #declined }>>;
  };

  type NewGender = {
    #male;
    #female;
    #other;
  };

  type NewProfile = {
    userId : Principal.Principal;
    name : Text;
    age : Nat;
    gender : NewGender;
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

  type NewActor = {
    profiles : Map.Map<Principal.Principal, NewProfile>;
    matches : Map.Map<Principal.Principal, Set.Set<Principal.Principal>>;
    matchRequests : Map.Map<Principal.Principal, Map.Map<Principal.Principal, { #pending; #accepted; #declined }>>;
    messages : Map.Map<Principal.Principal, List.List<Message>>;
    nextMessageId : Nat;
    stories : Map.Map<Nat, Story>;
    nextStoryId : Nat;
    storyComments : Map.Map<Nat, List.List<StoryComment>>;
    nextCommentId : Nat;
  };

  type Message = {
    id : Nat;
    fromUserId : Principal.Principal;
    toUserId : Principal.Principal;
    text : Text;
    timestamp : Int;
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

  public func run(old : OldActor) : NewActor {
    let newProfiles = old.profiles.map<Principal.Principal, OldProfile, NewProfile>(
      func(_, oldProfile) {
        {
          oldProfile with
          occupation = "";
          height = "";
          motherTongue = "";
          maritalStatus = "";
          interests = [];
          hobbies = [];
          education = "";
          favoriteMovies = [];
          favoriteSongs = [];
          thoughts = "";
          mood = "";
          mediaUrls = [];
          aboutMe = "";
          createdAt = 0;
        };
      }
    );

    {
      profiles = newProfiles;
      matches = old.matches;
      matchRequests = old.matchRequests;
      messages = Map.empty<Principal.Principal, List.List<Message>>();
      nextMessageId = 1;
      stories = Map.empty<Nat, Story>();
      nextStoryId = 1;
      storyComments = Map.empty<Nat, List.List<StoryComment>>();
      nextCommentId = 1;
    };
  };
};
