import { motion } from "motion/react";
import type { View } from "../App";
import type { Level, PlayerStats } from "../types";
import { CATEGORY_ICONS, WORD_BANK } from "../wordBank";
import { generateLevels } from "./LevelsView";

interface Props {
  navigate: (view: View, level?: Level) => void;
  playerStats: PlayerStats;
}

const CAT_STYLES: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  Animals: {
    color: "#4361EE",
    bg: "rgba(67,97,238,0.07)",
    border: "rgba(67,97,238,0.2)",
  },
  Sports: {
    color: "#10B981",
    bg: "rgba(16,185,129,0.07)",
    border: "rgba(16,185,129,0.2)",
  },
  Countries: {
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.07)",
    border: "rgba(124,58,237,0.2)",
  },
  Food: {
    color: "#D97706",
    bg: "rgba(245,158,11,0.07)",
    border: "rgba(245,158,11,0.25)",
  },
  Science: {
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.07)",
    border: "rgba(124,58,237,0.2)",
  },
  Movies: {
    color: "#EC4899",
    bg: "rgba(236,72,153,0.07)",
    border: "rgba(236,72,153,0.2)",
  },
  History: {
    color: "#D97706",
    bg: "rgba(245,158,11,0.07)",
    border: "rgba(245,158,11,0.25)",
  },
  Technology: {
    color: "#4361EE",
    bg: "rgba(67,97,238,0.07)",
    border: "rgba(67,97,238,0.2)",
  },
  Nature: {
    color: "#10B981",
    bg: "rgba(16,185,129,0.07)",
    border: "rgba(16,185,129,0.2)",
  },
  Space: {
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.07)",
    border: "rgba(124,58,237,0.2)",
  },
  Music: {
    color: "#EC4899",
    bg: "rgba(236,72,153,0.07)",
    border: "rgba(236,72,153,0.2)",
  },
  Geography: {
    color: "#4361EE",
    bg: "rgba(67,97,238,0.07)",
    border: "rgba(67,97,238,0.2)",
  },
  Mythology: {
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.07)",
    border: "rgba(124,58,237,0.2)",
  },
  FamousPeople: {
    color: "#D97706",
    bg: "rgba(245,158,11,0.07)",
    border: "rgba(245,158,11,0.25)",
  },
  Cars: {
    color: "#06B6D4",
    bg: "rgba(6,182,212,0.07)",
    border: "rgba(6,182,212,0.2)",
  },
};

const DEFAULT_STYLE = {
  color: "#4361EE",
  bg: "rgba(67,97,238,0.07)",
  border: "rgba(67,97,238,0.2)",
};

export default function CategoriesView({ navigate, playerStats }: Props) {
  const allLevels = generateLevels();

  const handleCategoryTap = (cat: string) => {
    const catLevels = allLevels.filter((l) => l.category === cat);
    const nextInCat =
      catLevels.find((l) => !playerStats.levelsCompleted.includes(l.id)) ||
      catLevels[0];
    navigate("game", nextInCat);
  };

  return (
    <div className="min-h-screen px-4 pt-6" data-ocid="categories.page">
      <h1
        className="text-2xl font-black uppercase tracking-widest text-center mb-2 font-display"
        style={{ color: "#EC4899" }}
      >
        Categories
      </h1>
      <p className="text-center text-muted-foreground text-sm mb-6">
        Choose your word universe
      </p>

      <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto pb-4">
        {Object.keys(WORD_BANK).map((cat, i) => {
          const style = CAT_STYLES[cat] ?? DEFAULT_STYLE;
          const catLevels = allLevels.filter((l) => l.category === cat);
          const completedCount = catLevels.filter((l) =>
            playerStats.levelsCompleted.includes(l.id),
          ).length;
          const wordCount = WORD_BANK[cat].length;

          return (
            <motion.button
              type="button"
              key={cat}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 200 }}
              data-ocid={`categories.item.${i + 1}`}
              onClick={() => handleCategoryTap(cat)}
              className="relative overflow-hidden rounded-2xl p-4 text-left active:scale-95 transition-transform duration-150 border"
              style={{
                background: style.bg,
                borderColor: style.border,
                boxShadow: `0 2px 16px ${style.color}12`,
              }}
            >
              <div
                className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-15 blur-xl"
                style={{
                  background: style.color,
                  transform: "translate(25%, -25%)",
                }}
              />
              <div className="relative">
                <div className="text-3xl mb-2">{CATEGORY_ICONS[cat]}</div>
                <h3
                  className="font-black text-base mb-0.5"
                  style={{ color: style.color }}
                >
                  {cat}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {wordCount}+ words
                </p>
                <div className="w-full bg-muted/50 rounded-full h-1.5 mb-1">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      background: style.color,
                      width:
                        catLevels.length > 0
                          ? `${(completedCount / catLevels.length) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {completedCount}/{catLevels.length} levels
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
