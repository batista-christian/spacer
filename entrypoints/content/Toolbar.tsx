import { useState, useEffect, useCallback } from "react";

type Mode = "off" | "spacing" | "contrast" | "radius";

interface ToolbarProps {
  initialMode: Mode;
  onModeChange: (mode: Mode) => void;
}

export default function Toolbar({ initialMode, onModeChange }: ToolbarProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [enabled, setEnabled] = useState(initialMode !== "off");

  useEffect(() => {
    setMode(initialMode);
    setEnabled(initialMode !== "off");
  }, [initialMode]);

  // Listen for mode changes from popup
  useEffect(() => {
    const handler = (msg: unknown) => {
      const data = msg as { type?: string; mode?: Mode };
      if (data.type === "SYNC_MODE" && data.mode) {
        setMode(data.mode);
        setEnabled(data.mode !== "off");
      }
    };
    browser.runtime.onMessage.addListener(handler);
    return () => browser.runtime.onMessage.removeListener(handler);
  }, []);

  const handleToggle = useCallback(() => {
    if (enabled) {
      setEnabled(false);
      setMode("off");
      onModeChange("off");
    } else {
      setEnabled(true);
      setMode("spacing");
      onModeChange("spacing");
    }
  }, [enabled, onModeChange]);

  const handleMode = useCallback(
    (target: "spacing" | "contrast" | "radius") => {
      if (!enabled) return;
      const next = mode === target ? "off" : target;
      setMode(next);
      if (next === "off") setEnabled(false);
      onModeChange(next);
    },
    [enabled, mode, onModeChange],
  );

  if (!enabled) {
    return (
      <div className="spacer-toolbar-anchor">
        <button
          className="spacer-badge"
          onClick={handleToggle}
          aria-label="Enable Spacer"
        >
          <span className="spacer-badge-dot" />
          <span>Spacer</span>
        </button>
      </div>
    );
  }

  return (
    <div className="spacer-toolbar-anchor">
      <div
        className="spacer-toolbar"
        role="toolbar"
        aria-label="Spacer toolbar"
      >
        <button
          className="spacer-power-btn"
          data-active={enabled}
          onClick={handleToggle}
          aria-label="Disable Spacer"
          aria-pressed={enabled}
        >
          <PowerIcon />
        </button>

        <span className="spacer-divider" />

        <button
          className="spacer-btn"
          data-active={mode === "spacing"}
          onClick={() => handleMode("spacing")}
          aria-pressed={mode === "spacing"}
        >
          <span className="spacer-btn-icon">
            <SpacingIcon />
          </span>
          Spacing
        </button>

        <button
          className="spacer-btn"
          data-active={mode === "radius"}
          onClick={() => handleMode("radius")}
          aria-pressed={mode === "radius"}
        >
          <span className="spacer-btn-icon">
            <RadiusIcon />
          </span>
          Radius
        </button>
      </div>
    </div>
  );
}

function PowerIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 1v5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4.2 3.2A5 5 0 107 13a5 5 0 002.8-9.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SpacingIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 1v16M17 1v16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M5 9h8M5 7v4M13 7v4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RadiusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 12V6a4 4 0 014-4h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16 6v6a4 4 0 01-4 4H6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 2"
      />
    </svg>
  );
}
