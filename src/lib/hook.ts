export const HOOK_START = "# ph hook (zsh) start";
export const HOOK_END = "# ph hook (zsh) end";

const LEGACY_MARKER_START = "# projh hook (zsh) start";
const LEGACY_MARKER_END = "# projh hook (zsh) end";

const LEGACY_HOOK_LINES = [
  "# projh hook (zsh)",
  "autoload -Uz add-zsh-hook",
  "",
  "projh_preexec() {",
  "  if [ -n \"$PROJH_DISABLE\" ]; then",
  "    return",
  "  fi",
  "  case \"$1\" in",
  "    *projh\\ record*) return ;;",
  "  esac",
  "  projh record --cmd \"$1\" --cwd \"$PWD\"",
  "}",
  "",
  "add-zsh-hook preexec projh_preexec",
  "",
];

const HOOK_LINES = [
  HOOK_START,
  "autoload -Uz add-zsh-hook",
  "",
  "ph_preexec() {",
  "  if [ -n \"$PH_DISABLE\" ] || [ -n \"$PROJH_DISABLE\" ]; then",
    "    return",
  "  fi",
  "  case \"$1\" in",
  "    *ph\\ record*|*projh\\ record*) return ;;",
  "  esac",
  "  ph record --cmd \"$1\" --cwd \"$PWD\"",
  "}",
  "",
  "add-zsh-hook preexec ph_preexec",
  HOOK_END,
  "",
];

export type StripHookResult = {
  updated: string;
  removed: boolean;
};

export function buildZshHook(): string {
  return HOOK_LINES.join("\n");
}

export function stripZshHook(contents: string): StripHookResult {
  let updated = contents;
  let removed = false;

  const markerPatterns = [
    buildMarkerPattern(HOOK_START, HOOK_END),
    buildMarkerPattern(LEGACY_MARKER_START, LEGACY_MARKER_END),
  ];

  for (const pattern of markerPatterns) {
    const next = updated.replace(pattern, "");
    if (next !== updated) {
      removed = true;
    }
    updated = next;
  }

  const legacyPatterns = [buildLegacyPattern(LEGACY_HOOK_LINES)];
  for (const pattern of legacyPatterns) {
    const next = updated.replace(pattern, "");
    if (next !== updated) {
      removed = true;
    }
    updated = next;
  }

  if (removed) {
    updated = preserveTrailingNewline(contents, updated);
  }

  return { updated, removed };
}

function buildMarkerPattern(start: string, end: string): RegExp {
  return new RegExp(
    `^${escapeRegex(start)}\\r?\\n[\\s\\S]*?^${escapeRegex(end)}\\r?\\n?`,
    "gm",
  );
}

function buildLegacyPattern(lines: string[]): RegExp {
  const legacy = lines.join("\n");
  const escaped = escapeRegex(legacy).replace(/\n/g, "\\r?\\n");
  return new RegExp(`${escaped}\\r?\\n?`, "g");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function preserveTrailingNewline(original: string, updated: string): string {
  if (!original.endsWith("\n")) {
    return updated;
  }

  if (updated.endsWith("\n")) {
    return updated;
  }

  const lineEnding = original.endsWith("\r\n") ? "\r\n" : "\n";
  return `${updated}${lineEnding}`;
}
