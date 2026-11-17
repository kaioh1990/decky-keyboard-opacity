import {
  ButtonItem,
  findModule,
  PanelSection,
  PanelSectionRow,
  SliderField,
  staticClasses,
  ToggleField,
} from "@decky/ui";
import { definePlugin } from "@decky/api";
import { useState } from "react";

interface Settings {
  enabled: boolean;
  opacity: number; // 0-100, opacity of the keyboard background
  overlay: boolean; // float the keyboard over the page instead of shrinking it
}

const STYLE_ID = "kb-opacity-style";
const STORAGE_KEY = "kbOpacity.settings2";
const DEFAULTS: Settings = { enabled: true, opacity: 30, overlay: true };

function loadSettings(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings(s: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

type ClassMap = Record<string, string>;
const isClassMap = (e: any, ...keys: string[]) =>
  e && typeof e === "object" && keys.every((k) => typeof e[k] === "string");

interface KeyboardClasses {
  container?: string; // outer keyboard container
  positioner?: string; // wrapper that Steam lays out below the page
  glass?: string; // dark blurred backdrop behind the keyboard
  keys?: ClassMap; // keyboard and key classes
}

// Steam's class names are hashed and change between updates, so look them up at runtime.
let classes: KeyboardClasses | null = null;
function getClasses(): KeyboardClasses {
  if (classes?.keys && classes.container) return classes;
  const vk = findModule((e) => isClassMap(e, "VirtualKeyboardContainer", "VirtualKeyboardStandaloneContainer"));
  const glass = findModule((e) => isClassMap(e, "BackgroundGlass", "Blur"));
  const keys = findModule((e) => isClassMap(e, "Keyboard", "KeyboardKey", "KeyboardRow", "Focused"));
  classes = {
    container: vk?.VirtualKeyboardContainer,
    positioner: vk?.Positioner,
    glass: glass?.BackgroundGlass,
    keys,
  };
  return classes;
}

function buildCss(s: Settings): string {
  if (!s.enabled) return "";
  const c = getClasses();
  const a = s.opacity / 100;
  let css = "";

  if (c.keys) {
    // Fade only the backgrounds so the key labels stay readable.
    const k = c.keys;
    const not = [k.Focused, k.Touched, k.ToggleOn]
      .filter(Boolean)
      .map((x) => `:not(.${x})`)
      .join("");
    css += `.${k.Keyboard} { background-color: rgba(35, 38, 46, ${a}) !important; text-shadow: 0 0 3px #000, 0 0 6px #000; }\n`;
    css += `.${k.Keyboard} .${k.KeyboardKey}${not} { background-color: rgba(14, 20, 27, ${Math.min(1, a + 0.1)}) !important; }\n`;
  } else {
    // Fallback: fade the whole keyboard.
    const sel = c.container ? `.${c.container}` : '[class*="VirtualKeyboardContainer"]';
    css += `${sel} { opacity: ${Math.max(0.2, a)} !important; }\n`;
  }

  if (c.positioner && c.glass) {
    // Steam draws a dark blurred panel behind the keyboard; hide it so the page shows through.
    css += `.${c.positioner} > .${c.glass} { opacity: 0 !important; }\n`;
  }
  if (s.overlay && c.positioner) {
    // Float the keyboard over the page instead of letting Steam shrink the page above it.
    css += `.${c.positioner} { position: absolute !important; left: 0; right: 0; bottom: 0; z-index: 6000; }\n`;
  }
  return css;
}

function steamWindows(): Window[] {
  const list: Window[] = [window];
  try {
    for (const w of (window as any).SteamUIStore?.WindowStore?.SteamUIWindows ?? []) {
      const bw: Window | undefined = w.BrowserWindow ?? w.m_BrowserWindow;
      if (bw && !list.includes(bw)) list.push(bw);
    }
  } catch {
    /* ignore */
  }
  return list;
}

let current = loadSettings();

function applyStyles() {
  const text = buildCss(current);
  for (const w of steamWindows()) {
    try {
      const d = w.document;
      let el = d.getElementById(STYLE_ID) as HTMLStyleElement | null;
      if (!el) {
        el = d.createElement("style");
        el.id = STYLE_ID;
        d.head.appendChild(el);
      }
      if (el.textContent !== text) el.textContent = text;
    } catch {
      /* window may be closing */
    }
  }
}

function removeStyles() {
  for (const w of steamWindows()) {
    try {
      w.document.getElementById(STYLE_ID)?.remove();
    } catch {
      /* ignore */
    }
  }
}

function showKeyboard() {
  try {
    (window as any).SteamUIStore.ActiveWindowInstance.VirtualKeyboardManager.SetVirtualKeyboardVisible();
  } catch {
    /* ignore */
  }
}

function KeyboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
      <path
        opacity={0.6}
        d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"
      />
    </svg>
  );
}

function Content() {
  const [s, setS] = useState<Settings>(current);
  const update = (patch: Partial<Settings>) => {
    const next = { ...s, ...patch };
    current = next;
    saveSettings(next);
    applyStyles();
    setS(next);
  };

  return (
    <PanelSection title="On-screen keyboard">
      <PanelSectionRow>
        <ToggleField label="Translucent keyboard" checked={s.enabled} onChange={(v) => update({ enabled: v })} />
      </PanelSectionRow>
      <PanelSectionRow>
        <SliderField
          label="Background opacity"
          value={s.opacity}
          min={0}
          max={100}
          step={5}
          showValue
          valueSuffix="%"
          disabled={!s.enabled}
          onChange={(v) => update({ opacity: v })}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <ToggleField
          label="See through to the screen"
          description="Keyboard floats over the page instead of pushing it up"
          checked={s.overlay}
          disabled={!s.enabled}
          onChange={(v) => update({ overlay: v })}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={showKeyboard}>
          Show keyboard to preview
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>
  );
}

export default definePlugin(() => {
  applyStyles();
  // Re-apply periodically to catch newly opened Steam windows.
  const timer = setInterval(applyStyles, 3000);

  return {
    name: "Keyboard Opacity",
    titleView: <div className={staticClasses.Title}>Keyboard Opacity</div>,
    content: <Content />,
    icon: <KeyboardIcon />,
    onDismount() {
      clearInterval(timer);
      removeStyles();
    },
  };
});
