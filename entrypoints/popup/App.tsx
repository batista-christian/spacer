import { useState, useEffect } from "react";
import { browser } from "wxt/browser";

type Mode = "off" | "spacing" | "contrast" | "radius";

export default function App() {
  const [mode, setMode] = useState<Mode>("off");

  useEffect(() => {
    // Sync state from content script on popup open
    browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.id) {
        browser.tabs
          .sendMessage(tab.id, { type: "GET_STATE" })
          .then((res) => {
            if (res?.mode) setMode(res.mode);
          })
          .catch(() => {});
      }
    });
  }, []);

  const sendMode = (next: Mode) => {
    setMode(next);
    browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.id) {
        browser.tabs.sendMessage(tab.id, { type: "SET_MODE", mode: next });
      }
    });
  };

  const toggle = (target: "spacing" | "contrast" | "radius") => {
    sendMode(mode === target ? "off" : target);
  };

  return (
    <div
      style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingBottom: 8,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="2"
            y="2"
            width="6"
            height="6"
            rx="1.5"
            stroke="var(--accent)"
            strokeWidth="1.5"
          />
          <rect
            x="12"
            y="12"
            width="6"
            height="6"
            rx="1.5"
            stroke="var(--accent)"
            strokeWidth="1.5"
          />
          <path
            d="M8 5h4M15 8v4"
            stroke="var(--text-muted)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="2 2"
          />
        </svg>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Spacer</span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text-muted)",
            marginLeft: "auto",
          }}
        >
          v0.1
        </span>
      </header>

      <ModeButton
        active={mode === "spacing"}
        onClick={() => toggle("spacing")}
        icon={<SpacingIcon />}
        label="Spacing Inspector"
        description="Hover elements to see margins, padding, and distances"
      />

      <ModeButton
        active={mode === "contrast"}
        onClick={() => toggle("contrast")}
        icon={<ContrastIcon />}
        label="Contrast Checker"
        description="Click any text to check its WCAG contrast ratio"
      />

      <ModeButton
        active={mode === "radius"}
        onClick={() => toggle("radius")}
        icon={<RadiusIcon />}
        label="Radius Audit"
        description="Scan the page for inconsistent border-radius values"
      />

      {mode !== "off" && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text-muted)",
            textAlign: "center",
            padding: "6px 0",
          }}
        >
          {mode === "spacing"
            ? "Hover over elements on the page"
            : mode === "contrast"
              ? "Click any text element on the page"
              : "Scanning for radius inconsistencies\u2026"}
        </div>
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 12px",
        borderRadius: "var(--radius)",
        border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
        background: active ? "var(--accent-dim)" : "var(--surface)",
        textAlign: "left",
        transition: "background 150ms ease-out, border-color 150ms ease-out",
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <span>
        <span style={{ display: "block", fontWeight: 500, fontSize: 13 }}>
          {label}
        </span>
        <span
          style={{
            display: "block",
            fontSize: 11,
            color: "var(--text-muted)",
            marginTop: 2,
          }}
        >
          {description}
        </span>
      </span>
    </button>
  );
}

function SpacingIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 1v16M17 1v16"
        stroke="var(--accent)"
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

function ContrastIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 2a7 7 0 010 14V2z" fill="currentColor" />
    </svg>
  );
}

function RadiusIcon() {
  return (
    <svg
      width="18"
      height="18"
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
