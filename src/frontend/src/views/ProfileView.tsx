import {
  BarChart3,
  Check,
  Clock,
  Edit2,
  Flame,
  Trophy,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { View } from "../App";
import type { PlayerStats } from "../types";

interface Props {
  playerStats: PlayerStats;
  updateStats: (s: Partial<PlayerStats>) => void;
  navigate: (view: View) => void;
  xpMultiplier?: number;
}

interface Achievement {
  id: number;
  icon: string;
  label: string;
  category: string;
  hidden?: boolean;
  req: (s: PlayerStats) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  // Progression
  {
    id: 1,
    icon: "🎯",
    label: "First Hunt",
    category: "Progression",
    req: (s) => s.levelsCompleted.length >= 1,
  },
  {
    id: 2,
    icon: "🗺️",
    label: "Explorer",
    category: "Progression",
    req: (s) => s.levelsCompleted.length >= 5,
  },
  {
    id: 3,
    icon: "⚔️",
    label: "Veteran",
    category: "Progression",
    req: (s) => s.levelsCompleted.length >= 20,
  },
  {
    id: 4,
    icon: "💎",
    label: "Elite",
    category: "Progression",
    req: (s) => s.levelsCompleted.length >= 50,
  },
  {
    id: 5,
    icon: "🏆",
    label: "Legend",
    category: "Progression",
    req: (s) => s.levelsCompleted.length >= 100,
  },
  {
    id: 6,
    icon: "👑",
    label: "Completionist",
    category: "Progression",
    req: (s) => s.levelsCompleted.length >= 120,
  },
  // Words Found
  {
    id: 7,
    icon: "🔍",
    label: "Word Seeker",
    category: "Words",
    req: (s) => s.totalWords >= 10,
  },
  {
    id: 8,
    icon: "🦅",
    label: "Word Hunter",
    category: "Words",
    req: (s) => s.totalWords >= 50,
  },
  {
    id: 9,
    icon: "📖",
    label: "Word Master",
    category: "Words",
    req: (s) => s.totalWords >= 200,
  },
  {
    id: 10,
    icon: "📚",
    label: "Lexicon",
    category: "Words",
    req: (s) => s.totalWords >= 500,
  },
  {
    id: 11,
    icon: "🗄️",
    label: "Dictionary",
    category: "Words",
    req: (s) => s.totalWords >= 1000,
  },
  // Streaks
  {
    id: 12,
    icon: "🔥",
    label: "On Fire",
    category: "Streaks",
    req: (s) => s.streak >= 3,
  },
  {
    id: 13,
    icon: "💥",
    label: "Hot Streak",
    category: "Streaks",
    req: (s) => s.streak >= 5,
  },
  {
    id: 14,
    icon: "🗓️",
    label: "Week Warrior",
    category: "Streaks",
    req: (s) => s.streak >= 7,
  },
  {
    id: 15,
    icon: "📅",
    label: "Fortnight Fighter",
    category: "Streaks",
    req: (s) => s.streak >= 14,
  },
  {
    id: 16,
    icon: "🌙",
    label: "Month Master",
    category: "Streaks",
    req: (s) => s.streak >= 30,
  },
  // XP
  {
    id: 17,
    icon: "⭐",
    label: "Rising Star",
    category: "XP",
    req: (s) => s.xp >= 500,
  },
  {
    id: 18,
    icon: "🌟",
    label: "Power Player",
    category: "XP",
    req: (s) => s.xp >= 2000,
  },
  {
    id: 19,
    icon: "💫",
    label: "XP Machine",
    category: "XP",
    req: (s) => s.xp >= 5000,
  },
  {
    id: 20,
    icon: "✨",
    label: "XP Legend",
    category: "XP",
    req: (s) => s.xp >= 10000,
  },
  {
    id: 21,
    icon: "🌠",
    label: "XP Titan",
    category: "XP",
    req: (s) => s.xp >= 25000,
  },
  // Speed
  {
    id: 22,
    icon: "🐇",
    label: "Swift",
    category: "Speed",
    req: (s) => Object.values(s.bestTimes).some((t) => t < 90),
  },
  {
    id: 23,
    icon: "🏎️",
    label: "Speed Demon",
    category: "Speed",
    req: (s) => Object.values(s.bestTimes).some((t) => t < 60),
  },
  {
    id: 24,
    icon: "⚡",
    label: "Lightning",
    category: "Speed",
    req: (s) => Object.values(s.bestTimes).some((t) => t < 30),
  },
  {
    id: 25,
    icon: "💨",
    label: "Flash",
    category: "Speed",
    req: (s) => Object.values(s.bestTimes).some((t) => t < 15),
  },
  // Power-ups
  {
    id: 26,
    icon: "🔋",
    label: "Power Starter",
    category: "Power-ups",
    req: (s) => (s.powerUpsUsed || 0) >= 1,
  },
  {
    id: 27,
    icon: "⚙️",
    label: "Power User",
    category: "Power-ups",
    req: (s) => (s.powerUpsUsed || 0) >= 10,
  },
  {
    id: 28,
    icon: "🔌",
    label: "Power Addict",
    category: "Power-ups",
    req: (s) => (s.powerUpsUsed || 0) >= 25,
  },
  {
    id: 29,
    icon: "🏭",
    label: "Power Champion",
    category: "Power-ups",
    req: (s) => (s.powerUpsUsed || 0) >= 50,
  },
  // Custom Puzzles
  {
    id: 30,
    icon: "🧩",
    label: "Puzzle Maker",
    category: "Custom",
    req: (_s) => {
      try {
        return (
          Number(localStorage.getItem("wordglow-custom-puzzles-played") || 0) >=
          1
        );
      } catch {
        return false;
      }
    },
  },
  // Category Mastery
  {
    id: 31,
    icon: "🐾",
    label: "Animals Ace",
    category: "Mastery",
    req: (s) => (s.categoryPlays?.Animals || 0) >= 5,
  },
  {
    id: 32,
    icon: "⚽",
    label: "Sports Star",
    category: "Mastery",
    req: (s) => (s.categoryPlays?.Sports || 0) >= 5,
  },
  {
    id: 33,
    icon: "🌍",
    label: "Country Explorer",
    category: "Mastery",
    req: (s) => (s.categoryPlays?.Countries || 0) >= 5,
  },
  {
    id: 34,
    icon: "🍕",
    label: "Foodie",
    category: "Mastery",
    req: (s) => (s.categoryPlays?.Food || 0) >= 5,
  },
  {
    id: 35,
    icon: "🔬",
    label: "Science Nerd",
    category: "Mastery",
    req: (s) => (s.categoryPlays?.Science || 0) >= 5,
  },
  {
    id: 36,
    icon: "🎬",
    label: "Movie Buff",
    category: "Mastery",
    req: (s) => (s.categoryPlays?.Movies || 0) >= 5,
  },
  {
    id: 37,
    icon: "📜",
    label: "History Buff",
    category: "Mastery",
    req: (s) => (s.categoryPlays?.History || 0) >= 5,
  },
  {
    id: 38,
    icon: "💻",
    label: "Tech Wizard",
    category: "Mastery",
    req: (s) => (s.categoryPlays?.Technology || 0) >= 5,
  },
  {
    id: 39,
    icon: "🌿",
    label: "Nature Lover",
    category: "Mastery",
    req: (s) => (s.categoryPlays?.Nature || 0) >= 5,
  },
  {
    id: 40,
    icon: "🚀",
    label: "Space Cadet",
    category: "Mastery",
    req: (s) => (s.categoryPlays?.Space || 0) >= 5,
  },
  // Star Mastery
  {
    id: 41,
    icon: "🌟",
    label: "Triple Threat",
    category: "Stars",
    req: (s) => Object.values(s.bestTimes).filter((t) => t < 60).length >= 1,
  },
  {
    id: 42,
    icon: "⭐",
    label: "Gold Rush",
    category: "Stars",
    req: (s) => Object.values(s.bestTimes).filter((t) => t < 60).length >= 5,
  },
  {
    id: 43,
    icon: "🏅",
    label: "Perfectionist",
    category: "Stars",
    req: (s) => Object.values(s.bestTimes).filter((t) => t < 60).length >= 10,
  },
  {
    id: 44,
    icon: "🎖️",
    label: "Grandmaster",
    category: "Stars",
    req: (s) => Object.values(s.bestTimes).filter((t) => t < 60).length >= 20,
  },
  // Hidden / Secret
  {
    id: 45,
    icon: "🦉",
    label: "Night Owl",
    category: "Secret",
    hidden: true,
    req: (_s) => {
      try {
        const h: number[] = JSON.parse(
          localStorage.getItem("wordglow-play-hours") || "[]",
        );
        return h.some((x) => x >= 22);
      } catch {
        return false;
      }
    },
  },
  {
    id: 46,
    icon: "🐦",
    label: "Early Bird",
    category: "Secret",
    hidden: true,
    req: (_s) => {
      try {
        const h: number[] = JSON.parse(
          localStorage.getItem("wordglow-play-hours") || "[]",
        );
        return h.some((x) => x < 7);
      } catch {
        return false;
      }
    },
  },
  {
    id: 47,
    icon: "🏃",
    label: "Marathon",
    category: "Secret",
    hidden: true,
    req: (s) => (s.totalPlayTimeSecs || 0) >= 3600,
  },
  {
    id: 48,
    icon: "⚡",
    label: "Speed Freak",
    category: "Secret",
    hidden: true,
    req: (s) => (s.speedRunsCompleted || 0) >= 1,
  },
  {
    id: 49,
    icon: "🧠",
    label: "No Hints Hero",
    category: "Secret",
    hidden: true,
    req: (s) => (s.noHintsCompletions || 0) >= 1,
  },
  {
    id: 50,
    icon: "💯",
    label: "Halfway There",
    category: "Secret",
    hidden: true,
    req: (s) => s.levelsCompleted.length >= 60,
  },
  {
    id: 51,
    icon: "🎯",
    label: "Sharpshooter",
    category: "Secret",
    hidden: true,
    req: (s) => (s.longestStreak || 1) >= 10,
  },
  {
    id: 52,
    icon: "🌈",
    label: "Collector",
    category: "Secret",
    hidden: true,
    req: (s) => s.totalWords >= 300,
  },
];

function formatPlayTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatBestTime(s: number | null): string {
  if (s === null) return "--:--";
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

const ACH_CATEGORIES = [
  "Progression",
  "Words",
  "Streaks",
  "XP",
  "Speed",
  "Power-ups",
  "Custom",
  "Mastery",
  "Stars",
  "Secret",
];

export default function ProfileView({
  playerStats,
  updateStats,
  xpMultiplier = 1.0,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(playerStats.username);
  const [activeTab, setActiveTab] = useState<"profile" | "stats" | "badges">(
    "profile",
  );
  const [activeBadgeCat, setActiveBadgeCat] = useState("Progression");

  const saveUsername = () => {
    if (username.trim().length < 2) {
      toast.error("Username must be at least 2 characters");
      return;
    }
    updateStats({ username: username.trim() });
    setEditing(false);
    toast.success("Profile updated!");
  };

  const submitToLeaderboard = () => {
    try {
      const raw = localStorage.getItem("wordglow-leaderboard");
      const board: { username: string; xp: number; words: number }[] = raw
        ? JSON.parse(raw)
        : [];
      const idx = board.findIndex((p) => p.username === playerStats.username);
      const entry = {
        username: playerStats.username,
        xp: playerStats.xp,
        words: playerStats.totalWords,
      };
      if (idx >= 0) {
        board[idx] = {
          ...board[idx],
          ...entry,
          xp: Math.max(board[idx].xp, entry.xp),
        };
      } else {
        board.push(entry);
      }
      localStorage.setItem("wordglow-leaderboard", JSON.stringify(board));
      toast.success("Score submitted!");
    } catch {
      toast.error("Failed to submit score.");
    }
  };

  const xpProgress = (playerStats.xp % 1000) / 10;
  const bestTimeVal =
    Object.values(playerStats.bestTimes).length > 0
      ? Math.min(...Object.values(playerStats.bestTimes))
      : null;
  const fastestLevelId =
    bestTimeVal !== null
      ? Number(
          Object.entries(playerStats.bestTimes).find(
            ([, v]) => v === bestTimeVal,
          )?.[0],
        )
      : null;

  const unlockedCount = ACHIEVEMENTS.filter((a) => a.req(playerStats)).length;
  const totalAch = ACHIEVEMENTS.length;

  const avgSolveTime =
    Object.values(playerStats.bestTimes).length > 0
      ? Math.round(
          Object.values(playerStats.bestTimes).reduce((a, b) => a + b, 0) /
            Object.values(playerStats.bestTimes).length,
        )
      : null;

  const mostPlayedCategory = playerStats.categoryPlays
    ? Object.entries(playerStats.categoryPlays).sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0]
    : null;

  const wordsPerMin =
    playerStats.totalPlayTimeSecs > 0
      ? (playerStats.totalWords / (playerStats.totalPlayTimeSecs / 60)).toFixed(
          1,
        )
      : "0.0";

  const filteredBadges = ACHIEVEMENTS.filter(
    (a) => a.category === activeBadgeCat,
  );

  return (
    <div
      className="min-h-screen px-4 pt-6 max-w-lg mx-auto pb-8"
      data-ocid="profile.page"
    >
      <h1
        className="text-2xl font-black uppercase tracking-widest text-center mb-4 font-display"
        style={{ color: "#7C3AED" }}
      >
        Profile
      </h1>

      {/* Avatar + Username */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-4"
      >
        <div className="relative mb-3">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black border-4"
            style={{
              background: "rgba(124,58,237,0.1)",
              borderColor: "#7C3AED",
              color: "#7C3AED",
            }}
          >
            {playerStats.username.charAt(0).toUpperCase()}
          </div>
          <div
            className="absolute -bottom-1 -right-1 rounded-full px-2 py-0.5 text-xs font-bold text-white"
            style={{ background: "#D97706" }}
          >
            Lv.{playerStats.level}
          </div>
        </div>

        {editing ? (
          <div
            className="flex items-center gap-2"
            data-ocid="profile.username.input"
          >
            <input
              data-ocid="profile.input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveUsername()}
              className="bg-white border-2 rounded-xl px-4 py-2 text-center font-bold text-foreground outline-none"
              style={{ borderColor: "#7C3AED" }}
              maxLength={20}
            />
            <button
              type="button"
              data-ocid="profile.save.button"
              onClick={saveUsername}
              className="p-2 rounded-lg"
              style={{ background: "rgba(124,58,237,0.12)", color: "#7C3AED" }}
            >
              <Check size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-foreground">
              {playerStats.username}
            </h2>
            <button
              type="button"
              data-ocid="profile.edit.button"
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground"
            >
              <Edit2 size={14} />
            </button>
          </div>
        )}
      </motion.div>

      {/* XP Bar */}
      <div
        className="bg-white rounded-2xl p-4 mb-4"
        style={{
          border: "1.5px solid rgba(124,58,237,0.18)",
          boxShadow: "0 2px 12px rgba(124,58,237,0.08)",
        }}
      >
        <div className="flex justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Level {playerStats.level}
          </span>
          <span className="text-sm font-bold" style={{ color: "#7C3AED" }}>
            {playerStats.xp.toLocaleString()} XP
          </span>
        </div>
        <div className="w-full bg-muted/40 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="h-3 rounded-full"
            style={{ background: "linear-gradient(90deg, #7C3AED, #EC4899)" }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 text-right">
          {playerStats.xp % 1000}/1000 to next level
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 bg-muted/30 rounded-2xl p-1">
        {(["profile", "stats", "badges"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            data-ocid={`profile.${tab}.tab`}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-200"
            style={{
              background: activeTab === tab ? "white" : "transparent",
              color: activeTab === tab ? "#7C3AED" : "#9ca3af",
              boxShadow:
                activeTab === tab ? "0 1px 6px rgba(124,58,237,0.12)" : "none",
            }}
          >
            {tab === "profile"
              ? "📊 Stats"
              : tab === "stats"
                ? "📈 Dashboard"
                : "🏆 Badges"}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              {
                icon: <Zap size={20} />,
                label: "Words Found",
                value: playerStats.totalWords,
                color: "#4361EE",
                extra: null,
              },
              {
                icon: <Trophy size={20} />,
                label: "Levels Done",
                value: playerStats.levelsCompleted.length,
                color: "#10B981",
                extra: null,
              },
              {
                icon: <Clock size={20} />,
                label: "Best Time",
                value: formatBestTime(bestTimeVal),
                color: "#D97706",
                extra: null,
              },
              {
                icon: <Flame size={20} />,
                label: "Day Streak",
                value: `${playerStats.streak}🔥`,
                color: "#EC4899",
                extra: xpMultiplier > 1 ? `${xpMultiplier}x XP` : null,
              },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="bg-white rounded-2xl p-4"
                style={{
                  border: `1.5px solid ${s.color}20`,
                  boxShadow: `0 2px 10px ${s.color}10`,
                }}
              >
                <div className="mb-2" style={{ color: s.color }}>
                  {s.icon}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-2xl font-black" style={{ color: s.color }}>
                    {s.value}
                  </p>
                  {s.extra && (
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: "rgba(16,185,129,0.12)",
                        color: "#10B981",
                      }}
                    >
                      {s.extra}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Recent Activity */}
          {playerStats.levelsCompleted.length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Recent Activity
              </h3>
              <div className="flex flex-col gap-2">
                {playerStats.levelsCompleted
                  .slice(-5)
                  .reverse()
                  .map((id) => (
                    <div
                      key={id}
                      className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-border"
                    >
                      <span className="text-sm font-bold text-foreground">
                        Level #{id}
                      </span>
                      {playerStats.bestTimes[id] && (
                        <span
                          className="text-xs font-mono"
                          style={{ color: "#10B981" }}
                        >
                          {formatBestTime(playerStats.bestTimes[id])}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          <button
            type="button"
            data-ocid="profile.submit.button"
            onClick={submitToLeaderboard}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm"
            style={{ background: "linear-gradient(135deg, #4361EE, #7C3AED)" }}
          >
            Submit to Leaderboard
          </button>
        </motion.div>
      )}

      {/* Stats Dashboard Tab */}
      {activeTab === "stats" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} style={{ color: "#7C3AED" }} />
            <h3
              className="text-sm font-black uppercase tracking-widest"
              style={{ color: "#7C3AED" }}
            >
              Stats Dashboard
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Total Words",
                value: playerStats.totalWords.toLocaleString(),
                icon: "📝",
                color: "#4361EE",
              },
              {
                label: "Total XP",
                value: playerStats.xp.toLocaleString(),
                icon: "⚡",
                color: "#7C3AED",
              },
              {
                label: "Levels Completed",
                value: playerStats.levelsCompleted.length,
                icon: "🎯",
                color: "#10B981",
              },
              {
                label: "Avg Solve Time",
                value: avgSolveTime ? formatBestTime(avgSolveTime) : "--",
                icon: "⏱️",
                color: "#D97706",
              },
              {
                label: fastestLevelId
                  ? `Fastest (Lv.${fastestLevelId})`
                  : "Fastest Level",
                value: formatBestTime(bestTimeVal),
                icon: "🏎️",
                color: "#EC4899",
              },
              {
                label: "Current Streak",
                value: `${playerStats.streak} days`,
                icon: "🔥",
                color: "#EC4899",
              },
              {
                label: "Longest Streak",
                value: `${playerStats.longestStreak || 1} days`,
                icon: "🏅",
                color: "#D97706",
              },
              {
                label: "Total Play Time",
                value:
                  playerStats.totalPlayTimeSecs > 0
                    ? formatPlayTime(playerStats.totalPlayTimeSecs)
                    : "0m",
                icon: "⏳",
                color: "#4361EE",
              },
              {
                label: "Top Category",
                value: mostPlayedCategory || "—",
                icon: "📂",
                color: "#10B981",
              },
              {
                label: "Power-ups Used",
                value: (playerStats.powerUpsUsed || 0).toString(),
                icon: "🔋",
                color: "#7C3AED",
              },
              {
                label: "Badges Earned",
                value: `${unlockedCount}/${totalAch}`,
                icon: "🏆",
                color: "#D97706",
              },
              {
                label: "Words / Min",
                value: wordsPerMin,
                icon: "📊",
                color: "#EC4899",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl p-3"
                style={{
                  border: `1.5px solid ${stat.color}18`,
                  boxShadow: `0 2px 8px ${stat.color}08`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{stat.icon}</span>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
                <p className="text-lg font-black" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Badges Tab */}
      {activeTab === "badges" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Achievements
            </h3>
            <span
              className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ background: "rgba(245,158,11,0.12)", color: "#D97706" }}
            >
              {unlockedCount} / {totalAch} earned
            </span>
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
            {ACH_CATEGORIES.map((cat) => {
              const catBadges = ACHIEVEMENTS.filter((a) => a.category === cat);
              const catUnlocked = catBadges.filter((a) =>
                a.req(playerStats),
              ).length;
              const active = activeBadgeCat === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  data-ocid={`profile.badge.${cat.toLowerCase()}.tab`}
                  onClick={() => setActiveBadgeCat(cat)}
                  className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: active
                      ? "rgba(124,58,237,0.12)"
                      : "rgba(0,0,0,0.04)",
                    border: `1.5px solid ${active ? "#7C3AED" : "transparent"}`,
                    color: active ? "#7C3AED" : "#6b7280",
                  }}
                >
                  {cat} ({catUnlocked}/{catBadges.length})
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {filteredBadges.map((ach) => {
              const unlocked = ach.req(playerStats);
              const isHidden = ach.hidden && !unlocked;
              return (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl p-3 text-center border transition-all"
                  style={{
                    borderColor: unlocked
                      ? "rgba(245,158,11,0.35)"
                      : "rgba(0,0,0,0.07)",
                    opacity: unlocked ? 1 : 0.45,
                    boxShadow: unlocked
                      ? "0 2px 10px rgba(245,158,11,0.12)"
                      : "none",
                  }}
                >
                  <div
                    className="text-2xl mb-1"
                    style={{ filter: unlocked ? "none" : "grayscale(1)" }}
                  >
                    {isHidden ? "❓" : ach.icon}
                  </div>
                  <p
                    className="text-[10px] font-bold leading-tight"
                    style={{ color: unlocked ? "#D97706" : "#9ca3af" }}
                  >
                    {isHidden ? "???" : ach.label}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
