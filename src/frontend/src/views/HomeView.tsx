import { Clock, Download, Star, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { View } from "../App";
import { usePWAInstall } from "../hooks/usePWAInstall";
import type { Level, PlayerStats } from "../types";
import { CATEGORY_ICONS } from "../wordBank";
import { generateLevels } from "./LevelsView";

interface Props {
  navigate: (view: View, level?: Level) => void;
  playerStats: PlayerStats;
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: 3 + ((i * 7) % 7),
  x: (i * 17 + 5) % 97,
  y: (i * 23 + 11) % 93,
  color: ["#4361EE", "#EC4899", "#7C3AED", "#10B981", "#F59E0B"][i % 5],
  dur: `${2 + (i % 3)}s`,
  delay: `${(i * 0.3) % 2}s`,
}));

const FEATURED_CATS = ["Animals", "Space", "Technology", "Nature", "Movies"];
const CAT_ACCENTS: Record<
  string,
  { color: string; border: string; bg: string }
> = {
  Animals: {
    color: "#4361EE",
    border: "border-[#4361EE]",
    bg: "rgba(67,97,238,0.08)",
  },
  Space: {
    color: "#7C3AED",
    border: "border-[#7C3AED]",
    bg: "rgba(124,58,237,0.08)",
  },
  Technology: {
    color: "#4361EE",
    border: "border-[#4361EE]",
    bg: "rgba(67,97,238,0.08)",
  },
  Nature: {
    color: "#10B981",
    border: "border-[#10B981]",
    bg: "rgba(16,185,129,0.08)",
  },
  Movies: {
    color: "#EC4899",
    border: "border-[#EC4899]",
    bg: "rgba(236,72,153,0.08)",
  },
};

export default function HomeView({ navigate, playerStats }: Props) {
  const levels = generateLevels();
  const { canInstall, install } = usePWAInstall();
  const lastLevel =
    playerStats.levelsCompleted.length > 0
      ? Math.max(...playerStats.levelsCompleted) + 1
      : 1;
  const nextLevel = levels.find((l) => l.id === lastLevel) || levels[0];

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      data-ocid="home.page"
    >
      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={
              {
                width: p.size,
                height: p.size,
                left: `${p.x}%`,
                top: `${p.y}%`,
                background: p.color,
                "--dur": p.dur,
                "--delay": p.delay,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="relative z-10 px-4 pt-12 pb-4 max-w-lg mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-block mb-2">
            <span
              className="text-5xl font-black tracking-tighter font-display"
              style={{ color: "#4361EE" }}
            >
              WORD
            </span>
            <span
              className="text-5xl font-black tracking-tighter font-display ml-2"
              style={{ color: "#EC4899" }}
            >
              GLOW
            </span>
          </div>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">
            The Radiant Word Hunt
          </p>
        </motion.div>

        {/* XP Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-card-dark rounded-2xl p-4 mb-5 glow-indigo"
          style={{ border: "1.5px solid rgba(67,97,238,0.15)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold border-2"
                style={{
                  background: "rgba(67,97,238,0.1)",
                  borderColor: "#4361EE",
                  color: "#4361EE",
                }}
              >
                {playerStats.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-foreground">
                  {playerStats.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  Level {playerStats.level}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg" style={{ color: "#4361EE" }}>
                {playerStats.xp.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">XP</p>
            </div>
          </div>
          <div className="w-full bg-muted/50 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(playerStats.xp % 1000) / 10}%` }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="h-2 rounded-full"
              style={{ background: "linear-gradient(90deg, #4361EE, #7C3AED)" }}
            />
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex gap-3 mb-6"
        >
          <button
            type="button"
            data-ocid="home.primary_button"
            onClick={() => navigate("game", nextLevel)}
            className="flex-1 py-4 rounded-2xl font-bold text-lg tracking-wide uppercase transition-all duration-200 active:scale-95 text-white"
            style={{
              background: "linear-gradient(135deg, #4361EE, #7C3AED)",
              boxShadow: "0 4px 16px rgba(67,97,238,0.3)",
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <Zap size={20} fill="white" />
              Play Now
            </span>
          </button>
          <button
            type="button"
            data-ocid="home.secondary_button"
            onClick={() => navigate("levels")}
            className="flex-1 py-4 rounded-2xl font-bold text-lg tracking-wide uppercase transition-all duration-200 active:scale-95"
            style={{
              background: "rgba(236,72,153,0.08)",
              border: "2px solid #EC4899",
              color: "#EC4899",
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <Star size={20} />
              Levels
            </span>
          </button>
        </motion.div>

        {/* Download as App Button */}
        {canInstall && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="mb-4"
          >
            <motion.button
              type="button"
              data-ocid="home.install_app.button"
              onClick={install}
              className="w-full py-3 rounded-2xl font-bold text-sm tracking-wide uppercase transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "2px solid #10B981",
                color: "#10B981",
              }}
            >
              <Download size={18} />
              Download as App
            </motion.button>
          </motion.div>
        )}

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {[
            {
              label: "Words Found",
              value: playerStats.totalWords.toLocaleString(),
              color: "#4361EE",
            },
            {
              label: "Levels Done",
              value: playerStats.levelsCompleted.length,
              color: "#10B981",
            },
            {
              label: "Day Streak",
              value: playerStats.streak,
              color: "#F59E0B",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-card-dark rounded-xl p-3 text-center border"
              style={{ borderColor: `${s.color}25` }}
            >
              <p className="text-xl font-black" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Featured Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Categories
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {FEATURED_CATS.map((cat, i) => {
              const acc = CAT_ACCENTS[cat];
              return (
                <motion.button
                  type="button"
                  key={cat}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.07 }}
                  data-ocid={`home.categories.item.${i + 1}`}
                  onClick={() => navigate("categories")}
                  className="flex-shrink-0 border rounded-xl p-3 text-center transition-all active:scale-95"
                  style={{
                    minWidth: 80,
                    background: acc.bg,
                    borderColor: `${acc.color}40`,
                  }}
                >
                  <div className="text-2xl mb-1">{CATEGORY_ICONS[cat]}</div>
                  <p
                    className="text-[11px] font-semibold"
                    style={{ color: acc.color }}
                  >
                    {cat}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Daily Challenge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-6 bg-card-dark rounded-2xl p-4 flex items-center gap-4"
          style={{ border: "1.5px solid rgba(245,158,11,0.25)" }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: "rgba(245,158,11,0.1)" }}
          >
            ⚡
          </div>
          <div className="flex-1">
            <p className="font-bold" style={{ color: "#D97706" }}>
              Daily Challenge
            </p>
            <p className="text-xs text-muted-foreground">
              Bonus XP · Resets in {24 - new Date().getHours()}h
            </p>
          </div>
          <button
            type="button"
            data-ocid="home.daily_challenge.button"
            onClick={() => {
              const dailyLevel =
                levels[(new Date().getDate() - 1) % levels.length];
              navigate("game", dailyLevel);
            }}
            className="px-4 py-2 rounded-xl font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
          >
            Play
          </button>
        </motion.div>

        {/* Recent activity */}
        {playerStats.levelsCompleted.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-4 bg-card-dark border border-border rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Recent Levels
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {playerStats.levelsCompleted.slice(-5).map((id) => (
                <span
                  key={id}
                  className="px-3 py-1 rounded-lg text-sm font-bold"
                  style={{
                    background: "rgba(67,97,238,0.1)",
                    color: "#4361EE",
                    border: "1px solid rgba(67,97,238,0.2)",
                  }}
                >
                  #{id}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
