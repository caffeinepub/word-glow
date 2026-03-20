import { Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { View } from "../App";

import type { Level, PlayerStats } from "../types";

interface Props {
  navigate: (view: View, level?: Level) => void;
  playerStats: PlayerStats;
  onPlayCustom: (level: Level, words: string[]) => void;
}

interface SavedPuzzle {
  title: string;
  words: string[];
}

function loadSaved(): SavedPuzzle[] {
  try {
    const raw = localStorage.getItem("wordglow-custom-puzzles");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function savePuzzle(puzzle: SavedPuzzle) {
  const saved = loadSaved();
  const existing = saved.findIndex((p) => p.title === puzzle.title);
  if (existing >= 0) saved[existing] = puzzle;
  else saved.push(puzzle);
  localStorage.setItem("wordglow-custom-puzzles", JSON.stringify(saved));
}

function deletePuzzle(title: string) {
  const saved = loadSaved().filter((p) => p.title !== title);
  localStorage.setItem("wordglow-custom-puzzles", JSON.stringify(saved));
}

export default function CustomPuzzleView({ onPlayCustom }: Props) {
  const [title, setTitle] = useState("");
  const [wordsText, setWordsText] = useState("");
  const [saved, setSaved] = useState<SavedPuzzle[]>(loadSaved);

  useEffect(() => {
    setSaved(loadSaved());
  }, []);

  const words = wordsText
    .split("\n")
    .map((w) =>
      w
        .trim()
        .toUpperCase()
        .replace(/[^A-Z]/g, ""),
    )
    .filter((w) => w.length >= 3)
    .slice(0, 15);

  const validate = (): string | null => {
    if (title.trim().length === 0) return "Please enter a puzzle title.";
    if (words.length < 3)
      return "Enter at least 3 valid words (letters only, 3+ chars).";
    return null;
  };

  const handlePlay = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    const customLevel: Level = {
      id: 999,
      difficulty: "easy",
      category: "Custom" as never,
      wordCount: words.length,
      gridSize: 12,
    };
    onPlayCustom(customLevel, words);
  };

  const handleSave = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    savePuzzle({ title: title.trim(), words });
    setSaved(loadSaved());
    toast.success("Puzzle saved!");
  };

  const handleDelete = (t: string) => {
    deletePuzzle(t);
    setSaved(loadSaved());
    toast.success("Puzzle deleted.");
  };

  const handlePlaySaved = (puzzle: SavedPuzzle) => {
    const customLevel: Level = {
      id: 999,
      difficulty: "easy",
      category: "Custom" as never,
      wordCount: puzzle.words.length,
      gridSize: 12,
    };
    onPlayCustom(customLevel, puzzle.words);
  };

  return (
    <div
      className="min-h-screen px-4 pt-6 max-w-lg mx-auto pb-8"
      data-ocid="custom.page"
    >
      <h1
        className="text-2xl font-black uppercase tracking-widest text-center mb-6 font-display"
        style={{ color: "#7C3AED" }}
      >
        Custom Puzzle
      </h1>

      {/* Builder Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-5 mb-6"
        style={{
          border: "1.5px solid rgba(124,58,237,0.18)",
          boxShadow: "0 2px 12px rgba(124,58,237,0.08)",
        }}
      >
        <label
          htmlFor="puzzle-title"
          className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5"
        >
          Puzzle Title
        </label>
        <input
          id="puzzle-title"
          data-ocid="custom.input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={30}
          placeholder="My Word Puzzle"
          className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none mb-4 bg-background"
          style={{ borderColor: "rgba(124,58,237,0.25)" }}
        />

        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="puzzle-words"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
          >
            Words (one per line)
          </label>
          <span
            className="text-xs font-bold"
            style={{ color: words.length >= 15 ? "#EC4899" : "#7C3AED" }}
          >
            {words.length}/15
          </span>
        </div>
        <textarea
          id="puzzle-words"
          data-ocid="custom.textarea"
          value={wordsText}
          onChange={(e) => setWordsText(e.target.value)}
          placeholder={"OCEAN\nVOLCANO\nFOREST\n..."}
          rows={8}
          className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-mono outline-none resize-none bg-background mb-4"
          style={{ borderColor: "rgba(124,58,237,0.25)" }}
        />

        {words.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {words.map((w) => (
              <span
                key={w}
                className="px-2 py-0.5 rounded-lg text-xs font-bold"
                style={{ background: "rgba(124,58,237,0.1)", color: "#7C3AED" }}
              >
                {w}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            data-ocid="custom.save.button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm border"
            style={{ borderColor: "rgba(124,58,237,0.3)", color: "#7C3AED" }}
          >
            Save
          </button>
          <button
            type="button"
            data-ocid="custom.primary_button"
            onClick={handlePlay}
            className="flex-2 flex-grow py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg, #4361EE, #7C3AED)" }}
          >
            ▶ Play Now
          </button>
        </div>
      </motion.div>

      {/* Saved Puzzles */}
      {saved.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Saved Puzzles
          </h3>
          <div className="flex flex-col gap-2" data-ocid="custom.list">
            {saved.map((puzzle, i) => (
              <motion.div
                key={puzzle.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                data-ocid={`custom.item.${i + 1}`}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">
                    {puzzle.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {puzzle.words.length} words
                  </p>
                </div>
                <button
                  type="button"
                  data-ocid={`custom.delete_button.${i + 1}`}
                  onClick={() => handleDelete(puzzle.title)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
                <button
                  type="button"
                  data-ocid={`custom.secondary_button.${i + 1}`}
                  onClick={() => handlePlaySaved(puzzle)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #4361EE, #7C3AED)",
                  }}
                >
                  Play
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
