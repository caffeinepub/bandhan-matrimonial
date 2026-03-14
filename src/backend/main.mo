import Map "mo:core/Map";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Option "mo:core/Option";
import List "mo:core/List";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  type Gender = {
    #male;
    #female;
    #other;
  };

  type Message = {
    id : Nat;
    fromUserId : Principal;
    toUserId : Principal;
    text : Text;
    timestamp : Int;
  };

  type Profile = {
    userId : Principal;
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
    userId : Principal;
    authorName : Text;
    authorPhoto : ?Text;
    imageUrl : Text;
    caption : Text;
    timestamp : Int;
  };

  type StoryComment = {
    id : Nat;
    storyId : Nat;
    userId : Principal;
    authorName : Text;
    text : Text;
    timestamp : Int;
  };

  let profiles = Map.empty<Principal, Profile>();
  let matches = Map.empty<Principal, Set.Set<Principal>>();
  let matchRequests = Map.empty<Principal, Map.Map<Principal, { #pending; #accepted; #declined }>>();

  let messages = Map.empty<Principal, List.List<Message>>();
  var nextMessageId = 1;

  let stories = Map.empty<Nat, Story>();
  var nextStoryId = 1;

  let storyComments = Map.empty<Nat, List.List<StoryComment>>();
  var nextCommentId = 1;

  public shared ({ caller }) func createOrUpdateProfile(
    name : Text,
    age : Nat,
    gender : Gender,
    religion : Text,
    location : Text,
    bio : Text,
    photoUrl : ?Text,
    occupation : Text,
    height : Text,
    motherTongue : Text,
    maritalStatus : Text,
    interests : [Text],
    hobbies : [Text],
    education : Text,
    favoriteMovies : [Text],
    favoriteSongs : [Text],
    thoughts : Text,
    mood : Text,
    mediaUrls : [Text],
    aboutMe : Text,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create/update profiles");
    };

    let profile : Profile = {
      userId = caller;
      name;
      age;
      gender;
      religion;
      location;
      bio;
      photoUrl;
      occupation;
      height;
      motherTongue;
      maritalStatus;
      interests;
      hobbies;
      education;
      favoriteMovies;
      favoriteSongs;
      thoughts;
      mood;
      mediaUrls;
      aboutMe;
      createdAt = Time.now();
    };

    profiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?Profile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    profiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(userId : Principal) : async ?Profile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    profiles.get(userId);
  };

  public query ({ caller }) func getAllProfiles() : async [Profile] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can browse profiles");
    };

    profiles.values().toArray().filter(
      func(profile) { profile.userId != caller }
    );
  };

  public query ({ caller }) func searchProfiles(term : Text) : async [Profile] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can search profiles");
    };

    let lowerTerm = term.toLower();

    profiles.values().toArray().filter(
      func(profile) {
        let lowerName = profile.name.toLower();
        let lowerLocation = profile.location.toLower();
        let lowerReligion = profile.religion.toLower();

        lowerName.contains(#text lowerTerm) or lowerLocation.contains(#text lowerTerm) or lowerReligion.contains(#text lowerTerm);
      }
    );
  };

  public shared ({ caller }) func sendMatchRequest(toUserId : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can send match requests");
    };

    if (not profiles.containsKey(caller)) {
      Runtime.trap("You must create a profile first");
    };

    if (not profiles.containsKey(toUserId)) {
      Runtime.trap("The user you are trying to match with does not exist");
    };

    switch (matches.get(caller)) {
      case (?userMatches) {
        if (userMatches.contains(toUserId)) {
          Runtime.trap("This user is already your match");
        };
      };
      case (null) {};
    };

    switch (matches.get(toUserId)) {
      case (?userMatches) {
        if (userMatches.contains(caller)) {
          Runtime.trap("You are already matched with this user");
        };
      };
      case (null) {};
    };

    let userRequests = matchRequests.get(caller).get(Map.empty<Principal, { #pending; #accepted; #declined }>());
    if (userRequests.containsKey(toUserId)) {
      Runtime.trap("A match request to this user already exists.");
    };

    userRequests.add(toUserId, #pending);
    matchRequests.add(caller, userRequests);

    let reverseUserRequests = matchRequests.get(toUserId).get(Map.empty<Principal, { #pending; #accepted; #declined }>());
    reverseUserRequests.add(caller, #pending);
    matchRequests.add(toUserId, reverseUserRequests);
  };

  public shared ({ caller }) func acceptMatchRequest(fromUserId : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can accept match requests");
    };

    let userRequests = matchRequests.get(caller).get(Map.empty<Principal, { #pending; #accepted; #declined }>());
    switch (userRequests.get(fromUserId)) {
      case (null) {
        Runtime.trap("No match request from this user");
      };
      case (?status) {
        if (status != #pending) {
          Runtime.trap("This match request has already been processed");
        };

        userRequests.add(fromUserId, #accepted);
        matchRequests.add(caller, userRequests);

        let reverseUserRequests = matchRequests.get(fromUserId).get(Map.empty<Principal, { #pending; #accepted; #declined }>());
        reverseUserRequests.add(caller, #accepted);
        matchRequests.add(fromUserId, reverseUserRequests);

        func addMatch(user : Principal, matchUser : Principal) {
          let userMatches = matches.get(user).get(Set.empty<Principal>());
          userMatches.add(matchUser);
          matches.add(user, userMatches);
        };

        addMatch(caller, fromUserId);
        addMatch(fromUserId, caller);
      };
    };
  };

  public shared ({ caller }) func declineMatchRequest(fromUserId : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can decline match requests");
    };

    let userRequests = matchRequests.get(caller).get(Map.empty<Principal, { #pending; #accepted; #declined }>());
    switch (userRequests.get(fromUserId)) {
      case (null) {
        Runtime.trap("No match request to decline");
      };
      case (?status) {
        if (status != #pending) {
          Runtime.trap("This match request has already been processed");
        };

        userRequests.add(fromUserId, #declined);
        matchRequests.add(caller, userRequests);

        let reverseUserRequests = matchRequests.get(fromUserId).get(Map.empty<Principal, { #pending; #accepted; #declined }>());
        reverseUserRequests.add(caller, #declined);
        matchRequests.add(fromUserId, reverseUserRequests);
      };
    };
  };

  public query ({ caller }) func getMatchRequests() : async [(Profile, { #pending; #accepted; #declined })] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view match requests");
    };

    let userRequests = matchRequests.get(caller).get(Map.empty<Principal, { #pending; #accepted; #declined }>());
    let requestList = List.empty<(Profile, { #pending; #accepted; #declined })>();

    for ((userId, status) in userRequests.entries()) {
      switch (profiles.get(userId)) {
        case (?profile) {
          requestList.add((profile, status));
        };
        case (null) {};
      };
    };

    requestList.toArray();
  };

  public query ({ caller }) func getMutualMatches() : async [Profile] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view matches");
    };

    matches.get(caller).get(Set.empty<Principal>()).toArray().map(
      func(userId) {
        switch (profiles.get(userId)) {
          case (?profile) { profile };
          case (null) { Runtime.trap("Profile not found for matched user") };
        };
      }
    );
  };

  func areMutualMatches(user1 : Principal, user2 : Principal) : Bool {
    switch (matches.get(user1)) {
      case (?user1Matches) {
        user1Matches.contains(user2);
      };
      case (null) { false };
    };
  };

  public shared ({ caller }) func sendMessage(toUserId : Principal, text : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    if (not areMutualMatches(caller, toUserId)) {
      Runtime.trap("Unauthorized: You can only message users you are matched with");
    };

    let message : Message = {
      id = nextMessageId;
      fromUserId = caller;
      toUserId;
      text;
      timestamp = Time.now();
    };

    func addMessage(userId : Principal, msg : Message) {
      let userMessages = messages.get(userId).get(List.empty<Message>());
      userMessages.add(msg);
      messages.add(userId, userMessages);
    };

    addMessage(caller, message);
    addMessage(toUserId, message);

    nextMessageId += 1;
  };

  public query ({ caller }) func getMessages(withUserId : Principal) : async [Message] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view messages");
    };

    if (not areMutualMatches(caller, withUserId)) {
      Runtime.trap("Unauthorized: You can only view messages with users you are matched with");
    };

    let userMessages = messages.get(caller).get(List.empty<Message>());
    userMessages.toArray().filter(
      func(msg) { msg.toUserId == withUserId or msg.fromUserId == withUserId }
    );
  };

  public shared ({ caller }) func addStory(imageUrl : Text, caption : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add stories");
    };

    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        let story : Story = {
          id = nextStoryId;
          userId = caller;
          authorName = profile.name;
          authorPhoto = profile.photoUrl;
          imageUrl;
          caption;
          timestamp = Time.now();
        };

        stories.add(nextStoryId, story);
        nextStoryId += 1;
      };
    };
  };

  public query ({ caller }) func getStories() : async [Story] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view stories");
    };

    stories.values().toArray();
  };

  public shared ({ caller }) func addStoryComment(storyId : Nat, text : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add comments");
    };

    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        let comment : StoryComment = {
          id = nextCommentId;
          storyId;
          userId = caller;
          authorName = profile.name;
          text;
          timestamp = Time.now();
        };

        let existingComments = storyComments.get(storyId).get(List.empty<StoryComment>());
        existingComments.add(comment);
        storyComments.add(storyId, existingComments);

        nextCommentId += 1;
      };
    };
  };

  public query ({ caller }) func getStoryComments(storyId : Nat) : async [StoryComment] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view comments");
    };

    let comments = storyComments.get(storyId).get(List.empty<StoryComment>());
    comments.toArray();
  };

  public query ({ caller }) func isAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public shared ({ caller }) func adminDeleteProfile(profileId : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admin can do this operation.");
    };
    profiles.remove(profileId);
  };

  public query ({ caller }) func getAllWithRequestedCount() : async [(Profile, Nat)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view this information");
    };

    let requestedProfiles = profiles.entries().toArray().map(
      func((profileId, profile)) {
        var count = 0;
        for ((_, userRequests) in matchRequests.entries()) {
          for ((otherId, status) in userRequests.entries()) {
            if (otherId == profileId and status == #pending) {
              count += 1;
            };
          };
        };
        (profile, count);
      }
    );
    requestedProfiles.filter(func((_, count)) { count > 0 });
  };
};
