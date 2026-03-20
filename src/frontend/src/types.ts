export type Difficulty = "easy" | "medium" | "hard" | "expert" | "master";
export type Category =
  | "Animals"
  | "Sports"
  | "Countries"
  | "Food"
  | "Science"
  | "Movies"
  | "History"
  | "Technology"
  | "Nature"
  | "Space"
  | "Music"
  | "Geography"
  | "Mythology"
  | "FamousPeople"
  | "Cars";

export interface Level {
  id: number;
  difficulty: Difficulty;
  category: Category;
  wordCount: number;
  gridSize: number;
}

export interface Cell {
  letter: string;
  row: number;
  col: number;
}

export interface PlacedWord {
  word: string;
  cells: Cell[];
  found: boolean;
  colorIndex: number;
}

export interface GameState {
  level: Level;
  grid: string[][];
  placedWords: PlacedWord[];
  selectedCells: Cell[];
  foundWords: string[];
  startTime: number;
  elapsedSeconds: number;
  completed: boolean;
  score: number;
}

export interface DifficultyModifiers {
  noWordList: boolean;
  speedRun: boolean;
  oneShot: boolean;
}

export interface PlayerStats {
  username: string;
  xp: number;
  level: number;
  totalWords: number;
  levelsCompleted: number[];
  bestTimes: Record<number, number>;
  streak: number;
  lastPlayedDate: string;
  powerUps: {
    revealWord: number;
    freezeTimer: number;
    shuffleGrid: number;
    skipWord: number;
  };
  powerUpsUsed: number;
  categoryPlays: Record<string, number>;
  totalPlayTimeSecs: number;
  longestStreak: number;
  speedRunsCompleted: number;
  noHintsCompletions: number;
}
