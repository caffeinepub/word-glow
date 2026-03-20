import { Crown, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { View } from "../App";
import type { PlayerStats } from "../types";

interface Props {
  playerStats: PlayerStats;
  navigate: (view: View) => void;
}

const BASE_MOCK_PLAYERS = [
  { username: "NeonHunter", xp: 18420, words: 847 },
  { username: "GlowMaster", xp: 15830, words: 723 },
  { username: "CyberSeeker", xp: 14210, words: 689 },
  { username: "WordPhantom", xp: 12650, words: 612 },
  { username: "NightStalker", xp: 11290, words: 554 },
  { username: "StarGazer", xp: 9870, words: 478 },
  { username: "CryptWord", xp: 8540, words: 421 },
  { username: "NeonRider", xp: 7320, words: 368 },
  { username: "GridBreaker", xp: 6180, words: 301 },
  { username: "PulseHunter", xp: 5090, words: 248 },
];

const RANK_COLORS = ["#D97706", "#6b7280", "#b45309"];
const RANK_ICONS = ["👑", "🥈", "🥉"];

function buildPlayers() {
  let stored: { username: string; xp: number; words: number }[] = [];
  try {
    const raw = localStorage.getItem("wordglow-leaderboard");
    if (raw) stored = JSON.parse(raw);
  } catch {}
  const merged = new Map<
    string,
    { username: string; xp: number; words: number }
  >();
  for (const p of BASE_MOCK_PLAYERS) merged.set(p.username, p);
  for (const p of stored) {
    const existing = merged.get(p.username);
    if (!existing || p.xp > existing.xp) merged.set(p.username, p);
  }
  return [...merged.values()]
    .sort((a, b) => b.xp - a.xp)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

export default function LeaderboardView({ playerStats }: Props) {
  const [allPlayers, setAllPlayers] = useState(buildPlayers);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setAllPlayers(buildPlayers());
    setTimeout(() => setRefreshing(false), 1200);
  };

  const top3 = [allPlayers[1], allPlayers[0], allPlayers[2]].filter(Boolean);
  const podiumOrder = [1, 0, 2];

  return (
    <div
      className="min-h-screen px-4 pt-6 max-w-lg mx-auto"
      data-ocid="leaderboard.page"
    >
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-black uppercase tracking-widest font-display"
          style={{ color: "#D97706" }}
        >
          Top Players
        </h1>
        <button
          type="button"
          data-ocid="leaderboard.refresh.button"
          onClick={handleRefresh}
          className={`p-2 rounded-xl bg-muted/50 text-muted-foreground hover:text-foreground transition-all ${
            refreshing ? "animate-spin-slow" : ""
          }`}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Podium Top 3 */}
      <div className="flex items-end justify-center gap-3 mb-6">
        {top3.map((player, i) => {
          const podiumIdx = podiumOrder[i];
          const heights = ["h-20", "h-28", "h-16"];
          return (
            <motion.div
              key={player.username}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className={`flex-1 ${heights[i]} rounded-t-2xl flex flex-col items-center justify-end pb-3 border-t-2`}
              style={{
                background: `${RANK_COLORS[podiumIdx]}12`,
                borderColor: RANK_COLORS[podiumIdx],
                boxShadow: `0 4px 16px ${RANK_COLORS[podiumIdx]}25`,
              }}
            >
              <span className="text-xl mb-1">{RANK_ICONS[podiumIdx]}</span>
              <p
                className="text-xs font-bold truncate w-full text-center px-1"
                style={{ color: RANK_COLORS[podiumIdx] }}
              >
                {player.username}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {(player.xp / 1000).toFixed(1)}K
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Full Ranking */}
      <div className="flex flex-col gap-2" data-ocid="leaderboard.list">
        {allPlayers.map((player, i) => {
          const isTop3 = i < 3;
          const isMe = player.username === playerStats.username;
          return (
            <motion.div
              key={player.username}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              data-ocid={`leaderboard.item.${i + 1}`}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 border transition-all"
              style={{
                background: isMe ? "rgba(67,97,238,0.06)" : "#ffffff",
                borderColor: isMe ? "rgba(67,97,238,0.3)" : "rgba(0,0,0,0.07)",
                boxShadow: isMe
                  ? "0 2px 12px rgba(67,97,238,0.12)"
                  : "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{
                  background: isTop3
                    ? `${RANK_COLORS[i]}15`
                    : "rgba(0,0,0,0.04)",
                  color: isTop3 ? RANK_COLORS[i] : "#6b7280",
                }}
              >
                {isTop3 ? <Crown size={14} /> : player.rank}
              </div>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{
                  background: isMe
                    ? "rgba(67,97,238,0.12)"
                    : "rgba(124,58,237,0.1)",
                  color: isMe ? "#4361EE" : "#7C3AED",
                  border: `2px solid ${isMe ? "rgba(67,97,238,0.3)" : "rgba(124,58,237,0.25)"}`,
                }}
              >
                {player.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-bold text-sm truncate"
                  style={{ color: isMe ? "#4361EE" : "#111827" }}
                >
                  {player.username} {isMe && "(You)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {player.words} words found
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p
                  className="font-black text-sm"
                  style={{ color: isTop3 ? RANK_COLORS[i] : "#374151" }}
                >
                  {player.xp.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">XP</p>
              </div>
            </motion.div>
          );
        })}

        {/* Player entry if not in list */}
        {!allPlayers.find((p) => p.username === playerStats.username) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 border"
            style={{
              background: "rgba(67,97,238,0.06)",
              borderColor: "rgba(67,97,238,0.3)",
              boxShadow: "0 2px 12px rgba(67,97,238,0.12)",
            }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm bg-muted/50 text-muted-foreground">
              --
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
              style={{
                background: "rgba(67,97,238,0.12)",
                color: "#4361EE",
                border: "2px solid rgba(67,97,238,0.3)",
              }}
            >
              {playerStats.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: "#4361EE" }}>
                {playerStats.username} (You)
              </p>
              <p className="text-xs text-muted-foreground">
                {playerStats.totalWords} words found
              </p>
            </div>
            <div className="text-right">
              <p className="font-black text-sm text-foreground">
                {playerStats.xp.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">XP</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
