import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { motion } from "motion/react";
import { useState } from "react";
import type { DifficultyModifiers, Level } from "../types";

interface Props {
  open: boolean;
  level: Level;
  onStart: (modifiers: DifficultyModifiers) => void;
  onCancel: () => void;
}

const MODIFIER_INFO = [
  {
    key: "noWordList" as keyof DifficultyModifiers,
    icon: "🙈",
    label: "No Word List",
    desc: "Grid only — no hints shown",
    bonus: null,
    xp: null,
  },
  {
    key: "speedRun" as keyof DifficultyModifiers,
    icon: "⚡",
    label: "Speed Run",
    desc: "60 second countdown",
    bonus: "+50% XP",
    xp: 1.5,
  },
  {
    key: "oneShot" as keyof DifficultyModifiers,
    icon: "💀",
    label: "One Shot",
    desc: "Wrong selections cost 1 hint",
    bonus: null,
    xp: null,
  },
];

export default function DifficultyModal({
  open,
  level,
  onStart,
  onCancel,
}: Props) {
  const [modifiers, setModifiers] = useState<DifficultyModifiers>({
    noWordList: false,
    speedRun: false,
    oneShot: false,
  });

  const toggle = (key: keyof DifficultyModifiers) => {
    setModifiers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalXpBonus = modifiers.speedRun ? 1.5 : 1.0;
  const anyActive =
    modifiers.noWordList || modifiers.speedRun || modifiers.oneShot;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        className="max-w-sm mx-auto rounded-3xl p-0 overflow-hidden"
        style={{ border: "1.5px solid rgba(67,97,238,0.2)" }}
        data-ocid="difficulty.modal"
      >
        <div
          className="px-6 pt-6 pb-2"
          style={{
            background:
              "linear-gradient(135deg, rgba(67,97,238,0.06) 0%, rgba(124,58,237,0.04) 100%)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="text-3xl mb-2">⚔️</div>
              <p
                className="text-lg font-black font-display"
                style={{ color: "#4361EE" }}
              >
                Level {level.id}
              </p>
              <p className="text-sm text-muted-foreground font-normal">
                {level.category} · {level.difficulty.toUpperCase()}
              </p>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Difficulty Modifiers
          </p>
          <div className="flex flex-col gap-3">
            {MODIFIER_INFO.map((mod) => {
              const active = modifiers[mod.key];
              return (
                <motion.div
                  key={mod.key}
                  animate={{ scale: active ? 1.01 : 1 }}
                  className="flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer"
                  style={{
                    background: active
                      ? "rgba(67,97,238,0.06)"
                      : "rgba(0,0,0,0.02)",
                    borderColor: active
                      ? "rgba(67,97,238,0.3)"
                      : "rgba(0,0,0,0.08)",
                  }}
                  onClick={() => toggle(mod.key)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{mod.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">
                          {mod.label}
                        </p>
                        {mod.bonus && (
                          <Badge
                            className="text-[10px] px-1.5 py-0"
                            style={{
                              background: "rgba(16,185,129,0.15)",
                              color: "#10B981",
                              border: "none",
                            }}
                          >
                            {mod.bonus}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {mod.desc}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={active}
                    onCheckedChange={() => toggle(mod.key)}
                    onClick={(e) => e.stopPropagation()}
                    data-ocid={`difficulty.${mod.key}.switch`}
                  />
                </motion.div>
              );
            })}
          </div>

          {anyActive && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 rounded-xl text-center"
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.25)",
              }}
            >
              <p className="text-xs font-bold" style={{ color: "#D97706" }}>
                {totalXpBonus > 1
                  ? `⚡ ${totalXpBonus}× XP multiplier active`
                  : "💡 Challenge mode active"}
              </p>
            </motion.div>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 rounded-xl"
            data-ocid="difficulty.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onStart(modifiers)}
            className="flex-1 rounded-xl font-bold text-white"
            style={{ background: "linear-gradient(135deg, #4361EE, #7C3AED)" }}
            data-ocid="difficulty.confirm_button"
          >
            Play!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
