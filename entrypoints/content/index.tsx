import "./toolbar.css";
import ReactDOM from "react-dom/client";
import Toolbar from "./Toolbar";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  cssInjectionMode: "ui",

  async main(ctx) {
    let mode: "off" | "spacing" | "contrast" | "radius" = "off";
    let overlay: HTMLDivElement | null = null;
    let tooltip: HTMLDivElement | null = null;
    let lastTarget: Element | null = null;
    let radiusAbort = false;

    // ── Toolbar UI via Shadow DOM ──
    const toolbarUi = await createShadowRootUi(ctx, {
      name: "spacer-toolbar",
      position: "inline",
      anchor: "body",
      onMount(container, shadow, shadowHost) {
        // Host is just a pass-through — no positioning here so page CSS can't break it
        shadowHost.style.cssText =
          "display:block;position:static;width:0;height:0;overflow:visible;pointer-events:none;";

        // Inner html/body wrappers: invisible to layout
        for (const tag of ["html", "head", "body"] as const) {
          const el = shadow.querySelector(tag) as HTMLElement | null;
          if (el) {
            el.style.cssText =
              "display:contents !important;overflow:visible !important;";
          }
        }
        if (container instanceof HTMLElement) {
          container.style.cssText =
            "display:contents !important;overflow:visible !important;";
        }

        // Fixed positioning lives here, inside the shadow root where page styles can't touch it
        const wrapper = document.createElement("div");
        wrapper.style.cssText =
          "position:fixed;top:4px;left:4px;z-index:9999999;pointer-events:auto;";
        container.append(wrapper);
        const root = ReactDOM.createRoot(wrapper);
        root.render(
          <Toolbar
            initialMode={mode}
            onModeChange={(newMode) => {
              activate(newMode);
              browser.runtime
                .sendMessage({ type: "SYNC_MODE", mode: newMode })
                .catch(() => {});
            }}
          />,
        );
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });

    toolbarUi.mount();

    // ── Helpers ──
    /** Returns true if the element belongs to the toolbar shadow host */
    function isToolbarElement(el: Element | null): boolean {
      if (!el) return true;
      const host = toolbarUi.shadowHost;
      return el === host || host.contains(el);
    }

    // ── Overlay container ──
    function ensureOverlay() {
      if (overlay) return overlay;
      overlay = document.createElement("div");
      overlay.id = "__spacer-overlay";
      overlay.style.cssText =
        "position:fixed;inset:0;pointer-events:none;z-index:2147483646;";
      document.documentElement.appendChild(overlay);
      return overlay;
    }

    function ensureTooltip() {
      if (tooltip) return tooltip;
      tooltip = document.createElement("div");
      tooltip.id = "__spacer-tooltip";
      tooltip.style.cssText = `
        position:fixed;z-index:2147483647;pointer-events:none;
        font-family:'DM Mono',monospace;font-size:11px;line-height:1.5;
        background:#0e0f11;color:#e4e4e7;border:1px solid #2a2c32;
        border-radius:8px;padding:8px 10px;max-width:280px;
        box-shadow:0 4px 24px rgba(0,0,0,0.5);
        opacity:0;transition:opacity 100ms ease-out;
      `;
      document.documentElement.appendChild(tooltip);
      return tooltip;
    }

    function cleanup() {
      radiusAbort = true;
      overlay?.remove();
      tooltip?.remove();
      overlay = null;
      tooltip = null;
      lastTarget = null;
      document.removeEventListener("mousemove", onMouseMove, true);
      document.removeEventListener("click", onClickContrast, true);
      document.body.style.cursor = "";
    }

    // ── Spacing mode ──
    function drawSpacingOverlay(el: Element) {
      const o = ensureOverlay();
      const t = ensureTooltip();
      o.innerHTML = "";

      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(el);

      const mt = parseFloat(cs.marginTop) || 0;
      const mr = parseFloat(cs.marginRight) || 0;
      const mb = parseFloat(cs.marginBottom) || 0;
      const ml = parseFloat(cs.marginLeft) || 0;
      const pt = parseFloat(cs.paddingTop) || 0;
      const pr = parseFloat(cs.paddingRight) || 0;
      const pb = parseFloat(cs.paddingBottom) || 0;
      const pl = parseFloat(cs.paddingLeft) || 0;

      drawBox(
        o,
        rect,
        "rgba(249,115,22,0.15)",
        "1px solid rgba(249,115,22,0.6)",
      );

      if (pt > 0)
        drawBox(
          o,
          { top: rect.top, left: rect.left, width: rect.width, height: pt },
          "rgba(34,197,94,0.18)",
          "none",
        );
      if (pb > 0)
        drawBox(
          o,
          {
            top: rect.bottom - pb,
            left: rect.left,
            width: rect.width,
            height: pb,
          },
          "rgba(34,197,94,0.18)",
          "none",
        );
      if (pl > 0)
        drawBox(
          o,
          { top: rect.top, left: rect.left, width: pl, height: rect.height },
          "rgba(34,197,94,0.18)",
          "none",
        );
      if (pr > 0)
        drawBox(
          o,
          {
            top: rect.top,
            left: rect.right - pr,
            width: pr,
            height: rect.height,
          },
          "rgba(34,197,94,0.18)",
          "none",
        );

      if (mt > 0)
        drawBox(
          o,
          {
            top: rect.top - mt,
            left: rect.left,
            width: rect.width,
            height: mt,
          },
          "rgba(59,130,246,0.18)",
          "none",
        );
      if (mb > 0)
        drawBox(
          o,
          { top: rect.bottom, left: rect.left, width: rect.width, height: mb },
          "rgba(59,130,246,0.18)",
          "none",
        );
      if (ml > 0)
        drawBox(
          o,
          {
            top: rect.top,
            left: rect.left - ml,
            width: ml,
            height: rect.height,
          },
          "rgba(59,130,246,0.18)",
          "none",
        );
      if (mr > 0)
        drawBox(
          o,
          { top: rect.top, left: rect.right, width: mr, height: rect.height },
          "rgba(59,130,246,0.18)",
          "none",
        );

      drawLabel(
        o,
        rect.left + rect.width / 2,
        rect.top - 6,
        `${Math.round(rect.width)}`,
        "#f97316",
      );
      drawLabel(
        o,
        rect.right + 6,
        rect.top + rect.height / 2,
        `${Math.round(rect.height)}`,
        "#f97316",
      );

      const lines: string[] = [];
      lines.push(
        `<b style="color:#f97316">${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}</b>`,
      );
      lines.push(
        `<span style="color:#71717a">size</span> ${Math.round(rect.width)} × ${Math.round(rect.height)}`,
      );
      if (mt || mr || mb || ml)
        lines.push(
          `<span style="color:#3b82f6">margin</span> ${mt} ${mr} ${mb} ${ml}`,
        );
      if (pt || pr || pb || pl)
        lines.push(
          `<span style="color:#22c55e">padding</span> ${pt} ${pr} ${pb} ${pl}`,
        );

      const gap = cs.gap && cs.gap !== "normal" ? cs.gap : null;
      const display = cs.display;
      const isFlexOrGrid =
        display === "flex" ||
        display === "inline-flex" ||
        display === "grid" ||
        display === "inline-grid";

      if (gap && isFlexOrGrid) drawGapIndicators(o, el, cs);
      if (gap) lines.push(`<span style="color:#d946ef">gap</span> ${gap}`);
      if (isFlexOrGrid)
        lines.push(`<span style="color:#71717a">display</span> ${display}`);

      t.innerHTML = lines.join("<br>");
      t.style.opacity = "1";

      let tx = rect.right + 12;
      let ty = rect.top;
      if (tx + 280 > window.innerWidth) tx = rect.left - 280 - 12;
      if (tx < 4) tx = 4;
      if (ty + 120 > window.innerHeight) ty = window.innerHeight - 130;
      if (ty < 4) ty = 4;
      t.style.left = tx + "px";
      t.style.top = ty + "px";
    }

    // ── Figma-style gap indicators ──
    function drawGapIndicators(
      parent: HTMLElement,
      el: Element,
      cs: CSSStyleDeclaration,
    ) {
      const children = Array.from(el.children).filter((child) => {
        const s = getComputedStyle(child);
        return (
          s.display !== "none" &&
          s.visibility !== "hidden" &&
          s.position !== "absolute" &&
          s.position !== "fixed"
        );
      });
      if (children.length < 2) return;

      const isColumn =
        cs.flexDirection === "column" || cs.flexDirection === "column-reverse";
      let direction: "row" | "column" = "row";
      if (isColumn) {
        direction = "column";
      } else if (cs.display === "grid" || cs.display === "inline-grid") {
        const firstRect = children[0].getBoundingClientRect();
        const secondRect = children[1].getBoundingClientRect();
        direction =
          Math.abs(secondRect.top - firstRect.top) >
          Math.abs(secondRect.left - firstRect.left)
            ? "column"
            : "row";
      }

      for (let i = 0; i < children.length - 1; i++) {
        const a = children[i].getBoundingClientRect();
        const b = children[i + 1].getBoundingClientRect();
        let gapRect: {
          top: number;
          left: number;
          width: number;
          height: number;
        } | null = null;
        let gapSize = 0;

        if (direction === "row") {
          const gapLeft = Math.min(a.right, b.right);
          const gapRight = Math.max(a.left, b.left);
          gapSize = gapRight - gapLeft;
          if (gapSize > 0.5) {
            const top = Math.min(a.top, b.top);
            const bottom = Math.max(a.bottom, b.bottom);
            gapRect = {
              top,
              left: gapLeft,
              width: gapSize,
              height: bottom - top,
            };
          }
        } else {
          const gapTop = Math.min(a.bottom, b.bottom);
          const gapBottom = Math.max(a.top, b.top);
          gapSize = gapBottom - gapTop;
          if (gapSize > 0.5) {
            const left = Math.min(a.left, b.left);
            const right = Math.max(a.right, b.right);
            gapRect = {
              top: gapTop,
              left,
              width: right - left,
              height: gapSize,
            };
          }
        }

        if (gapRect && gapSize > 0.5) {
          drawGapRect(parent, gapRect, direction);
          drawLabel(
            parent,
            gapRect.left + gapRect.width / 2,
            gapRect.top + gapRect.height / 2,
            `${Math.round(gapSize)}`,
            "#d946ef",
          );
        }
      }
    }

    function drawGapRect(
      parent: HTMLElement,
      r: { top: number; left: number; width: number; height: number },
      direction: "row" | "column",
    ) {
      const d = document.createElement("div");
      const angle = direction === "row" ? "90deg" : "0deg";
      const stripe = `repeating-linear-gradient(${angle},rgba(217,70,239,0.12) 0px,rgba(217,70,239,0.12) 2px,rgba(217,70,239,0.04) 2px,rgba(217,70,239,0.04) 6px)`;
      d.style.cssText = `position:fixed;top:${r.top}px;left:${r.left}px;width:${r.width}px;height:${r.height}px;background:${stripe};border:1px dashed rgba(217,70,239,0.5);pointer-events:none;`;
      parent.appendChild(d);
    }

    function drawBox(
      parent: HTMLElement,
      r: { top: number; left: number; width: number; height: number },
      bg: string,
      border: string,
    ) {
      const d = document.createElement("div");
      d.style.cssText = `position:fixed;top:${r.top}px;left:${r.left}px;width:${r.width}px;height:${r.height}px;background:${bg};border:${border};pointer-events:none;`;
      parent.appendChild(d);
    }

    function drawLabel(
      parent: HTMLElement,
      x: number,
      y: number,
      text: string,
      color: string,
    ) {
      const d = document.createElement("div");
      d.textContent = text;
      d.style.cssText = `position:fixed;left:${x}px;top:${y}px;transform:translate(-50%,-50%);font-family:'DM Mono',monospace;font-size:10px;font-variant-numeric:tabular-nums;color:${color};background:#0e0f11;padding:1px 4px;border-radius:3px;border:1px solid ${color}44;pointer-events:none;white-space:nowrap;`;
      parent.appendChild(d);
    }

    // ── Contrast mode ──
    function checkContrast(el: Element) {
      const t = ensureTooltip();
      const cs = getComputedStyle(el);
      const o = ensureOverlay();
      o.innerHTML = "";

      const fg = parseColor(cs.color);
      const bg = getEffectiveBackground(el);
      const rect = el.getBoundingClientRect();

      if (!fg || !bg) {
        t.innerHTML =
          '<span style="color:#ef4444">Could not determine colors</span>';
        t.style.opacity = "1";
        return;
      }

      const ratio = contrastRatio(relativeLuminance(fg), relativeLuminance(bg));
      const ratioStr = ratio.toFixed(2);
      const aaLarge = ratio >= 3;
      const aaNormal = ratio >= 4.5;
      const aaaLarge = ratio >= 4.5;
      const aaaNormal = ratio >= 7;

      drawBox(
        o,
        rect,
        "rgba(249,115,22,0.1)",
        "2px solid rgba(249,115,22,0.5)",
      );

      const fgHex = rgbToHex(fg);
      const bgHex = rgbToHex(bg);
      const pass = (v: boolean) =>
        v
          ? '<span style="color:#22c55e">Pass</span>'
          : '<span style="color:#ef4444">Fail</span>';

      const lines = [
        `<b style="color:#f97316">Contrast ${ratioStr}:1</b>`,
        `<span style="color:#71717a">foreground</span> <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${fgHex};vertical-align:middle;border:1px solid #2a2c32"></span> ${fgHex}`,
        `<span style="color:#71717a">background</span> <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${bgHex};vertical-align:middle;border:1px solid #2a2c32"></span> ${bgHex}`,
        ``,
        `AA Normal (4.5:1) ${pass(aaNormal)}`,
        `AA Large (3:1) ${pass(aaLarge)}`,
        `AAA Normal (7:1) ${pass(aaaNormal)}`,
        `AAA Large (4.5:1) ${pass(aaaLarge)}`,
      ];

      t.innerHTML = lines.join("<br>");
      t.style.opacity = "1";

      let tx = rect.right + 12;
      let ty = rect.top;
      if (tx + 280 > window.innerWidth) tx = rect.left - 280 - 12;
      if (tx < 4) tx = 4;
      if (ty + 200 > window.innerHeight) ty = window.innerHeight - 210;
      if (ty < 4) ty = 4;
      t.style.left = tx + "px";
      t.style.top = ty + "px";
    }

    // ── Color utilities ──
    function parseColor(str: string): [number, number, number] | null {
      const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return m ? [+m[1], +m[2], +m[3]] : null;
    }

    function getEffectiveBackground(
      el: Element,
    ): [number, number, number] | null {
      let current: Element | null = el;
      while (current) {
        const cs = getComputedStyle(current);
        const bg = parseColor(cs.backgroundColor);
        if (bg) {
          const a = parseAlpha(cs.backgroundColor);
          if (a > 0.9) return bg;
        }
        current = current.parentElement;
      }
      return [255, 255, 255];
    }

    function parseAlpha(str: string): number {
      const m = str.match(/rgba\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/);
      if (m) return parseFloat(m[1]);
      return str.startsWith("rgb(") ? 1 : 0;
    }

    function relativeLuminance([r, g, b]: [number, number, number]): number {
      const [rs, gs, bs] = [r, g, b].map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    function contrastRatio(l1: number, l2: number): number {
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    function rgbToHex([r, g, b]: [number, number, number]): string {
      return (
        "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")
      );
    }

    // ── Radius audit mode ──
    function auditRadius() {
      const o = ensureOverlay();
      const t = ensureTooltip();
      o.innerHTML = "";
      radiusAbort = false;

      const all = Array.from(document.querySelectorAll("body *"));
      const totalNodes = all.length;
      let cursor = 0;
      const BATCH = 80;
      const entries: { radius: string; rect: DOMRect }[] = [];
      const groups = new Map<string, number>();

      const COLOR_OK = {
        bg: "rgba(20,184,166,0.08)",
        border: "rgba(20,184,166,0.4)",
        text: "#14b8a6",
      };
      const COLOR_WARN = {
        bg: "rgba(245,158,11,0.10)",
        border: "rgba(245,158,11,0.5)",
        text: "#f59e0b",
      };

      t.style.opacity = "1";
      t.style.left = "12px";
      t.style.bottom = "12px";
      t.style.top = "auto";
      t.style.transform = "none";
      updateTooltip(0);

      function updateTooltip(scanned: number) {
        const pct =
          totalNodes > 0 ? Math.round((scanned / totalNodes) * 100) : 0;
        const done = scanned >= totalNodes;
        const sorted = [...groups.entries()].sort((a, b) => b[1] - a[1]);
        const consistentSet = buildConsistentSet(sorted, entries.length);

        const lines: string[] = [];
        lines.push(`<b style="color:#f97316">Radius Audit</b>`);
        if (!done) {
          lines.push(
            `<span style="color:#71717a">Scanning\u2026 ${pct}% <span style="font-variant-numeric:tabular-nums">(${entries.length} found)</span></span>`,
          );
          lines.push(
            `<span style="display:block;height:3px;border-radius:2px;background:#2a2c32;margin:4px 0;overflow:hidden"><span style="display:block;height:100%;width:${pct}%;background:#f97316;border-radius:2px"></span></span>`,
          );
        } else {
          lines.push(
            `<span style="color:#71717a">${entries.length} elements with border-radius</span>`,
          );
        }
        if (sorted.length > 0) {
          lines.push("");
          for (const [val, count] of sorted) {
            const isOk = consistentSet.has(val);
            const dot = isOk
              ? '<span style="color:#14b8a6">●</span>'
              : '<span style="color:#f59e0b">●</span>';
            lines.push(
              `${dot} <span style="font-variant-numeric:tabular-nums">${val}</span> <span style="color:#71717a">×${count}</span>`,
            );
          }
        }
        if (done && entries.length > 0) {
          const inconsistentCount = entries.filter(
            (e) => !consistentSet.has(e.radius),
          ).length;
          lines.push("");
          lines.push(
            inconsistentCount > 0
              ? `<span style="color:#f59e0b">${inconsistentCount} inconsistent</span>`
              : `<span style="color:#14b8a6">All consistent</span>`,
          );
        }
        if (done && entries.length === 0) {
          lines.push(
            `<span style="color:#71717a">No border-radius found</span>`,
          );
        }
        t.innerHTML = lines.join("<br>");
      }

      function buildConsistentSet(sorted: [string, number][], total: number) {
        const set = new Set<string>();
        for (let i = 0; i < sorted.length; i++) {
          const [val, count] = sorted[i];
          if (i < 3 || count / total >= 0.15) set.add(val);
        }
        return set;
      }

      function processBatch() {
        if (radiusAbort) return;
        const end = Math.min(cursor + BATCH, totalNodes);
        for (let i = cursor; i < end; i++) {
          const el = all[i];
          if ((el as HTMLElement).id?.startsWith("__spacer")) continue;
          if (isToolbarElement(el)) continue;
          const cs = getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden") continue;
          const r = cs.borderRadius;
          if (!r || r === "0px") continue;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
          if (rect.right < 0 || rect.left > window.innerWidth) continue;

          const normalized = normalizeRadius(r);
          entries.push({ radius: normalized, rect });
          groups.set(normalized, (groups.get(normalized) || 0) + 1);

          const sorted = [...groups.entries()].sort((a, b) => b[1] - a[1]);
          const consistentSet = buildConsistentSet(sorted, entries.length);
          const isConsistent = consistentSet.has(normalized);
          const c = isConsistent ? COLOR_OK : COLOR_WARN;
          drawRadiusOutline(o, rect, c.border, c.bg);
          drawLabel(o, rect.left + 10, rect.top + 10, normalized, c.text);
        }
        cursor = end;
        updateTooltip(cursor);
        if (cursor < totalNodes) {
          setTimeout(processBatch, 0);
        } else {
          recolorAll();
        }
      }

      function recolorAll() {
        o.innerHTML = "";
        const sorted = [...groups.entries()].sort((a, b) => b[1] - a[1]);
        const consistentSet = buildConsistentSet(sorted, entries.length);
        for (const entry of entries) {
          const isConsistent = consistentSet.has(entry.radius);
          const c = isConsistent ? COLOR_OK : COLOR_WARN;
          drawRadiusOutline(o, entry.rect, c.border, c.bg);
          drawLabel(
            o,
            entry.rect.left + 10,
            entry.rect.top + 10,
            entry.radius,
            c.text,
          );
        }
        updateTooltip(totalNodes);
      }

      setTimeout(processBatch, 0);
    }

    function normalizeRadius(r: string): string {
      const parts = r
        .split(/\s+\/?\s*/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length === 0) return r;
      if (r.includes("/")) return r;
      const unique = [...new Set(parts)];
      if (unique.length === 1) return unique[0];
      if (
        parts.length === 4 &&
        parts[0] === parts[1] &&
        parts[1] === parts[2] &&
        parts[2] === parts[3]
      )
        return parts[0];
      return r;
    }

    function drawRadiusOutline(
      parent: HTMLElement,
      rect: DOMRect,
      borderColor: string,
      bgColor: string,
    ) {
      const d = document.createElement("div");
      d.style.cssText = `position:fixed;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;background:${bgColor};border:1.5px solid ${borderColor};border-radius:inherit;pointer-events:none;`;
      parent.appendChild(d);
    }

    // ── Event handlers ──
    function onMouseMove(e: MouseEvent) {
      if (mode !== "spacing") return;
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (
        !target ||
        target === overlay ||
        target === tooltip ||
        target.id?.startsWith("__spacer") ||
        isToolbarElement(target)
      )
        return;
      if (target === lastTarget) return;
      lastTarget = target;
      drawSpacingOverlay(target);
    }

    function onClickContrast(e: MouseEvent) {
      if (mode !== "contrast") return;
      e.preventDefault();
      e.stopPropagation();
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (
        !target ||
        target === overlay ||
        target === tooltip ||
        target.id?.startsWith("__spacer") ||
        isToolbarElement(target)
      )
        return;
      checkContrast(target);
    }

    function activate(newMode: "off" | "spacing" | "contrast" | "radius") {
      cleanup();
      mode = newMode;
      if (mode === "off") return;
      if (mode === "spacing") {
        document.addEventListener("mousemove", onMouseMove, true);
      } else if (mode === "contrast") {
        document.addEventListener("click", onClickContrast, true);
        document.body.style.cursor = "crosshair";
      } else if (mode === "radius") {
        auditRadius();
      }
    }

    // ── Message listener (from background / popup) ──
    let toolbarVisible = true;

    browser.runtime.onMessage.addListener((msg: any) => {
      if (msg.type === "TOGGLE_TOOLBAR") {
        toolbarVisible = !toolbarVisible;
        if (toolbarVisible) {
          toolbarUi.shadowHost.style.display = "block";
        } else {
          activate("off");
          toolbarUi.shadowHost.style.display = "none";
        }
        return Promise.resolve({ toolbarVisible });
      }
      if (msg.type === "GET_STATE") {
        return Promise.resolve({ mode, toolbarVisible });
      }
    });

    // Cleanup on context invalidated
    ctx.onInvalidated(() => {
      cleanup();
      toolbarUi.remove();
    });
  },
});
