import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface WelcomePopupProps {
  onSubmit: (username: string) => void;
}

const NAME_REGEX = /^[a-zA-Z0-9 \-_]+$/;

export default function WelcomePopup({ onSubmit }: WelcomePopupProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const validate = (value: string): string => {
    const trimmed = value.trim();
    if (trimmed.length < 2) return "Name must be at least 2 characters.";
    if (!NAME_REGEX.test(trimmed))
      return "Only letters, numbers, spaces, hyphens, and underscores allowed.";
    return "";
  };

  const handleSubmit = () => {
    const err = validate(name);
    if (err) {
      setError(err);
      return;
    }
    onSubmit(name.trim());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (error) setError(validate(e.target.value));
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      >
        {/* Card */}
        <motion.div
          key="card"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="bg-card border border-border rounded-3xl shadow-xl w-full max-w-sm px-7 py-8 flex flex-col items-center gap-5"
          data-ocid="welcome.dialog"
        >
          {/* Emoji + Heading */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-5xl select-none">🔤</span>
            <h1 className="text-2xl font-bold text-foreground tracking-tight text-center">
              Welcome to <span className="text-primary">Word Glow!</span>
            </h1>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Before you start hunting words, tell us what to call you.
            </p>
          </div>

          {/* Input */}
          <div className="w-full flex flex-col gap-2">
            <label
              htmlFor="welcome-name"
              className="text-sm font-semibold text-foreground"
            >
              Your display name
            </label>
            <Input
              id="welcome-name"
              data-ocid="welcome.input"
              placeholder="e.g. WordWizard"
              value={name}
              onChange={handleChange}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              maxLength={24}
              className="rounded-xl text-base"
              autoFocus
            />
            {error && (
              <p
                className="text-xs text-destructive font-medium"
                data-ocid="welcome.error_state"
              >
                {error}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            data-ocid="welcome.submit_button"
            className="w-full rounded-xl text-base font-bold py-5"
            onClick={handleSubmit}
          >
            Let's Play! 🚀
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
