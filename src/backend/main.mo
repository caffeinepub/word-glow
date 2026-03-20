import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Order "mo:core/Order";
import Array "mo:core/Array";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let gameState = {
    players = Map.empty<Principal, PlayerProfile>();
    puzzles = Map.empty<Nat, PuzzleMeta>();
    leaderBoard = Map.empty<Principal, Nat>();
  };

  public type PlayerProfile = {
    username : Text;
    xp : Nat;
    level : Nat;
    wordsFound : Nat;
    bestTimes : [(Text, Time.Time)];
    lastLogin : Time.Time;
    completedPuzzles : [Nat];
  };

  public type PuzzleMeta = {
    id : Nat;
  };

  module PlayerProfile {
    public func compare(player1 : PlayerProfile, player2 : PlayerProfile) : Order.Order {
      Text.compare(player1.username, player2.username);
    };
  };

  let dailyChallenges = Map.empty<Text, PuzzleMeta>();

  // Required Profile Management Functions
  public query ({ caller }) func getCallerUserProfile() : async ?PlayerProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    gameState.players.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?PlayerProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    gameState.players.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : PlayerProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    gameState.players.add(caller, profile);
    gameState.leaderBoard.add(caller, profile.xp);
  };

  // Player Profile Management
  public shared ({ caller }) func createOrUpdateProfile(username : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create profiles");
    };
    let existingProfile = gameState.players.get(caller);
    let newProfile : PlayerProfile = switch (existingProfile) {
      case (null) {
        {
          username = username;
          xp = 0;
          level = 1;
          wordsFound = 0;
          bestTimes = [];
          lastLogin = Time.now();
          completedPuzzles = [];
        };
      };
      case (?profile) {
        {
          username = username;
          xp = profile.xp;
          level = profile.level;
          wordsFound = profile.wordsFound;
          bestTimes = profile.bestTimes;
          lastLogin = Time.now();
          completedPuzzles = profile.completedPuzzles;
        };
      };
    };
    gameState.players.add(caller, newProfile);
    gameState.leaderBoard.add(caller, newProfile.xp);
  };

  // Scoring and Progress Tracking
  public shared ({ caller }) func submitScore(puzzleId : Nat, score : Nat, timeTaken : Time.Time) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit scores");
    };
    switch (gameState.players.get(caller)) {
      case (null) { Runtime.trap("Player profile not found. Please create a profile first.") };
      case (?profile) {
        let updatedXP = profile.xp + score;
        let updatedProfile = {
          username = profile.username;
          xp = updatedXP;
          level = updatedXP;
          wordsFound = profile.wordsFound + score;
          bestTimes = profile.bestTimes;
          lastLogin = profile.lastLogin;
          completedPuzzles = profile.completedPuzzles;
        };
        gameState.players.add(caller, updatedProfile);
        gameState.leaderBoard.add(caller, updatedXP);
      };
    };
  };

  // Leaderboard
  public query ({ caller }) func getTopPlayers() : async [(Principal, Nat)] {
    let playersList = List.empty<(Principal, Nat)>();
    let iter = gameState.leaderBoard.entries();
    for ((user, xp) in iter) {
      playersList.add((user, xp));
    };
    playersList.toArray();
  };

  // Puzzles
  public shared ({ caller }) func generatePuzzle(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can generate puzzles");
    };
    let puzzle = { id };
    gameState.puzzles.add(id, puzzle);
  };

  public query ({ caller }) func getPuzzle(id : Nat) : async ?PuzzleMeta {
    gameState.puzzles.get(id);
  };

  // Daily Challenge
  public query ({ caller }) func getDailyChallenge(date : Text) : async ?PuzzleMeta {
    dailyChallenges.get(date);
  };

  public shared ({ caller }) func setDailyChallenge(date : Text, puzzle : PuzzleMeta) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    dailyChallenges.add(date, puzzle);
  };
};
