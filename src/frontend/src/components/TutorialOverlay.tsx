import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface TutorialOverlayProps {
  onDone: () => void;
}

// 5x5 demo grid with GLOW placed at row 2, cols 0-3
const RANDOM_LETTERS = "ABCDEFHJKMNPQRSTUVWXYZ";
function randomLetter() {
  return RANDOM_LETTERS[Math.floor(Math.random() * RANDOM_LETTERS.length)];
}

function buildDemoGrid(): string[][] {
  const grid: string[][] = [];
  for (let r = 0; r < 5; r++) {
    const row: string[] = [];
    for (let c = 0; c < 5; c++) {
      row.push(randomLetter());
    }
    grid.push(row);
  }
  grid[2][0] = "G";
  grid[2][1] = "L";
  grid[2][2] = "O";
  grid[2][3] = "W";
  return grid;
}

const DEMO_GRID = buildDemoGrid();
const GLOW_CELLS = [
  [2, 0],
  [2, 1],
  [2, 2],
  [2, 3],
];

function isGlowCell(r: number, c: number) {
  return GLOW_CELLS.some(([gr, gc]) => gr === r && gc === c);
}

function cellKey(r: number, c: number) {
  return `${r}-${c}`;
}

export default function TutorialOverlay({ onDone }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragPath, setDragPath] = useState<[number, number][]>([]);
  const [glowFound, setGlowFound] = useState(false);
  const [step1Success, setStep1Success] = useState(false);
  const dragStarted = useRef(false);

  const checkGlow = useCallback((path: [number, number][]) => {
    if (path.length < 4) return false;
    const last4 = path.slice(-4);
    return (
      last4[0][0] === 2 &&
      last4[0][1] === 0 &&
      last4[1][0] === 2 &&
      last4[1][1] === 1 &&
      last4[2][0] === 2 &&
      last4[2][1] === 2 &&
      last4[3][0] === 2 &&
      last4[3][1] === 3
    );
  }, []);

  const handleCellMouseDown = (r: number, c: number) => {
    if (glowFound) return;
    dragStarted.current = true;
    setIsDragging(true);
    setDragPath([[r, c]]);
    setSelectedCells(new Set([cellKey(r, c)]));
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    if (!isDragging || !dragStarted.current || glowFound) return;
    setDragPath((prev) => {
      const lastCell = prev[prev.length - 1];
      if (lastCell && lastCell[0] === r && lastCell[1] === c) return prev;
      const newPath = [...prev, [r, c] as [number, number]];
      setSelectedCells(new Set(newPath.map(([pr, pc]) => cellKey(pr, pc))));
      return newPath;
    });
  };

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    dragStarted.current = false;
    setIsDragging(false);
    if (checkGlow(dragPath)) {
      setGlowFound(true);
      setStep1Success(true);
      setTimeout(() => setStep(1), 1200);
    } else {
      setSelectedCells(new Set());
      setDragPath([]);
    }
  }, [isDragging, dragPath, checkGlow]);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  const cellStyle = (r: number, c: number) => {
    const key = cellKey(r, c);
    const isGlow = isGlowCell(r, c);
    const isSelected = selectedCells.has(key);
    const isFound = glowFound && isGlow;

    if (isFound)
      return "bg-emerald-400 text-white border-emerald-500 scale-105 shadow-md";
    if (isSelected && isGlow)
      return "bg-indigo-500 text-white border-indigo-600 scale-105";
    if (isSelected) return "bg-indigo-200 text-indigo-800 border-indigo-400";
    if (isGlow && !glowFound)
      return "bg-indigo-50 text-indigo-700 border-indigo-300";
    return "bg-white text-slate-700 border-slate-200";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(99,102,241,0.15)",
        backdropFilter: "blur(8px)",
      }}
      data-ocid="tutorial.modal"
    >
      <motion.div
        initial={{ scale: 0.92, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        style={{ border: "1.5px solid rgba(99,102,241,0.15)" }}
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-5 pb-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                width: i === step ? 24 : 8,
                backgroundColor:
                  i === step ? "#4361EE" : i < step ? "#A5B4FC" : "#E2E8F0",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="h-2 rounded-full"
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <Step1
              key="step1"
              grid={DEMO_GRID}
              cellStyle={cellStyle}
              handleCellMouseDown={handleCellMouseDown}
              handleCellMouseEnter={handleCellMouseEnter}
              step1Success={step1Success}
              glowFound={glowFound}
            />
          )}
          {step === 1 && <Step2 key="step2" onNext={() => setStep(2)} />}
          {step === 2 && <Step3 key="step3" onDone={onDone} />}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

interface Step1Props {
  grid: string[][];
  cellStyle: (r: number, c: number) => string;
  handleCellMouseDown: (r: number, c: number) => void;
  handleCellMouseEnter: (r: number, c: number) => void;
  step1Success: boolean;
  glowFound: boolean;
}

function Step1({
  grid,
  cellStyle,
  handleCellMouseDown,
  handleCellMouseEnter,
  step1Success,
  glowFound,
}: Step1Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="px-6 pb-7 pt-2 flex flex-col items-center gap-4"
    >
      <div className="text-center">
        <span className="text-xs font-bold tracking-widest text-indigo-500 uppercase">
          Step 1 of 3
        </span>
        <h2 className="text-xl font-bold text-slate-800 mt-1">
          Select Letters
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Drag across connected letters to select a word
        </p>
      </div>

      <div
        className="select-none cursor-pointer"
        style={{ userSelect: "none" }}
      >
        {grid.map((row, r) => (
          <div key={cellKey(r, -1)} className="flex">
            {row.map((letter, c) => (
              <motion.div
                key={cellKey(r, c)}
                onMouseDown={() => handleCellMouseDown(r, c)}
                onMouseEnter={() => handleCellMouseEnter(r, c)}
                animate={
                  glowFound && isGlowCell(r, c) ? { scale: 1.1 } : { scale: 1 }
                }
                className={`w-12 h-12 m-0.5 rounded-xl border-2 flex items-center justify-center font-bold text-sm transition-all duration-150 select-none cursor-pointer ${cellStyle(r, c)}`}
              >
                {letter}
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      {!glowFound && (
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.2 }}
          className="flex items-center gap-1 text-indigo-500 text-xs font-semibold"
        >
          <span>👆</span>
          <span>Start from the G and drag right!</span>
        </motion.div>
      )}

      {step1Success && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-2 text-sm font-semibold"
        >
          <span>✅</span> Great job! You found GLOW!
        </motion.div>
      )}
    </motion.div>
  );
}

function Step2({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="px-6 pb-7 pt-2 flex flex-col items-center gap-4"
    >
      <div className="text-center">
        <span className="text-xs font-bold tracking-widest text-indigo-500 uppercase">
          Step 2 of 3
        </span>
        <h2 className="text-xl font-bold text-slate-800 mt-1">
          Words Get Highlighted
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Found words light up on the grid and get crossed off the list
        </p>
      </div>

      <div className="select-none">
        {DEMO_GRID.map((row, r) => (
          <div key={cellKey(r, -1)} className="flex">
            {row.map((letter, c) => {
              const isGlow = isGlowCell(r, c);
              return (
                <motion.div
                  key={cellKey(r, c)}
                  initial={{ scale: isGlow ? 0.8 : 1, opacity: isGlow ? 0 : 1 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: isGlow ? 0.1 + c * 0.08 : 0 }}
                  className={`w-12 h-12 m-0.5 rounded-xl border-2 flex items-center justify-center font-bold text-sm ${
                    isGlow
                      ? "bg-indigo-500 text-white border-indigo-600 shadow-md"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  {letter}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-2"
      >
        <div className="relative px-4 py-1.5 rounded-full bg-indigo-100 border-2 border-indigo-400">
          <span className="text-indigo-700 font-bold text-sm tracking-widest line-through decoration-2 decoration-indigo-500">
            GLOW
          </span>
        </div>
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, type: "spring" }}
          className="text-emerald-500 text-lg"
        >
          ✓
        </motion.span>
      </motion.div>

      <button
        type="button"
        data-ocid="tutorial.next.button"
        onClick={onNext}
        className="w-full mt-2 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors"
      >
        Got it →
      </button>
    </motion.div>
  );
}

function Step3({ onDone }: { onDone: () => void }) {
  const levels = [
    {
      label: "Easy",
      range: "Levels 1–30",
      grid: "10×10",
      color: "bg-emerald-500",
      border: "border-emerald-200",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Medium",
      range: "Levels 31–60",
      grid: "13×13",
      color: "bg-orange-500",
      border: "border-orange-200",
      bg: "bg-orange-50",
      text: "text-orange-700",
      badge: "bg-orange-100 text-orange-700",
    },
    {
      label: "Expert",
      range: "Levels 61–120",
      grid: "18×18",
      color: "bg-violet-600",
      border: "border-violet-200",
      bg: "bg-violet-50",
      text: "text-violet-700",
      badge: "bg-violet-100 text-violet-700",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="px-6 pb-7 pt-2 flex flex-col items-center gap-4"
    >
      <div className="text-center">
        <span className="text-xs font-bold tracking-widest text-indigo-500 uppercase">
          Step 3 of 3
        </span>
        <h2 className="text-xl font-bold text-slate-800 mt-1">Level Up!</h2>
        <p className="text-sm text-slate-500 mt-1">
          Complete levels to unlock harder challenges and earn XP
        </p>
      </div>

      <div className="flex gap-2 w-full">
        {levels.map((lvl, i) => (
          <motion.div
            key={lvl.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.1 + i * 0.12,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            className={`flex-1 flex flex-col items-center gap-1.5 rounded-2xl border-2 ${lvl.border} ${lvl.bg} p-3`}
          >
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${lvl.badge}`}
            >
              {lvl.label}
            </span>
            <div
              className={`w-10 h-10 rounded-lg ${lvl.color} opacity-80 flex items-center justify-center`}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-label={`${lvl.label} difficulty grid`}
                role="img"
              >
                {[0, 1, 2].map((row) =>
                  [0, 1, 2].map((col) => (
                    <rect
                      key={`${row}-${col}`}
                      x={2 + col * 7}
                      y={2 + row * 7}
                      width="5"
                      height="5"
                      rx="1"
                      fill="white"
                      fillOpacity="0.85"
                    />
                  )),
                )}
              </svg>
            </div>
            <span
              className={`text-[10px] font-semibold ${lvl.text} text-center leading-tight`}
            >
              {lvl.range}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {lvl.grid}
            </span>
          </motion.div>
        ))}
      </div>

      <button
        type="button"
        data-ocid="tutorial.start.button"
        onClick={onDone}
        className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-200"
      >
        Start Playing 🚀
      </button>
    </motion.div>
  );
}
