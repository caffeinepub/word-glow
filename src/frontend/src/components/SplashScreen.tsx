import { useEffect, useRef, useState } from "react";

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [iconScale, setIconScale] = useState(0.6);
  const [textOpacity, setTextOpacity] = useState(0);
  const [screenOpacity, setScreenOpacity] = useState(1);
  const doneRef = useRef(false);

  useEffect(() => {
    // Step 1: Icon springs to 1.0 immediately
    const t1 = setTimeout(() => setIconScale(1.0), 30);

    // Step 2: Text fades in at 400ms
    const t2 = setTimeout(() => setTextOpacity(1), 400);

    // Step 3: Screen fades out at 1.8s
    const t3 = setTimeout(() => setScreenOpacity(0), 1800);

    // Step 4: Call onDone after fade completes at 2.2s
    const t4 = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone();
      }
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#FAFAF8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: screenOpacity,
        transition: screenOpacity < 1 ? "opacity 0.4s ease-out" : "none",
        pointerEvents: "none",
      }}
    >
      {/* Icon */}
      <div
        style={{
          transform: `scale(${iconScale})`,
          transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          marginBottom: "20px",
        }}
      >
        <img
          src="/assets/generated/word-glow-icon.dim_512x512.png"
          alt="Word Glow"
          style={{
            width: 96,
            height: 96,
            borderRadius: 22,
            boxShadow: "0 8px 32px oklch(0.55 0.22 270 / 0.25)",
          }}
        />
      </div>

      {/* Text */}
      <div
        style={{
          opacity: textOpacity,
          transition: "opacity 0.6s ease-out",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "#4361EE",
            letterSpacing: "-0.02em",
            margin: 0,
            lineHeight: 1.1,
            fontFamily: "inherit",
          }}
        >
          Word Glow
        </h1>
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#9CA3AF",
            margin: "6px 0 0",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          The Radiant Word Hunt
        </p>
      </div>
    </div>
  );
}
