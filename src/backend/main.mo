import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Option "mo:core/Option";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  type Gender = {
    #male;
    #female;
    #other;
  };

  type PrivacyVisibility = {
    #everyone;
    #matchesOnly;
    #hidden;
  };

  type Message = {
    id : Nat;
    fromUserId : Principal;
    toUserId : Principal;
    text : Text;
    timestamp : Int;
    read : Bool;
  };

  type MessageWithMeta = {
    id : Nat;
    fromUserId : Principal;
    toUserId : Principal;
    text : Text;
    timestamp : Int;
    read : Bool;
    reaction : ?Text;
    isDeleted : Bool;
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
    phone : ?Text;
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
    likesCount : Nat;
  };

  type StoryComment = {
    id : Nat;
    storyId : Nat;
    userId : Principal;
    authorName : Text;
    text : Text;
    timestamp : Int;
    parentCommentId : ?Nat;
  };

  type StoryNotifType = {
    #like;
    #comment;
    #reply;
  };

  type StoryNotification = {
    id : Nat;
    storyId : Nat;
    storyOwnerId : Principal;
    actorUserId : Principal;
    actorName : Text;
    actorPhoto : ?Text;
    notifType : StoryNotifType;
    text : Text;
    timestamp : Int;
  };

  type TypingStatus = {
    fromUser : Principal;
    toUser : Principal;
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
    fromUserId : Principal;
    toUserId : Principal;
    signalType : CallSignalType;
    callType : CallType;
    data : Text;
    timestamp : Int;
  };

  type CallStatus = {
    #completed;
    #missed;
    #declined;
  };

  type CallHistory = {
    withUserId : Principal;
    callType : CallType;
    durationSeconds : Nat;
    status : CallStatus;
    timestamp : Int;
  };

  type ProfileView = {
    viewerId : Principal;
    timestamp : Int;
  };

  type LiveStreamFilter = {
    #all;
    #gender : Gender;
    #religion : Text;
  };

  type LiveStream = {
    id : Nat;
    hostId : Principal;
    hostName : Text;
    hostPhoto : ?Text;
    title : Text;
    startedAt : Int;
    isActive : Bool;
    filterSetting : LiveStreamFilter;
    matchesOnly : Bool;
  };

  type LiveMessage = {
    id : Int;
    liveId : Nat;
    userId : Principal;
    userName : Text;
    text : Text;
    timestamp : Int;
  };

  type LiveReaction = {
    liveId : Nat;
    userId : Principal;
    emoji : Text;
    timestamp : Int;
  };

  type SuperLikeNotification = {
    fromProfile : Profile;
    timestamp : Int;
  };

  let profiles = Map.empty<Principal, Profile>();
  let matches = Map.empty<Principal, Set.Set<Principal>>();
  let matchRequests = Map.empty<Principal, Map.Map<Principal, { #pending; #accepted; #declined }>>();
  let privacySettings = Map.empty<Principal, PrivacyVisibility>();
  let premiumStatus = Map.empty<Principal, Bool>();
  let showLastActiveStatus = Map.empty<Principal, Bool>();

  let messages = Map.empty<Principal, List.List<Message>>();
  var nextMessageId = 1;

  let messageReactions = Map.empty<Nat, Text>();
  let deletedMessageIds = Set.empty<Nat>();

  let stories = Map.empty<Nat, Story>();
  var nextStoryId = 1;

  let storyComments = Map.empty<Nat, List.List<StoryComment>>();
  var nextCommentId = 1;

  let storyLikes = Map.empty<Nat, Set.Set<Principal>>();
  let storyReactions = Map.empty<Nat, Map.Map<Principal, Text>>();

  let storyViews = Map.empty<Nat, Set.Set<Principal>>();

  let storyNotifications = Map.empty<Principal, List.List<StoryNotification>>();
  var nextStoryNotifId = 1;

  let callSignals = Map.empty<Principal, List.List<CallSignal>>();
  var nextSignalId = 1;

  let typingStatuses = List.empty<TypingStatus>();

  let callHistories = Map.empty<Principal, List.List<CallHistory>>();

  // Profile views tracking
  let profileViews = Map.empty<Principal, List.List<ProfileView>>();

  // Super likes tracking
  let superLikes = Map.empty<Principal, Set.Set<Principal>>();

  // Live streams tracking
  let liveStreams = Map.empty<Nat, LiveStream>();
  var nextLiveId = 1;

  let liveMessages = Map.empty<Nat, List.List<LiveMessage>>();
  let liveViewers = Map.empty<Nat, Set.Set<Principal>>();
  let liveReactions = Map.empty<Nat, List.List<LiveReaction>>();
  let blockedLiveUsers = Map.empty<Nat, Set.Set<Principal>>();

  // Super like notifications
  let superLikeNotifs = Map.empty<Principal, List.List<SuperLikeNotification>>();

  // Privacy helpers
  func isProfileVisible(profileUserId : Principal, caller : Principal) : Bool {
    let visibility = privacySettings.get(profileUserId).get(#everyone);
    switch (visibility) {
      case (#everyone) { true };
      case (#hidden) { false };
      case (#matchesOnly) { areMutualMatches(caller, profileUserId) };
    };
  };

  func pushStoryNotif(storyOwnerId : Principal, notif : StoryNotification) {
    if (storyOwnerId == notif.actorUserId) { return };
    let existing = storyNotifications.get(storyOwnerId).get(List.empty<StoryNotification>());
    existing.add(notif);
    storyNotifications.add(storyOwnerId, existing);
  };

  func areMutualMatches(user1 : Principal, user2 : Principal) : Bool {
    switch (matches.get(user1)) {
      case (?user1Matches) {
        user1Matches.contains(user2);
      };
      case (null) { false };
    };
  };

  // Privacy and premium status functions
  public shared ({ caller }) func setPrivacyVisibility(visibility : PrivacyVisibility) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can set privacy settings");
    };
    privacySettings.add(caller, visibility);
  };

  public query ({ caller }) func getPrivacyVisibility() : async PrivacyVisibility {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    privacySettings.get(caller).get(#everyone);
  };

  public shared ({ caller }) func setPremiumStatus(isPremium : Bool) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can set premium status");
    };
    premiumStatus.add(caller, isPremium);
  };

  public query ({ caller }) func getPremiumStatus() : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    premiumStatus.get(caller).get(false);
  };

  public shared ({ caller }) func setShowLastActive(show : Bool) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can set last active setting");
    };
    showLastActiveStatus.add(caller, show);
  };

  public query ({ caller }) func getShowLastActive() : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    showLastActiveStatus.get(caller).get(true);
  };

  // Profile management
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
    phone : ?Text,
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
      phone;
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

  public shared ({ caller }) func saveCallerUserProfile(profile : Profile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let updatedProfile = { profile with userId = caller };
    profiles.add(caller, updatedProfile);
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
      func(profile) {
        profile.userId != caller and isProfileVisible(profile.userId, caller)
      }
    );
  };

  public query ({ caller }) func searchProfiles(term : Text) : async [Profile] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can search profiles");
    };

    let lowerTerm = term.toLower();

    profiles.values().toArray().filter(
      func(profile) {
        if (profile.userId == caller or not isProfileVisible(profile.userId, caller)) {
          return false;
        };
        let lowerName = profile.name.toLower();
        let lowerLocation = profile.location.toLower();
        let lowerReligion = profile.religion.toLower();

        lowerName.contains(#text lowerTerm) or lowerLocation.contains(#text lowerTerm) or lowerReligion.contains(#text lowerTerm);
      }
    );
  };

  // Profile view tracking
  public shared ({ caller }) func recordProfileView(userId : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can record profile views");
    };

    if (caller == userId) {
      Runtime.trap("Cannot record view of your own profile");
    };

    if (not profiles.containsKey(userId)) {
      Runtime.trap("Profile does not exist");
    };

    let view : ProfileView = {
      viewerId = caller;
      timestamp = Time.now();
    };

    let existingViews = profileViews.get(userId).get(List.empty<ProfileView>());
    existingViews.add(view);
    profileViews.add(userId, existingViews);
  };

  public query ({ caller }) func getProfileViewers() : async [(Profile, Int)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view profile viewers");
    };

    let views = profileViews.get(caller).get(List.empty<ProfileView>());
    let resultList = List.empty<(Profile, Int)>();

    for (view in views.values()) {
      if (areMutualMatches(caller, view.viewerId)) {
        switch (profiles.get(view.viewerId)) {
          case (?profile) {
            resultList.add((profile, view.timestamp));
          };
          case (null) {};
        };
      };
    };

    resultList.toArray();
  };

  public query ({ caller }) func getProfileViewCount() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view profile view count");
    };

    let views = profileViews.get(caller).get(List.empty<ProfileView>());
    views.size();
  };

  // Super like functionality
  public shared ({ caller }) func superLikeUser(userId : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can super like");
    };

    if (caller == userId) {
      Runtime.trap("Cannot super like yourself");
    };

    if (not profiles.containsKey(userId)) {
      Runtime.trap("User profile does not exist");
    };

    let userSuperLikes = superLikes.get(caller).get(Set.empty<Principal>());
    
    if (userSuperLikes.contains(userId)) {
      Runtime.trap("You have already super liked this user");
    };

    userSuperLikes.add(userId);
    superLikes.add(caller, userSuperLikes);

    // Create super like notification for target user
    switch (profiles.get(caller)) {
      case (?fromProfile) {
        let notif : SuperLikeNotification = {
          fromProfile;
          timestamp = Time.now();
        };

        let existingNotifs = superLikeNotifs.get(userId).get(List.empty<SuperLikeNotification>());
        existingNotifs.add(notif);
        superLikeNotifs.add(userId, existingNotifs);
      };
      case (null) {};
    };
  };

  public shared ({ caller }) func unsuperLikeUser(userId : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can unsuperlike");
    };

    switch (superLikes.get(caller)) {
      case (null) {
        Runtime.trap("You have not super liked this user");
      };
      case (?userSuperLikes) {
        if (not userSuperLikes.contains(userId)) {
          Runtime.trap("You have not super liked this user");
        };

        let remainingSuperLikes = userSuperLikes.filter(
          func(user) { user != userId }
        );
        superLikes.add(caller, remainingSuperLikes);
      };
    };
  };

  public query ({ caller }) func hasSuperLiked(userId : Principal) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can check super like status");
    };

    switch (superLikes.get(caller)) {
      case (null) { false };
      case (?userSuperLikes) { userSuperLikes.contains(userId) };
    };
  };

  public query ({ caller }) func getSuperLikedBy() : async [Profile] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view who super liked them");
    };

    let resultList = List.empty<Profile>();

    for ((userId, userSuperLikes) in superLikes.entries()) {
      if (userSuperLikes.contains(caller)) {
        switch (profiles.get(userId)) {
          case (?profile) {
            resultList.add(profile);
          };
          case (null) {};
        };
      };
    };

    resultList.toArray();
  };

  public query ({ caller }) func getSuperLikeNotifications() : async [SuperLikeNotification] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view super like notifications");
    };
    superLikeNotifs.get(caller).get(List.empty<SuperLikeNotification>()).toArray();
  };

  // Match requests and matching
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

  // Daily match suggestions
  public query ({ caller }) func getDailySuggestions() : async [Profile] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get suggestions");
    };

    let callerProfile = switch (profiles.get(caller)) {
      case (?profile) { profile };
      case (null) { Runtime.trap("No profile found") };
    };

    let callerMatches = matches.get(caller).get(Set.empty<Principal>());

    let allProfiles = List.empty<Profile>();
    for ((_, profile) in profiles.entries()) {
      allProfiles.add(profile);
    };

    let eligibleProfiles = allProfiles.filter(
      func(profile) {
        profile.userId != caller and not callerMatches.contains(profile.userId)
      }
    ).toArray();

    let scoredProfiles = eligibleProfiles.map(
      func(profile) {
        var sharedCount = 0;
        let callerInterestsSet = Set.fromIter(callerProfile.interests.values());
        for (interest in profile.interests.values()) {
          if (callerInterestsSet.contains(interest)) {
            sharedCount += 1;
          };
        };
        (profile, sharedCount);
      }
    );

    let sortedProfiles = scoredProfiles.sort(
      func(a, b) {
        let (_profileA, sharedA) = a;
        let (_profileB, sharedB) = b;
        Nat.compare(sharedB, sharedA);
      }
    );

    let result = sortedProfiles.map(func((profile, _shared)) { profile });
    result.sliceToArray(0, if (result.size() < 10) { result.size() } else { 10 });
  };

  // Messaging and reactions
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
      read = false;
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

  public query ({ caller }) func getMessages(withUserId : Principal) : async [MessageWithMeta] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view messages");
    };

    if (not areMutualMatches(caller, withUserId)) {
      Runtime.trap("Unauthorized: You can only view messages with users you are matched with");
    };

    let userMessages = messages.get(caller).get(List.empty<Message>());
    let filtered = userMessages.toArray().filter(
      func(msg) {
        (msg.toUserId == withUserId or msg.fromUserId == withUserId) and
        not deletedMessageIds.contains(msg.id)
      }
    );
    filtered.map(
      func(msg) : MessageWithMeta {
        {
          id = msg.id;
          fromUserId = msg.fromUserId;
          toUserId = msg.toUserId;
          text = msg.text;
          timestamp = msg.timestamp;
          read = msg.read;
          reaction = messageReactions.get(msg.id);
          isDeleted = false;
        }
      }
    );
  };

  public shared ({ caller }) func reactToMessage(messageId : Nat, emoji : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can react to messages");
    };
    messageReactions.add(messageId, emoji);
  };

  public shared ({ caller }) func editMessage(messageId : Nat, newText : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can edit messages");
    };

    let userMessages = messages.get(caller).get(List.empty<Message>());
    var found = false;
    var otherUserId = caller;

    let updatedMessages = userMessages.map<Message, Message>(
      func(msg) {
        if (msg.id == messageId) {
          if (msg.fromUserId != caller) {
            Runtime.trap("Unauthorized: You can only edit your own messages");
          };
          found := true;
          otherUserId := msg.toUserId;
          { msg with text = newText };
        } else { msg };
      }
    );

    if (not found) {
      Runtime.trap("Message not found");
    };

    messages.add(caller, updatedMessages);

    if (otherUserId != caller) {
      let otherMessages = messages.get(otherUserId).get(List.empty<Message>());
      let updatedOtherMessages = otherMessages.map<Message, Message>(
        func(msg) {
          if (msg.id == messageId) {
            { msg with text = newText };
          } else { msg };
        }
      );
      messages.add(otherUserId, updatedOtherMessages);
    };
  };

  public shared ({ caller }) func deleteMessage(messageId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete messages");
    };

    let userMessages = messages.get(caller).get(List.empty<Message>());
    let found = userMessages.toArray().find(
      func(msg) { msg.id == messageId and msg.fromUserId == caller }
    );

    switch (found) {
      case (null) {
        Runtime.trap("Message not found or not authorized to delete");
      };
      case (?_) {
        deletedMessageIds.add(messageId);
      };
    };
  };

  // Story functions
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
          likesCount = 0;
        };

        stories.add(nextStoryId, story);
        storyLikes.add(nextStoryId, Set.empty<Principal>());
        storyReactions.add(nextStoryId, Map.empty<Principal, Text>());
        storyViews.add(nextStoryId, Set.empty<Principal>());
        nextStoryId += 1;
      };
    };
  };

  public shared ({ caller }) func deleteStory(storyId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete stories");
    };

    switch (stories.get(storyId)) {
      case (null) { Runtime.trap("Story not found") };
      case (?story) {
        if (story.userId != caller) {
          Runtime.trap("Unauthorized: You can only delete your own stories");
        };
        stories.remove(storyId);
        storyLikes.remove(storyId);
        storyReactions.remove(storyId);
        storyViews.remove(storyId);
      };
    };
  };

  public shared ({ caller }) func adminDeleteStory(storyId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admin can delete stories");
    };
    stories.remove(storyId);
    storyLikes.remove(storyId);
    storyReactions.remove(storyId);
    storyViews.remove(storyId);
  };

  public shared ({ caller }) func addStoryReaction(storyId : Nat, emoji : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can react to stories");
    };

    switch (storyReactions.get(storyId)) {
      case (null) {
        Runtime.trap("Story not found");
      };
      case (?reactions) {
        reactions.add(caller, emoji);
        storyReactions.add(storyId, reactions);
      };
    };
  };

  public query ({ caller }) func getStoryReactions(storyId : Nat) : async [(Text, Nat)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view story reactions");
    };

    switch (storyReactions.get(storyId)) {
      case (null) {
        Runtime.trap("Story not found");
      };
      case (?reactions) {
        let emojiCounts = Map.empty<Text, Nat>();

        for ((_, emoji) in reactions.entries()) {
          let count = emojiCounts.get(emoji).get(0);
          emojiCounts.add(emoji, count + 1);
        };

        emojiCounts.toArray();
      };
    };
  };

  public query ({ caller }) func getCallerStoryReaction(storyId : Nat) : async ?Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view reactions");
    };

    switch (storyReactions.get(storyId)) {
      case (null) { Runtime.trap("Story not found") };
      case (?reactions) { reactions.get(caller) };
    };
  };

  public shared ({ caller }) func recordStoryView(storyId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view stories");
    };

    switch (storyViews.get(storyId)) {
      case (null) { Runtime.trap("Story not found") };
      case (?viewers) {
        let newViewers = Set.empty<Principal>();
        for (viewer in viewers.values()) {
          newViewers.add(viewer);
        };
        newViewers.add(caller);
        storyViews.add(storyId, newViewers);
      };
    };
  };

  public query ({ caller }) func getStoryViewCount(storyId : Nat) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view story view count");
    };
    switch (storyViews.get(storyId)) {
      case (null) { 0 };
      case (?viewers) { viewers.size() };
    };
  };

  public query ({ caller }) func getStoryViewers(storyId : Nat) : async [Profile] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view story viewers");
    };

    switch (stories.get(storyId)) {
      case (null) { Runtime.trap("Story not found") };
      case (?story) {
        if (story.userId != caller) {
          Runtime.trap("Unauthorized: You can only view viewers for your own stories");
        };
        switch (storyViews.get(storyId)) {
          case (null) { [] };
          case (?viewers) {
            viewers.toArray().map(
              func(userId) {
                switch (profiles.get(userId)) {
                  case (?profile) { profile };
                  case (null) { Runtime.trap("User not found") };
                };
              }
            );
          };
        };
      };
    };
  };

  public query ({ caller }) func getStories() : async [Story] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view stories");
    };
    stories.values().toArray();
  };

  public shared ({ caller }) func likeStory(storyId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can like stories");
    };

    switch (stories.get(storyId)) {
      case (null) { Runtime.trap("Story not found") };
      case (?story) {
        switch (storyLikes.get(storyId)) {
          case (null) { storyLikes.add(storyId, Set.singleton<Principal>(caller)) };
          case (?likes) {
            if (likes.contains(caller)) {
              Runtime.trap("You already liked this story");
            };
            likes.add(caller);
          };
        };

        switch (stories.get(storyId)) {
          case (?s) {
            let updatedStory : Story = {
              s with likesCount = s.likesCount + 1;
            };
            stories.add(storyId, updatedStory);
          };
          case (null) {};
        };

        switch (profiles.get(caller)) {
          case (?actorProfile) {
            let notif : StoryNotification = {
              id = nextStoryNotifId;
              storyId;
              storyOwnerId = story.userId;
              actorUserId = caller;
              actorName = actorProfile.name;
              actorPhoto = actorProfile.photoUrl;
              notifType = #like;
              text = actorProfile.name # " liked your story \u{2764}";
              timestamp = Time.now();
            };
            pushStoryNotif(story.userId, notif);
            nextStoryNotifId += 1;
          };
          case (null) {};
        };
      };
    };
  };

  public shared ({ caller }) func unlikeStory(storyId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can unlike stories");
    };

    switch (stories.get(storyId), storyLikes.get(storyId)) {
      case (null, _) { Runtime.trap("Story not found") };
      case (_, null) {
        Runtime.trap("You have not liked this story");
      };
      case (?_, ?likes) {
        if (not likes.contains(caller)) {
          Runtime.trap("You have not liked this story");
        };

        let remainingLikes = likes.filter(
          func(user) { user != caller }
        );
        storyLikes.add(storyId, remainingLikes);

        switch (stories.get(storyId)) {
          case (?story) {
            let updatedStory : Story = {
              story with likesCount = Nat.max(0, story.likesCount - 1);
            };
            stories.add(storyId, updatedStory);
          };
          case (null) {};
        };
      };
    };
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
          parentCommentId = null;
        };

        let existingComments = storyComments.get(storyId).get(List.empty<StoryComment>());
        existingComments.add(comment);
        storyComments.add(storyId, existingComments);

        nextCommentId += 1;

        switch (stories.get(storyId)) {
          case (?story) {
            let notif : StoryNotification = {
              id = nextStoryNotifId;
              storyId;
              storyOwnerId = story.userId;
              actorUserId = caller;
              actorName = profile.name;
              actorPhoto = profile.photoUrl;
              notifType = #comment;
              text = profile.name # " commented on your story: \"" # text # "\"";
              timestamp = Time.now();
            };
            pushStoryNotif(story.userId, notif);
            nextStoryNotifId += 1;
          };
          case (null) {};
        };
      };
    };
  };

  public shared ({ caller }) func replyToStoryComment(storyId : Nat, parentCommentId : Nat, text : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can reply to comments");
    };

    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        let reply : StoryComment = {
          id = nextCommentId;
          storyId;
          userId = caller;
          authorName = profile.name;
          text;
          timestamp = Time.now();
          parentCommentId = ?parentCommentId;
        };

        let existingComments = storyComments.get(storyId).get(List.empty<StoryComment>());
        existingComments.add(reply);
        storyComments.add(storyId, existingComments);

        nextCommentId += 1;

        switch (stories.get(storyId)) {
          case (?story) {
            let notif : StoryNotification = {
              id = nextStoryNotifId;
              storyId;
              storyOwnerId = story.userId;
              actorUserId = caller;
              actorName = profile.name;
              actorPhoto = profile.photoUrl;
              notifType = #reply;
              text = profile.name # " replied to a comment on your story: \"" # text # "\"";
              timestamp = Time.now();
            };
            pushStoryNotif(story.userId, notif);
            nextStoryNotifId += 1;
          };
          case (null) {};
        };
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

  public query ({ caller }) func getMyStoryNotifications() : async [StoryNotification] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view notifications");
    };
    storyNotifications.get(caller).get(List.empty<StoryNotification>()).toArray();
  };

  // Returns both story and super like notifications
  public query ({ caller }) func getMyNotifications() : async ([StoryNotification], [SuperLikeNotification]) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get notifications");
    };
    let storyNotifs = storyNotifications.get(caller).get(List.empty<StoryNotification>()).toArray();
    let superLikeNotifsArr = superLikeNotifs.get(caller).get(List.empty<SuperLikeNotification>()).toArray();

    (storyNotifs, superLikeNotifsArr);
  };

  // Call signal functions
  public shared ({ caller }) func storeCallSignal(toUserId : Principal, signalType : CallSignalType, data : Text, callType : CallType) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can store call signals");
    };

    if (not areMutualMatches(caller, toUserId)) {
      Runtime.trap("Unauthorized: You can only send call signals to users you are matched with");
    };

    let signal : CallSignal = {
      id = nextSignalId;
      fromUserId = caller;
      toUserId;
      signalType;
      callType;
      data;
      timestamp = Time.now();
    };

    let existingSignals = callSignals.get(toUserId).get(List.empty<CallSignal>());
    existingSignals.add(signal);
    callSignals.add(toUserId, existingSignals);

    nextSignalId += 1;
  };

  public shared ({ caller }) func consumeCallSignals(fromUserId : Principal) : async [CallSignal] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can consume call signals");
    };

    if (not areMutualMatches(caller, fromUserId)) {
      Runtime.trap("Unauthorized: You can only consume call signals from users you are matched with");
    };

    let signals = callSignals.get(caller).get(List.empty<CallSignal>());
    let filteredSignals = signals.filter(
      func(signal) { signal.fromUserId == fromUserId }
    ).toArray();

    let remainingSignals = signals.filter(
      func(signal) { signal.fromUserId != fromUserId }
    );
    callSignals.add(caller, remainingSignals);

    filteredSignals;
  };

  // Message read/typing/call log functions
  public shared ({ caller }) func markMessageRead(messageId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can mark messages as read");
    };

    let userMessages = messages.get(caller).get(List.empty<Message>());
    var messageFound = false;

    let updatedMessages = userMessages.map<Message, Message>(
      func(msg) {
        if (msg.id == messageId) {
          if (msg.toUserId != caller) {
            Runtime.trap("Unauthorized: You can only mark messages sent to you as read");
          };
          if (not areMutualMatches(caller, msg.fromUserId)) {
            Runtime.trap("Unauthorized: You can only mark messages from matched users as read");
          };
          messageFound := true;
          { msg with read = true };
        } else { msg };
      }
    );

    if (not messageFound) {
      Runtime.trap("Message not found");
    };

    messages.add(caller, updatedMessages);
  };

  public shared ({ caller }) func setTyping(toUserId : Principal, isTyping : Bool) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can set typing status");
    };

    if (not areMutualMatches(caller, toUserId)) {
      Runtime.trap("Unauthorized: You can only set typing status with users you are matched with");
    };

    typingStatuses.add({
      fromUser = caller;
      toUser = toUserId;
      isTyping;
      timestamp = Time.now();
    });
  };

  public query ({ caller }) func getTypingStatus(fromUserId : Principal) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get typing status");
    };

    if (not areMutualMatches(caller, fromUserId)) {
      Runtime.trap("Unauthorized: You can only get typing status from users you are matched with");
    };

    let now = Time.now();
    let filteredStatuses = typingStatuses.filter(
      func(status) {
        status.fromUser == fromUserId and status.toUser == caller and now - status.timestamp < 30_000_000_000
      }
    );
    let isTyping = filteredStatuses.toArray().find(
      func(status) { status.isTyping }
    );
    isTyping != null;
  };

  public shared ({ caller }) func logCall(withUserId : Principal, callType : CallType, durationSeconds : Nat, status : CallStatus) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can log call history");
    };

    if (not areMutualMatches(caller, withUserId)) {
      Runtime.trap("Unauthorized: You can only log calls with users you are matched with");
    };

    let call : CallHistory = {
      withUserId;
      callType;
      durationSeconds;
      status;
      timestamp = Time.now();
    };

    let existingHistory = callHistories.get(caller).get(List.empty<CallHistory>());
    existingHistory.add(call);
    callHistories.add(caller, existingHistory);
  };

  public query ({ caller }) func getCallHistory() : async [(CallHistory, Profile)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view call history");
    };

    let history = callHistories.get(caller).get(List.empty<CallHistory>());
    let resultList = List.empty<(CallHistory, Profile)>();

    for (call in history.values()) {
      switch (profiles.get(call.withUserId)) {
        case (?profile) {
          resultList.add((call, profile));
        };
        case (null) {};
      };
    };

    resultList.toArray();
  };

  // Admin and special/analytics functions
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

  public query ({ caller }) func adminGetAllStories() : async [Story] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admin can view all stories");
    };
    stories.values().toArray();
  };

  public query ({ caller }) func hasLikedStory(storyId : Nat) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can check story likes");
    };

    switch (storyLikes.get(storyId)) {
      case (null) { false };
      case (?likes) { likes.contains(caller) };
    };
  };

  // Live stream functions
  public shared ({ caller }) func startLive(title : Text, matchesOnly : Bool) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can start live streams");
    };

    switch (profiles.get(caller)) {
      case (?profile) {
        let live : LiveStream = {
          id = nextLiveId;
          hostId = caller;
          hostName = profile.name;
          hostPhoto = profile.photoUrl;
          title;
          startedAt = Time.now();
          isActive = true;
          filterSetting = #all;
          matchesOnly;
        };

        liveStreams.add(nextLiveId, live);
        liveMessages.add(nextLiveId, List.empty<LiveMessage>());
        liveViewers.add(nextLiveId, Set.empty<Principal>());
        liveReactions.add(nextLiveId, List.empty<LiveReaction>());
        blockedLiveUsers.add(nextLiveId, Set.empty<Principal>());
        let liveId = nextLiveId;
        nextLiveId += 1;
        liveId;
      };
      case (null) { Runtime.trap("Profile not found") };
    };
  };

  public shared ({ caller }) func endLive(liveId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can end lives streams");
    };

    switch (liveStreams.get(liveId)) {
      case (null) { Runtime.trap("Live stream not found") };
      case (?live) {
        if (live.hostId != caller) {
          Runtime.trap("Unauthorized: Only host can end live stream");
        };
        liveStreams.add(liveId, { live with isActive = false });
      };
    };
  };

  public query ({ caller }) func getActiveLives() : async [LiveStream] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view active live streams");
    };
    liveStreams.values().toArray().filter(
      func(live) { live.isActive }
    );
  };

  public shared ({ caller }) func joinLive(liveId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can join live streams");
    };

    switch (liveStreams.get(liveId)) {
      case (null) { Runtime.trap("Live stream not found") };
      case (?live) {
        if (live.matchesOnly and not areMutualMatches(caller, live.hostId)) {
          Runtime.trap("Unauthorized: This live stream is for matches only");
        };

        switch (blockedLiveUsers.get(liveId)) {
          case (?blocked) {
            if (blocked.contains(caller)) {
              Runtime.trap("You are blocked from this live");
            };
          };
          case (null) {};
        };

        switch (liveViewers.get(liveId)) {
          case (?viewers) { viewers.add(caller) };
          case (null) {};
        };
      };
    };
  };

  public shared ({ caller }) func leaveLive(liveId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can leave live streams");
    };

    switch (liveViewers.get(liveId)) {
      case (?viewers) {
        let newViewers = viewers.filter(
          func(user) { user != caller }
        );
        liveViewers.add(liveId, newViewers);
      };
      case (null) {};
    };
  };

  public shared ({ caller }) func sendLiveMessage(liveId : Nat, text : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can send live messages");
    };

    if (not liveStreams.containsKey(liveId)) {
      Runtime.trap("Live stream does not exist");
    };

    switch (profiles.get(caller)) {
      case (?profile) {
        let message = {
          id = Time.now();
          liveId;
          userId = caller;
          userName = profile.name;
          text;
          timestamp = Time.now();
        };

        let existingMessages = liveMessages.get(liveId).get(List.empty<LiveMessage>());
        existingMessages.add(message);
        liveMessages.add(liveId, existingMessages);
      };
      case (null) { Runtime.trap("Profile not found") };
    };
  };

  public query ({ caller }) func getLiveMessages(liveId : Nat) : async [LiveMessage] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view live messages");
    };
    liveMessages.get(liveId).get(List.empty<LiveMessage>()).toArray();
  };

  public query ({ caller }) func getLiveViewers(liveId : Nat) : async [Profile] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view live viewers");
    };

    let resultList = List.empty<Profile>();

    switch (liveViewers.get(liveId)) {
      case (?viewers) {
        for (userId in viewers.values()) {
          switch (profiles.get(userId)) {
            case (?profile) {
              resultList.add(profile);
            };
            case (null) {};
          };
        };
      };
      case (null) {};
    };
    resultList.toArray();
  };

  public shared ({ caller }) func blockFromLive(liveId : Nat, userId : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can block from live streams");
    };

    switch (liveStreams.get(liveId)) {
      case (?live) {
        if (live.hostId != caller) {
          Runtime.trap("Unauthorized: Only the host can block users");
        };

        let blockedUsers = blockedLiveUsers.get(liveId).get(Set.empty<Principal>());
        blockedUsers.add(userId);
        blockedLiveUsers.add(liveId, blockedUsers);

        let remainingViewers = switch (liveViewers.get(liveId)) {
          case (?viewers) {
            viewers.filter(
              func(u) { u != userId }
            );
          };
          case (null) { Set.empty<Principal>() };
        };
        liveViewers.add(liveId, remainingViewers);
      };
      case (null) { Runtime.trap("Live stream not found") };
    };
  };

  public shared ({ caller }) func addLiveReaction(liveId : Nat, emoji : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can react to live streams");
    };

    if (not liveStreams.containsKey(liveId)) {
      Runtime.trap("Live does not exist");
    };

    let reaction : LiveReaction = {
      liveId;
      userId = caller;
      emoji;
      timestamp = Time.now();
    };

    let existingReactions = liveReactions.get(liveId).get(List.empty<LiveReaction>());
    existingReactions.add(reaction);
    liveReactions.add(liveId, existingReactions);
  };

  public query ({ caller }) func getLiveReactions(liveId : Nat) : async [LiveReaction] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view live reactions");
    };
    liveReactions.get(liveId).get(List.empty<LiveReaction>()).toArray();
  };

  public shared ({ caller }) func setLiveFilter(liveId : Nat, filterSetting : LiveStreamFilter) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can set live filters");
    };

    switch (liveStreams.get(liveId)) {
      case (null) { Runtime.trap("Live stream not found") };
      case (?live) {
        if (live.hostId != caller) {
          Runtime.trap("Unauthorized: Only host can set filters");
        };
        liveStreams.add(liveId, { live with filterSetting });
      };
    };
  };
};
