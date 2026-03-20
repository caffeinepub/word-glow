import type { Cell, PlacedWord } from "./types";

const DIRECTIONS = [
  [0, 1], // right
  [1, 0], // down
  [1, 1], // diagonal down-right
  [1, -1], // diagonal down-left
  [0, -1], // left
  [-1, 0], // up
  [-1, 1], // diagonal up-right
  [-1, -1], // diagonal up-left
] as const;

function canPlace(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dr: number,
  dc: number,
): boolean {
  const size = grid.length;
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    if (grid[r][c] !== "" && grid[r][c] !== word[i]) return false;
  }
  return true;
}

function placeWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dr: number,
  dc: number,
): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    grid[r][c] = word[i];
    cells.push({ letter: word[i], row: r, col: c });
  }
  return cells;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function generateGrid(
  size: number,
  words: string[],
  seed = 42,
): { grid: string[][]; placedWords: PlacedWord[] } {
  const rand = seededRandom(seed);
  const grid: string[][] = Array.from({ length: size }, () =>
    Array(size).fill(""),
  );
  const placedWords: PlacedWord[] = [];

  // Sort words by length descending for better placement
  const sorted = [...words].sort((a, b) => b.length - a.length);

  for (let wi = 0; wi < sorted.length; wi++) {
    const word = sorted[wi];
    let placed = false;
    // Try 100 random positions
    for (let attempt = 0; attempt < 100 && !placed; attempt++) {
      const row = Math.floor(rand() * size);
      const col = Math.floor(rand() * size);
      const dirIdx = Math.floor(rand() * DIRECTIONS.length);
      const [dr, dc] = DIRECTIONS[dirIdx];
      if (canPlace(grid, word, row, col, dr, dc)) {
        const cells = placeWord(grid, word, row, col, dr, dc);
        placedWords.push({ word, cells, found: false, colorIndex: wi % 5 });
        placed = true;
      }
    }
  }

  // Fill empty cells with random letters
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === "") {
        grid[r][c] = letters[Math.floor(rand() * 26)];
      }
    }
  }

  return { grid, placedWords };
}

export function getWordsForLevel(
  levelId: number,
  category: string,
  wordCount: number,
  wordBank: Record<string, string[]>,
): string[] {
  const words = wordBank[category] || [];
  const rand = seededRandom(levelId * 31337);
  const shuffled = [...words].sort(() => rand() - 0.5);
  // Filter by reasonable length for the grid
  return shuffled
    .filter((w) => w.length >= 3 && w.length <= 12)
    .slice(0, wordCount);
}
