import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface PuzzleMeta {
    id: bigint;
}
export interface PlayerProfile {
    xp: bigint;
    bestTimes: Array<[string, Time]>;
    username: string;
    wordsFound: bigint;
    level: bigint;
    completedPuzzles: Array<bigint>;
    lastLogin: Time;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createOrUpdateProfile(username: string): Promise<void>;
    generatePuzzle(id: bigint): Promise<void>;
    getCallerUserProfile(): Promise<PlayerProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyChallenge(date: string): Promise<PuzzleMeta | null>;
    getPuzzle(id: bigint): Promise<PuzzleMeta | null>;
    getTopPlayers(): Promise<Array<[Principal, bigint]>>;
    getUserProfile(user: Principal): Promise<PlayerProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: PlayerProfile): Promise<void>;
    setDailyChallenge(date: string, puzzle: PuzzleMeta): Promise<void>;
    submitScore(puzzleId: bigint, score: bigint, timeTaken: Time): Promise<void>;
}
