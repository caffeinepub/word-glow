import {
  ArrowLeft,
  ChevronRight,
  Eye,
  Lightbulb,
  Music,
  Music2,
  Share2,
  Shuffle,
  SkipForward,
  Snowflake,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { View } from "../App";
import { audioEngine } from "../audioEngine";
import { generateGrid, getWordsForLevel } from "../gameEngine";
import type {
  Cell,
  DifficultyModifiers,
  Level,
  PlacedWord,
  PlayerStats,
} from "../types";
import { WORD_BANK } from "../wordBank";
import { getDefinition } from "../wordDefinitions";

interface Props {
  level: Level;
  customWords?: string[];
  modifiers?: DifficultyModifiers;
  navigate: (view: View, level?: Level) => void;
  playerStats: PlayerStats;
  updateStats: (s: Partial<PlayerStats>) => void;
  xpMultiplier?: number;
}

const NEON_COLORS = ["#4361EE", "#EC4899", "#7C3AED", "#10B981", "#D97706"];

function cellKey(c: Cell) {
  return `${c.row}-${c.col}`;
}

function GridRow({
  row,
  rowIdx,
  cellSize,
  getCellClass,
  onMouseDown,
  onMouseEnter,
}: {
  row: string[];
  rowIdx: number;
  cellSize: number;
  getCellClass: (r: number, c: number) => string;
  onMouseDown: (r: number, c: number) => void;
  onMouseEnter: (r: number, c: number) => void;
}) {
  return (
    <div className="flex">
      {row.map((letter, c) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: grid cells use stable positional indices
          key={`${rowIdx}-${c}`}
          data-row={rowIdx}
          data-col={c}
          className={getCellClass(rowIdx, c)}
          style={{
            width: cellSize,
            height: cellSize,
            fontSize: cellSize * 0.42,
          }}
          onMouseDown={() => onMouseDown(rowIdx, c)}
          onMouseEnter={() => onMouseEnter(rowIdx, c)}
        >
          {letter}
        </div>
      ))}
    </div>
  );
}

export default function GameView({
  level,
  customWords,
  modifiers,
  navigate,
  playerStats,
  updateStats,
  xpMultiplier = 1.0,
}: Props) {
  const mods: DifficultyModifiers = modifiers ?? {
    noWordList: false,
    speedRun: false,
    oneShot: false,
  };

  const words = customWords
    ? customWords
    : getWordsForLevel(level.id, level.category, level.wordCount, WORD_BANK);

  const seed = customWords ? 42 : level.id;
  const { grid: initialGrid, placedWords: initialPlaced } = generateGrid(
    level.gridSize,
    words,
    seed,
  );

  const [grid, setGrid] = useState(initialGrid);
  const [placedWords, setPlacedWords] = useState<PlacedWord[]>(initialPlaced);
  const [selectedCells, setSelectedCells] = useState<Cell[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [startCell, setStartCell] = useState<Cell | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [speedRunFailed, setSpeedRunFailed] = useState(false);
  const [score, setScore] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(4);
  const [hintCell, setHintCell] = useState<string | null>(null);
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [frozenDisplay, setFrozenDisplay] = useState(false);
  const [lastFoundWord, setLastFoundWord] = useState<{
    word: string;
    def: string;
  } | null>(null);
  const [defVisible, setDefVisible] = useState(false);
  const [musicOn, setMusicOn] = useState(
    () => localStorage.getItem("wordglow-music") === "1",
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());
  const frozenRef = useRef(false);
  const frozenSecsRef = useRef(0); // accumulated frozen seconds
  const containerRef = useRef<HTMLDivElement>(null);
  const foundCellsMap = useRef<Map<string, number>>(new Map());
  const defTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelStartTimeRef = useRef(Date.now());

  // Speed run limit
  const SPEED_RUN_LIMIT = 60;

  useEffect(() => {
    audioEngine.setEnabled(musicOn);
    audioEngine.playBackground(musicOn);
    return () => audioEngine.playBackground(false);
  }, [musicOn]);

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    localStorage.setItem("wordglow-music", next ? "1" : "0");
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!frozenRef.current) {
        setElapsedSeconds(
          Math.floor(
            (Date.now() - startTimeRef.current - frozenSecsRef.current * 1000) /
              1000,
          ),
        );
      }
    }, 500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if ((completed || speedRunFailed) && timerRef.current)
      clearInterval(timerRef.current);
  }, [completed, speedRunFailed]);

  // Speed run failure check
  useEffect(() => {
    if (mods.speedRun && elapsedSeconds >= SPEED_RUN_LIMIT && !completed) {
      setSpeedRunFailed(true);
      audioEngine.playBackground(false);
    }
  }, [elapsedSeconds, mods.speedRun, completed]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const getCellFromPoint = useCallback(
    (x: number, y: number): Cell | null => {
      if (!containerRef.current) return null;
      const elements = document.elementsFromPoint(x, y);
      for (const el of elements) {
        const dataset = (el as HTMLElement).dataset;
        if (dataset.row !== undefined && dataset.col !== undefined) {
          const r = Number.parseInt(dataset.row);
          const c = Number.parseInt(dataset.col);
          return { letter: grid[r][c], row: r, col: c };
        }
      }
      return null;
    },
    [grid],
  );

  const getLineCells = useCallback(
    (start: Cell, end: Cell): Cell[] => {
      const dr = end.row - start.row;
      const dc = end.col - start.col;
      const steps = Math.max(Math.abs(dr), Math.abs(dc));
      if (steps === 0) return [start];

      const isDiag = Math.abs(dr) === Math.abs(dc);
      const isHorz = dr === 0;
      const isVert = dc === 0;
      if (!isDiag && !isHorz && !isVert) {
        if (Math.abs(dr) > Math.abs(dc)) {
          return getLineCells(start, { ...end, col: start.col });
        }
        return getLineCells(start, { ...end, row: start.row });
      }

      const srdr = dr === 0 ? 0 : dr / Math.abs(dr);
      const srdc = dc === 0 ? 0 : dc / Math.abs(dc);
      const cells: Cell[] = [];
      for (let i = 0; i <= steps; i++) {
        const r = start.row + srdr * i;
        const c = start.col + srdc * i;
        if (r >= 0 && r < grid.length && c >= 0 && c < grid.length) {
          cells.push({ letter: grid[r][c], row: r, col: c });
        }
      }
      return cells;
    },
    [grid],
  );

  const awardPowerUp = useCallback(
    (currentPowerUps: PlayerStats["powerUps"]) => {
      const total = Object.values(currentPowerUps).reduce((a, b) => a + b, 0);
      if (total >= 3) return currentPowerUps;
      const types: (keyof PlayerStats["powerUps"])[] = [
        "revealWord",
        "freezeTimer",
        "shuffleGrid",
        "skipWord",
      ];
      const chosen = types[Math.floor(Math.random() * types.length)];
      const next = {
        ...currentPowerUps,
        [chosen]: currentPowerUps[chosen] + 1,
      };
      const names: Record<string, string> = {
        revealWord: "Reveal Word",
        freezeTimer: "Freeze Timer",
        shuffleGrid: "Shuffle Grid",
        skipWord: "Skip Word",
      };
      toast.success(`🎁 Power-up earned: ${names[chosen]}!`, {
        duration: 2500,
      });
      return next;
    },
    [],
  );

  const checkWord = useCallback(
    (cells: Cell[]) => {
      const selected = cells.map((c) => c.letter).join("");
      const reversed = selected.split("").reverse().join("");

      const match = placedWords.find(
        (pw) => !pw.found && (pw.word === selected || pw.word === reversed),
      );

      if (match) {
        audioEngine.playWordFound();
        const newPlaced = placedWords.map((pw) =>
          pw.word === match.word ? { ...pw, found: true } : pw,
        );
        setPlacedWords(newPlaced);

        for (const c of match.cells) {
          foundCellsMap.current.set(cellKey(c), match.colorIndex);
        }

        const wordScore = match.word.length * 10;
        setScore((prev) => prev + wordScore);

        const def = getDefinition(match.word);
        setLastFoundWord({ word: match.word, def });
        setDefVisible(true);
        if (defTimerRef.current) clearTimeout(defTimerRef.current);
        defTimerRef.current = setTimeout(() => setDefVisible(false), 3000);

        const allFound = newPlaced.every((pw) => pw.found);
        if (allFound) {
          audioEngine.playLevelComplete();
          setTimeout(() => setCompleted(true), 300);

          const finalElapsed = Math.floor(
            (Date.now() - startTimeRef.current - frozenSecsRef.current * 1000) /
              1000,
          );
          const playTimeSecs = Math.floor(
            (Date.now() - levelStartTimeRef.current) / 1000,
          );
          const timeBonus = Math.max(0, 300 - finalElapsed) * 2;
          const baseXp = Math.floor((score + wordScore + timeBonus) / 10) * 5;
          const speedMult = mods.speedRun ? 1.5 : 1.0;
          const earnedXp = Math.round(baseXp * xpMultiplier * speedMult);

          const newLevelsCompleted = playerStats.levelsCompleted.includes(
            level.id,
          )
            ? playerStats.levelsCompleted
            : [...playerStats.levelsCompleted, level.id];

          const bestTime = playerStats.bestTimes[level.id];
          const newBestTimes = {
            ...playerStats.bestTimes,
            [level.id]: bestTime
              ? Math.min(bestTime, finalElapsed)
              : finalElapsed,
          };

          // Category plays
          const catPlays = { ...(playerStats.categoryPlays || {}) };
          catPlays[level.category] = (catPlays[level.category] || 0) + 1;

          // Award power-up
          const newPowerUps = awardPowerUp(
            playerStats.powerUps || {
              revealWord: 0,
              freezeTimer: 0,
              shuffleGrid: 0,
              skipWord: 0,
            },
          );

          // Track no-hints completion
          const noHintsBonus = hintsLeft === 4 ? 1 : 0;

          // Track speed run completion
          const speedRunBonus = mods.speedRun ? 1 : 0;

          // Record play hour for night owl / early bird achievements
          try {
            const hours: number[] = JSON.parse(
              localStorage.getItem("wordglow-play-hours") || "[]",
            );
            hours.push(new Date().getHours());
            localStorage.setItem(
              "wordglow-play-hours",
              JSON.stringify(hours.slice(-50)),
            );
          } catch {}

          updateStats({
            xp: playerStats.xp + earnedXp,
            totalWords:
              playerStats.totalWords + newPlaced.filter((p) => p.found).length,
            levelsCompleted: newLevelsCompleted,
            bestTimes: newBestTimes,
            level: Math.floor((playerStats.xp + earnedXp) / 1000) + 1,
            categoryPlays: catPlays,
            totalPlayTimeSecs:
              (playerStats.totalPlayTimeSecs || 0) + playTimeSecs,
            powerUps: newPowerUps,
            noHintsCompletions:
              (playerStats.noHintsCompletions || 0) + noHintsBonus,
            speedRunsCompleted:
              (playerStats.speedRunsCompleted || 0) + speedRunBonus,
          });
        }
      } else if (mods.oneShot && cells.length > 1) {
        // One Shot: wrong selection costs a hint
        if (hintsLeft > 0) {
          setHintsLeft((h) => h - 1);
          toast.error("One Shot! Lost a hint.", { duration: 1500 });
        }
      }
    },
    [
      placedWords,
      score,
      playerStats,
      level.id,
      level.category,
      updateStats,
      xpMultiplier,
      mods.oneShot,
      mods.speedRun,
      hintsLeft,
      awardPowerUp,
    ],
  );

  const handlePointerDown = useCallback(
    (r: number, c: number) => {
      audioEngine.playTap();
      const cell = { letter: grid[r][c], row: r, col: c };
      setIsDragging(true);
      setStartCell(cell);
      setSelectedCells([cell]);
    },
    [grid],
  );

  const handlePointerMove = useCallback(
    (r: number, c: number) => {
      if (!isDragging || !startCell) return;
      const endCell = { letter: grid[r][c], row: r, col: c };
      setSelectedCells(getLineCells(startCell, endCell));
    },
    [isDragging, startCell, grid, getLineCells],
  );

  const handlePointerUp = useCallback(() => {
    if (selectedCells.length > 1) {
      checkWord(selectedCells);
    }
    setIsDragging(false);
    setStartCell(null);
    setSelectedCells([]);
  }, [selectedCells, checkWord]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      const cell = getCellFromPoint(t.clientX, t.clientY);
      if (cell) handlePointerMove(cell.row, cell.col);
    },
    [getCellFromPoint, handlePointerMove],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handlePointerUp();
    },
    [handlePointerUp],
  );

  const useHint = () => {
    if (hintsLeft <= 0) return;
    const unfound = placedWords.filter((pw) => !pw.found);
    if (unfound.length === 0) return;
    audioEngine.playHint();
    const target = unfound[Math.floor(Math.random() * unfound.length)];
    const firstCell = target.cells[0];
    const key = cellKey(firstCell);
    setHintCell(key);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHintCell(null), 2000);
    setHintsLeft((h) => h - 1);
  };

  // ---- Power-up handlers ----
  const handleRevealWord = () => {
    const pups = playerStats.powerUps || {
      revealWord: 0,
      freezeTimer: 0,
      shuffleGrid: 0,
      skipWord: 0,
    };
    if (pups.revealWord <= 0) return;
    const unfound = placedWords.filter((pw) => !pw.found);
    if (unfound.length === 0) return;
    const target = unfound[Math.floor(Math.random() * unfound.length)];
    const keys = new Set(target.cells.map(cellKey));
    setRevealedCells(keys);
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    revealTimerRef.current = setTimeout(
      () => setRevealedCells(new Set()),
      3000,
    );
    updateStats({
      powerUps: { ...pups, revealWord: pups.revealWord - 1 },
      powerUpsUsed: (playerStats.powerUpsUsed || 0) + 1,
    });
    toast.success("👁️ Word revealed for 3 seconds!", { duration: 2000 });
  };

  const handleFreezeTimer = () => {
    const pups = playerStats.powerUps || {
      revealWord: 0,
      freezeTimer: 0,
      shuffleGrid: 0,
      skipWord: 0,
    };
    if (pups.freezeTimer <= 0 || frozenRef.current) return;
    frozenRef.current = true;
    setFrozenDisplay(true);
    updateStats({
      powerUps: { ...pups, freezeTimer: pups.freezeTimer - 1 },
      powerUpsUsed: (playerStats.powerUpsUsed || 0) + 1,
    });
    toast.success("❄️ Timer frozen for 15 seconds!", { duration: 2000 });
    if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
    freezeTimerRef.current = setTimeout(() => {
      frozenSecsRef.current += 15;
      frozenRef.current = false;
      setFrozenDisplay(false);
    }, 15000);
  };

  const handleShuffleGrid = () => {
    const pups = playerStats.powerUps || {
      revealWord: 0,
      freezeTimer: 0,
      shuffleGrid: 0,
      skipWord: 0,
    };
    if (pups.shuffleGrid <= 0) return;
    const wordCells = new Set(
      placedWords.flatMap((pw) => pw.cells.map(cellKey)),
    );
    const newGrid = grid.map((row, r) =>
      row.map((letter, c) => {
        if (wordCells.has(`${r}-${c}`)) return letter;
        return String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }),
    );
    setGrid(newGrid);
    updateStats({
      powerUps: { ...pups, shuffleGrid: pups.shuffleGrid - 1 },
      powerUpsUsed: (playerStats.powerUpsUsed || 0) + 1,
    });
    toast.success("🔀 Grid shuffled!", { duration: 1500 });
  };

  const handleSkipWord = () => {
    const pups = playerStats.powerUps || {
      revealWord: 0,
      freezeTimer: 0,
      shuffleGrid: 0,
      skipWord: 0,
    };
    if (pups.skipWord <= 0) return;
    const unfound = placedWords.filter((pw) => !pw.found);
    if (unfound.length === 0) return;
    const target = unfound[Math.floor(Math.random() * unfound.length)];
    const newPlaced = placedWords.map((pw) =>
      pw.word === target.word ? { ...pw, found: true } : pw,
    );
    setPlacedWords(newPlaced);
    for (const c of target.cells) {
      foundCellsMap.current.set(cellKey(c), target.colorIndex);
    }
    const wordScore = target.word.length * 10;
    setScore((prev) => prev + wordScore);
    updateStats({
      powerUps: { ...pups, skipWord: pups.skipWord - 1 },
      powerUpsUsed: (playerStats.powerUpsUsed || 0) + 1,
    });
    toast.success(`⏭️ Skipped: ${target.word}`, { duration: 2000 });

    // Check if all found
    if (newPlaced.every((pw) => pw.found)) {
      audioEngine.playLevelComplete();
      setTimeout(() => setCompleted(true), 300);
    }
  };

  const selectedKeys = new Set(selectedCells.map(cellKey));

  const getCellClass = (r: number, c: number) => {
    const key = `${r}-${c}`;
    if (revealedCells.has(key)) return "grid-cell revealed";
    if (key === hintCell) return "grid-cell hint-flash";
    if (selectedKeys.has(key)) return "grid-cell selected";
    const colorIdx = foundCellsMap.current.get(key);
    if (colorIdx !== undefined) return `grid-cell found-${colorIdx}`;
    return "grid-cell";
  };

  const cellSize = Math.min(
    Math.floor((Math.min(window.innerWidth, 480) - 32) / level.gridSize),
    36,
  );
  const foundCount = placedWords.filter((pw) => pw.found).length;
  const stars = elapsedSeconds < 60 ? 3 : elapsedSeconds < 120 ? 2 : 1;

  const xpEarned = Math.round(
    Math.round(
      Math.floor(score / 10) * 5 * xpMultiplier * (mods.speedRun ? 1.5 : 1.0),
    ),
  );

  const shareText = `🔤 Word Glow - Level ${level.id} (${level.category})
👤 ${playerStats.username}
${"⭐".repeat(stars)}${"☆".repeat(3 - stars)} | Score: ${score} | Time: ${formatTime(elapsedSeconds)}
📝 ${foundCount}/${placedWords.length} words found
Play Word Glow!`;

  const pups = playerStats.powerUps || {
    revealWord: 0,
    freezeTimer: 0,
    shuffleGrid: 0,
    skipWord: 0,
  };
  const speedRunCountdown = mods.speedRun
    ? Math.max(0, SPEED_RUN_LIMIT - elapsedSeconds)
    : null;

  const POWER_UP_BUTTONS = [
    {
      key: "revealWord",
      icon: <Eye size={14} />,
      label: "Reveal",
      count: pups.revealWord,
      color: "#7C3AED",
      bg: "rgba(124,58,237,0.1)",
      action: handleRevealWord,
      title: "Reveal Word",
    },
    {
      key: "freezeTimer",
      icon: <Snowflake size={14} />,
      label: "Freeze",
      count: pups.freezeTimer,
      color: "#4361EE",
      bg: "rgba(67,97,238,0.1)",
      action: handleFreezeTimer,
      title: "Freeze Timer (15s)",
    },
    {
      key: "shuffleGrid",
      icon: <Shuffle size={14} />,
      label: "Shuffle",
      count: pups.shuffleGrid,
      color: "#10B981",
      bg: "rgba(16,185,129,0.1)",
      action: handleShuffleGrid,
      title: "Shuffle Grid",
    },
    {
      key: "skipWord",
      icon: <SkipForward size={14} />,
      label: "Skip",
      count: pups.skipWord,
      color: "#D97706",
      bg: "rgba(217,119,6,0.1)",
      action: handleSkipWord,
      title: "Skip Word",
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      onMouseUp={handlePointerUp}
      onTouchEnd={handleTouchEnd}
      style={{ userSelect: "none" }}
      data-ocid="game.page"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white">
        <button
          type="button"
          data-ocid="game.back.button"
          onClick={() => navigate("levels")}
          className="p-2 rounded-xl bg-muted/50 text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <div className="flex items-center gap-1.5 justify-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              {level.category}
            </p>
            {mods.speedRun && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: "rgba(16,185,129,0.15)",
                  color: "#10B981",
                }}
              >
                SPEED RUN
              </span>
            )}
            {mods.noWordList && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: "rgba(124,58,237,0.12)",
                  color: "#7C3AED",
                }}
              >
                NO LIST
              </span>
            )}
            {mods.oneShot && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: "rgba(236,72,153,0.12)",
                  color: "#EC4899",
                }}
              >
                ONE SHOT
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-foreground">Level {level.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-ocid="game.music.toggle"
            onClick={toggleMusic}
            title={musicOn ? "Music On" : "Music Off"}
            className="p-2 rounded-xl transition-colors"
            style={{
              background: musicOn ? "rgba(67,97,238,0.1)" : "rgba(0,0,0,0.04)",
              color: musicOn ? "#4361EE" : "#9ca3af",
            }}
          >
            {musicOn ? <Music size={16} /> : <Music2 size={16} />}
          </button>
          <div className="text-right">
            {mods.speedRun && speedRunCountdown !== null ? (
              <p
                className="font-mono font-black"
                style={{
                  color: speedRunCountdown <= 15 ? "#EC4899" : "#10B981",
                  fontSize: "1rem",
                }}
              >
                {speedRunCountdown}s
              </p>
            ) : (
              <p
                className="font-mono font-bold"
                style={{ color: frozenDisplay ? "#4361EE" : "#374151" }}
              >
                {frozenDisplay ? "❄️ " : ""}
                {formatTime(elapsedSeconds)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{score} pts</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted/50">
        <motion.div
          className="h-1.5"
          style={{
            background: "linear-gradient(90deg, #4361EE, #7C3AED)",
            width: `${(foundCount / placedWords.length) * 100}%`,
          }}
          animate={{ width: `${(foundCount / placedWords.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Grid */}
      <div className="flex justify-center px-4 pt-4 pb-2">
        <div
          ref={containerRef}
          className="relative"
          style={{ touchAction: "none" }}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {grid.map((row, r) => (
            <GridRow
              // biome-ignore lint/suspicious/noArrayIndexKey: grid rows are stable positional
              key={r}
              row={row}
              rowIdx={r}
              cellSize={cellSize}
              getCellClass={getCellClass}
              onMouseDown={handlePointerDown}
              onMouseEnter={handlePointerMove}
            />
          ))}
        </div>
      </div>

      {/* Power-ups toolbar */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 justify-center">
          {POWER_UP_BUTTONS.map((btn) => (
            <button
              key={btn.key}
              type="button"
              title={btn.title}
              data-ocid={`game.powerup.${btn.key}.button`}
              onClick={btn.action}
              disabled={btn.count === 0}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 flex-1"
              style={{
                background: btn.count > 0 ? btn.bg : "rgba(0,0,0,0.03)",
                border: `1.5px solid ${btn.count > 0 ? `${btn.color}40` : "#e5e7eb"}`,
                color: btn.count > 0 ? btn.color : "#d1d5db",
                opacity: btn.count > 0 ? 1 : 0.5,
              }}
            >
              <div className="flex items-center gap-1">
                {btn.icon}
                <span
                  className="text-xs font-black"
                  style={{ color: btn.count > 0 ? btn.color : "#d1d5db" }}
                >
                  {btn.count}
                </span>
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-wide">
                {btn.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Word Definition popup */}
      <AnimatePresence>
        {defVisible && lastFoundWord && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-4 mb-2 px-4 py-3 rounded-xl"
            style={{
              background: "rgba(67,97,238,0.07)",
              border: "1px solid rgba(67,97,238,0.2)",
            }}
          >
            <span className="font-black text-sm" style={{ color: "#4361EE" }}>
              {lastFoundWord.word}:{" "}
            </span>
            <span className="text-sm text-foreground/80">
              {lastFoundWord.def}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Word List (hidden if noWordList modifier) */}
      {!mods.noWordList && (
        <div className="flex-1 px-4 pb-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Words ({foundCount}/{placedWords.length})
            </p>
            <div className="flex items-center gap-2">
              {xpMultiplier > 1 && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(16,185,129,0.12)",
                    color: "#10B981",
                  }}
                >
                  {xpMultiplier}x XP
                </span>
              )}
              <button
                type="button"
                data-ocid="game.hint.button"
                onClick={useHint}
                disabled={hintsLeft === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background:
                    hintsLeft > 0 ? "rgba(245,158,11,0.1)" : "rgba(0,0,0,0.04)",
                  border: `1px solid ${hintsLeft > 0 ? "#F59E0B" : "#ddd"}`,
                  color: hintsLeft > 0 ? "#D97706" : "#aaa",
                }}
              >
                <Lightbulb size={12} />
                Hint ({hintsLeft})
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {placedWords.map((pw) => (
              <span
                key={pw.word}
                className="px-3 py-1 rounded-lg text-sm font-bold transition-all duration-300"
                style={{
                  background: pw.found
                    ? `${NEON_COLORS[pw.colorIndex]}15`
                    : "rgba(0,0,0,0.04)",
                  color: pw.found ? NEON_COLORS[pw.colorIndex] : "#6b7280",
                  border: `1px solid ${pw.found ? `${NEON_COLORS[pw.colorIndex]}40` : "transparent"}`,
                  textDecoration: pw.found ? "line-through" : "none",
                }}
              >
                {pw.word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* No Word List mode — show minimal progress */}
      {mods.noWordList && (
        <div className="flex-1 px-4 pb-4 flex items-start justify-between">
          <p className="text-sm font-bold text-muted-foreground">
            🙈 Word List Hidden — {foundCount}/{placedWords.length} found
          </p>
          <button
            type="button"
            data-ocid="game.hint.button"
            onClick={useHint}
            disabled={hintsLeft === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background:
                hintsLeft > 0 ? "rgba(245,158,11,0.1)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${hintsLeft > 0 ? "#F59E0B" : "#ddd"}`,
              color: hintsLeft > 0 ? "#D97706" : "#aaa",
            }}
          >
            <Lightbulb size={12} />
            Hint ({hintsLeft})
          </button>
        </div>
      )}

      {/* Speed Run Failed Overlay */}
      <AnimatePresence>
        {speedRunFailed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(240,244,255,0.92)",
              backdropFilter: "blur(8px)",
            }}
            data-ocid="game.failed.modal"
          >
            <motion.div
              initial={{ scale: 0.7, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="mx-4 w-full max-w-sm bg-white rounded-3xl p-8 text-center"
              style={{
                border: "1.5px solid rgba(236,72,153,0.2)",
                boxShadow: "0 12px 48px rgba(236,72,153,0.18)",
              }}
            >
              <div className="text-5xl mb-4">⏰</div>
              <h2
                className="text-3xl font-black mb-2 font-display"
                style={{ color: "#EC4899" }}
              >
                TIME'S UP!
              </h2>
              <p className="text-muted-foreground mb-6">
                Speed Run failed on Level {level.id}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  data-ocid="game.failed.retry.button"
                  onClick={() => navigate("game", level)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm border border-border text-foreground"
                >
                  Retry
                </button>
                <button
                  type="button"
                  data-ocid="game.failed.levels.button"
                  onClick={() => navigate("levels")}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white"
                  style={{
                    background: "linear-gradient(135deg, #EC4899, #7C3AED)",
                  }}
                >
                  Levels
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Complete Overlay */}
      <AnimatePresence>
        {completed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(240,244,255,0.92)",
              backdropFilter: "blur(8px)",
            }}
            data-ocid="game.complete.modal"
          >
            <motion.div
              initial={{ scale: 0.7, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="mx-4 w-full max-w-sm bg-white rounded-3xl p-8"
              style={{
                border: "1.5px solid rgba(67,97,238,0.2)",
                boxShadow: "0 12px 48px rgba(67,97,238,0.18)",
              }}
            >
              <div className="text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h2
                  className="text-3xl font-black mb-2 font-display"
                  style={{ color: "#4361EE" }}
                >
                  LEVEL COMPLETE!
                </h2>
                <p className="text-muted-foreground mb-4">
                  Level {level.id} · {level.category}
                </p>

                <div className="flex justify-center gap-3 mb-4">
                  {[1, 2, 3].map((s) => (
                    <motion.div
                      key={s}
                      initial={{ scale: 0 }}
                      animate={{ scale: s <= stars ? 1 : 0.5 }}
                      transition={{ delay: s * 0.2 }}
                      className="text-4xl"
                    >
                      {s <= stars ? "⭐" : "☆"}
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Score", value: score, color: "#4361EE" },
                    {
                      label: "Time",
                      value: formatTime(elapsedSeconds),
                      color: "#10B981",
                    },
                    {
                      label: "XP Earned",
                      value: `+${xpEarned}`,
                      color: "#D97706",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-surface rounded-xl p-3 text-center"
                    >
                      <p
                        className="text-lg font-black"
                        style={{ color: s.color }}
                      >
                        {s.value}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div
                  className="rounded-2xl p-4 mb-4 text-left"
                  style={{
                    background: "rgba(67,97,238,0.05)",
                    border: "1px solid rgba(67,97,238,0.15)",
                  }}
                >
                  <p className="text-xs font-mono whitespace-pre-line text-foreground/80 leading-relaxed">
                    {shareText}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    data-ocid="game.complete.share.button"
                    onClick={() => {
                      navigator.clipboard.writeText(shareText);
                      toast.success("Results copied to clipboard!");
                    }}
                    className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-border text-foreground"
                  >
                    <Share2 size={16} /> Copy
                  </button>
                  <button
                    type="button"
                    data-ocid="game.complete.next.button"
                    onClick={() => navigate("levels")}
                    className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white"
                    style={{
                      background: "linear-gradient(135deg, #4361EE, #7C3AED)",
                    }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
