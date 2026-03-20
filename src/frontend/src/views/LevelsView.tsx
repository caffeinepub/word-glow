import { Clock, Lock, RefreshCw, Star } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { View } from "../App";
import type { Difficulty, Level, PlayerStats } from "../types";
import { CATEGORIES } from "../wordBank";

interface Props {
  navigate: (view: View, level?: Level) => void;
  playerStats: PlayerStats;
}

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    gridSize: number;
    wordCount: number;
    label: string;
    color: string;
    borderClass: string;
  }
> = {
  easy: {
    gridSize: 10,
    wordCount: 8,
    label: "EASY",
    color: "#10B981",
    borderClass: "border-[#10B981]",
  },
  medium: {
    gridSize: 12,
    wordCount: 12,
    label: "MEDIUM",
    color: "#4361EE",
    borderClass: "border-[#4361EE]",
  },
  hard: {
    gridSize: 15,
    wordCount: 16,
    label: "HARD",
    color: "#D97706",
    borderClass: "border-[#D97706]",
  },
  expert: {
    gridSize: 18,
    wordCount: 20,
    label: "EXPERT",
    color: "#EC4899",
    borderClass: "border-[#EC4899]",
  },
  master: {
    gridSize: 18,
    wordCount: 24,
    label: "MASTER",
    color: "#DC2626",
    borderClass: "border-[#DC2626]",
  },
};

export function generateLevels(): Level[] {
  const levels: Level[] = [];
  const difficulties: Difficulty[] = [
    "easy",
    "medium",
    "hard",
    "expert",
    "master",
  ];
  let id = 1;
  for (const diff of difficulties) {
    for (let i = 0; i < 40; i++) {
      const category = CATEGORIES[i % CATEGORIES.length] as Level["category"];
      const config = DIFFICULTY_CONFIG[diff];
      levels.push({
        id: id++,
        difficulty: diff,
        category,
        wordCount: config.wordCount,
        gridSize: config.gridSize,
      });
    }
  }
  return levels;
}

function getStars(levelId: number, bestTimes: Record<number, number>): number {
  if (!bestTimes[levelId]) return 0;
  const t = bestTimes[levelId];
  if (t < 60) return 3;
  if (t < 120) return 2;
  return 1;
}

function formatTime(s: number): string {
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function LevelsView({ navigate, playerStats }: Props) {
  const [activeDiff, setActiveDiff] = useState<Difficulty>("easy");
  const allLevels = generateLevels();
  const filtered = allLevels.filter((l) => l.difficulty === activeDiff);
  const config = DIFFICULTY_CONFIG[activeDiff];

  const isUnlocked = (levelId: number) => {
    if (levelId <= 10) return true;
    return playerStats.levelsCompleted.includes(levelId - 1);
  };

  const isCompleted = (levelId: number) =>
    playerStats.levelsCompleted.includes(levelId);

  return (
    <div className="min-h-screen px-4 pt-6" data-ocid="levels.page">
      <h1
        className="text-2xl font-black uppercase tracking-widest text-center mb-5 font-display"
        style={{ color: "#4361EE" }}
      >
        Levels
      </h1>

      {/* Difficulty Tabs */}
      <div
        className="flex gap-2 justify-center mb-6 flex-wrap"
        data-ocid="levels.tab"
      >
        {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((diff) => {
          const c = DIFFICULTY_CONFIG[diff];
          const active = activeDiff === diff;
          return (
            <button
              type="button"
              key={diff}
              data-ocid={`levels.${diff}.tab`}
              onClick={() => setActiveDiff(diff)}
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-200"
              style={{
                background: active ? `${c.color}15` : "rgba(0,0,0,0.04)",
                border: `2px solid ${active ? c.color : "transparent"}`,
                color: active ? c.color : "#6b7280",
                boxShadow: active ? `0 2px 12px ${c.color}30` : "none",
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Level Grid */}
      <div className="grid grid-cols-4 gap-2 max-w-lg mx-auto pb-4">
        {filtered.map((level, idx) => {
          const unlocked = isUnlocked(level.id);
          const completed = isCompleted(level.id);
          const stars = getStars(level.id, playerStats.bestTimes);
          const bestTime = playerStats.bestTimes[level.id];
          return (
            <motion.button
              type="button"
              key={level.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.02 }}
              data-ocid={`levels.item.${idx + 1}`}
              onClick={() => unlocked && navigate("game", level)}
              disabled={!unlocked}
              className={`relative rounded-xl p-2 pt-3 pb-2 flex flex-col items-center transition-all duration-200 ${
                unlocked
                  ? "active:scale-95 cursor-pointer"
                  : "cursor-not-allowed opacity-40"
              } ${
                completed
                  ? `${config.borderClass} border-2`
                  : "border border-border"
              }`}
              style={{
                background: completed ? `${config.color}10` : "#ffffff",
                boxShadow: completed
                  ? `0 2px 12px ${config.color}25`
                  : "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              {!unlocked && (
                <Lock
                  size={14}
                  className="absolute top-1.5 right-1.5 text-muted-foreground"
                />
              )}
              {completed && (
                <RefreshCw
                  size={10}
                  className="absolute top-1.5 left-1.5"
                  style={{ color: config.color, opacity: 0.7 }}
                />
              )}
              <span
                className="text-lg font-black"
                style={{ color: completed ? config.color : "#374151" }}
              >
                {level.id}
              </span>
              <div className="flex gap-0.5 mt-1">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    size={8}
                    fill={s <= stars ? config.color : "transparent"}
                    stroke={s <= stars ? config.color : "#d1d5db"}
                  />
                ))}
              </div>
              {bestTime ? (
                <span
                  className="flex items-center gap-0.5 text-[8px] font-mono mt-0.5"
                  style={{ color: config.color }}
                >
                  <Clock size={7} />
                  {formatTime(bestTime)}
                </span>
              ) : (
                <span className="text-[8px] text-muted-foreground mt-0.5 truncate w-full text-center">
                  {level.category}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
