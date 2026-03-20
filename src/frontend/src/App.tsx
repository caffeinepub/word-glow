import { Toaster } from "@/components/ui/sonner";
import { Grid3X3, Home, LayoutGrid, Puzzle, Trophy, User } from "lucide-react";
import { useEffect, useState } from "react";
import DifficultyModal from "./components/DifficultyModal";
import SplashScreen from "./components/SplashScreen";
import TutorialOverlay from "./components/TutorialOverlay";
import WelcomePopup from "./components/WelcomePopup";
import type { DifficultyModifiers, Level, PlayerStats } from "./types";
import CategoriesView from "./views/CategoriesView";
import CustomPuzzleView from "./views/CustomPuzzleView";
import GameView from "./views/GameView";
import HomeView from "./views/HomeView";
import LeaderboardView from "./views/LeaderboardView";
import LevelsView from "./views/LevelsView";
import ProfileView from "./views/ProfileView";

export type View =
  | "home"
  | "game"
  | "levels"
  | "profile"
  | "leaderboard"
  | "categories"
  | "custom";

const DEFAULT_MODIFIERS: DifficultyModifiers = {
  noWordList: false,
  speedRun: false,
  oneShot: false,
};

export const DEFAULT_STATS: PlayerStats = {
  username: "Player",
  xp: 0,
  level: 1,
  totalWords: 0,
  levelsCompleted: [],
  bestTimes: {},
  streak: 1,
  lastPlayedDate: "",
  powerUps: { revealWord: 0, freezeTimer: 0, shuffleGrid: 0, skipWord: 0 },
  powerUpsUsed: 0,
  categoryPlays: {},
  totalPlayTimeSecs: 0,
  longestStreak: 1,
  speedRunsCompleted: 0,
  noHintsCompletions: 0,
};

function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem("wordglow-stats");
    if (raw) return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_STATS };
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function getXpMultiplier(streak: number): number {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.5;
  if (streak >= 7) return 1.25;
  if (streak >= 3) return 1.1;
  return 1.0;
}

interface CustomGame {
  level: Level;
  words: string[];
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<View>("home");
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [customGame, setCustomGame] = useState<CustomGame | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats>(loadStats);
  const [showWelcome, setShowWelcome] = useState(
    () => !localStorage.getItem("wordglow-onboarded"),
  );
  const [showTutorial, setShowTutorial] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<Level | null>(null);
  const [currentModifiers, setCurrentModifiers] =
    useState<DifficultyModifiers>(DEFAULT_MODIFIERS);

  // Streak check on mount
  useEffect(() => {
    const today = todayStr();
    setPlayerStats((prev) => {
      if (prev.lastPlayedDate === today) return prev;
      const prevDate = prev.lastPlayedDate;
      let newStreak = prev.streak;
      if (prevDate) {
        const prevD = new Date(prevDate);
        const todayD = new Date(today);
        const diffDays = Math.round(
          (todayD.getTime() - prevD.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diffDays === 1) {
          newStreak = prev.streak + 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      }
      const newLongest = Math.max(prev.longestStreak ?? 1, newStreak);
      return {
        ...prev,
        streak: newStreak,
        lastPlayedDate: today,
        longestStreak: newLongest,
      };
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("wordglow-stats", JSON.stringify(playerStats));
  }, [playerStats]);

  const navigate = (view: View, level?: Level) => {
    if (view === "game" && level) {
      setPendingLevel(level);
      setCustomGame(null);
      return;
    }
    setCurrentView(view);
  };

  const handleStartWithModifiers = (modifiers: DifficultyModifiers) => {
    if (!pendingLevel) return;
    setCurrentLevel(pendingLevel);
    setCurrentModifiers(modifiers);
    setPendingLevel(null);
    setCurrentView("game");
  };

  const handleCancelDifficulty = () => {
    setPendingLevel(null);
  };

  const updateStats = (stats: Partial<PlayerStats>) => {
    setPlayerStats((prev) => {
      const next = { ...prev, ...stats };
      if (stats.streak !== undefined) {
        next.longestStreak = Math.max(prev.longestStreak ?? 1, stats.streak);
      }
      return next;
    });
  };

  const handleWelcomeSubmit = (username: string) => {
    updateStats({ username });
    localStorage.setItem("wordglow-onboarded", "1");
    setShowWelcome(false);
    setShowTutorial(true);
  };

  const handleTutorialDone = () => {
    localStorage.setItem("wordglow-tutorial-done", "1");
    setShowTutorial(false);
  };

  const handlePlayCustom = (level: Level, words: string[]) => {
    setCustomGame({ level, words });
    setCurrentLevel(level);
    setCurrentModifiers(DEFAULT_MODIFIERS);
    setCurrentView("game");
  };

  const xpMultiplier = getXpMultiplier(playerStats.streak);

  const navItems: { view: View; label: string; icon: React.ReactNode }[] = [
    { view: "home", label: "Home", icon: <Home size={20} /> },
    { view: "categories", label: "Play", icon: <LayoutGrid size={20} /> },
    { view: "levels", label: "Levels", icon: <Grid3X3 size={20} /> },
    { view: "custom", label: "Custom", icon: <Puzzle size={20} /> },
    { view: "leaderboard", label: "Ranks", icon: <Trophy size={20} /> },
    { view: "profile", label: "Profile", icon: <User size={20} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      <Toaster position="top-center" theme="light" />

      {showWelcome && <WelcomePopup onSubmit={handleWelcomeSubmit} />}
      {showTutorial && <TutorialOverlay onDone={handleTutorialDone} />}

      {pendingLevel && (
        <DifficultyModal
          open={true}
          level={pendingLevel}
          onStart={handleStartWithModifiers}
          onCancel={handleCancelDifficulty}
        />
      )}

      <main className="flex-1 pb-20">
        {currentView === "home" && (
          <HomeView navigate={navigate} playerStats={playerStats} />
        )}
        {currentView === "game" && currentLevel && (
          <GameView
            level={currentLevel}
            customWords={customGame?.words}
            modifiers={currentModifiers}
            navigate={(view, level) => {
              setCurrentView(view as View);
              if (level) setCurrentLevel(level);
            }}
            playerStats={playerStats}
            updateStats={updateStats}
            xpMultiplier={xpMultiplier}
          />
        )}
        {currentView === "levels" && (
          <LevelsView navigate={navigate} playerStats={playerStats} />
        )}
        {currentView === "profile" && (
          <ProfileView
            playerStats={playerStats}
            updateStats={updateStats}
            navigate={navigate}
            xpMultiplier={xpMultiplier}
          />
        )}
        {currentView === "leaderboard" && (
          <LeaderboardView playerStats={playerStats} navigate={navigate} />
        )}
        {currentView === "categories" && (
          <CategoriesView navigate={navigate} playerStats={playerStats} />
        )}
        {currentView === "custom" && (
          <CustomPuzzleView
            navigate={navigate}
            playerStats={playerStats}
            onPlayCustom={handlePlayCustom}
          />
        )}
      </main>

      {currentView !== "game" && (
        <nav className="bottom-nav" data-ocid="nav.panel">
          <div className="flex items-center justify-around px-1 py-2">
            {navItems.map((item) => (
              <button
                type="button"
                key={item.view}
                data-ocid={`nav.${item.view}.link`}
                onClick={() => setCurrentView(item.view)}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all duration-200 min-w-0 ${
                  currentView === item.view
                    ? "text-vivid-indigo"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span
                  className={`transition-transform duration-200 ${
                    currentView === item.view ? "scale-110" : ""
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-[9px] font-semibold tracking-wide uppercase">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
