import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";

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
      <button
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950 px-3.5 py-1.5 text-[11px] text-zinc-500 shadow-lg select-none hover:border-zinc-700 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
        onClick={handleToggle}
        aria-label="Enable Spacer"
      >
        <span className="size-1.5 rounded-full bg-zinc-500" />
        <span>Spacer</span>
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-xl border border-zinc-800 bg-zinc-950 p-1 font-sans text-xs text-zinc-200 shadow-lg select-none"
      role="toolbar"
      aria-label="Spacer toolbar"
    >
      <button
        className={cn(
          "flex size-7 cursor-pointer items-center justify-center rounded-lg",
          "hover:bg-zinc-800 hover:text-zinc-200",
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange-500",
          enabled ? "text-green-500" : "text-zinc-500",
        )}
        onClick={handleToggle}
        aria-label="Disable Spacer"
        aria-pressed={enabled}
      >
        <PowerIcon />
      </button>

      <span className="mx-0.5 h-5 w-px shrink-0 bg-zinc-800" />

      <ToolbarButton
        active={mode === "spacing"}
        onClick={() => handleMode("spacing")}
        icon={<SpacingIcon />}
        label="Spacing"
      />

      <ToolbarButton
        active={mode === "radius"}
        onClick={() => handleMode("radius")}
        icon={<RadiusIcon />}
        label="Radius"
      />
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      className={cn(
        "flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium leading-none whitespace-nowrap",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange-500",
        active
          ? "bg-orange-500/12 text-orange-500"
          : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200",
      )}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className="flex size-4 shrink-0 items-center justify-center">
        {icon}
      </span>
      {label}
    </button>
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
