import fs from "fs";
import path from "path";

export const HISTORY_FILENAME = ".projh.json";

export type HistoryEntry = {
  timestamp: string;
  command: string;
  cwd: string;
};

export type HistorySettings = {
  recordPhCommands?: boolean;
};

export type HistoryFile = {
  version: 1;
  settings?: HistorySettings;
  entries: HistoryEntry[];
};

export type ProjectRootResult = {
  root: string;
  source: "projh" | "git" | "cwd";
};

export function findProjectRoot(startDir: string): ProjectRootResult {
  let current = path.resolve(startDir);

  while (true) {
    const historyPath = path.join(current, HISTORY_FILENAME);
    if (fs.existsSync(historyPath)) {
      return { root: current, source: "projh" };
    }

    const gitPath = path.join(current, ".git");
    if (fs.existsSync(gitPath)) {
      return { root: current, source: "git" };
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return { root: path.resolve(startDir), source: "cwd" };
    }

    current = parent;
  }
}

export function historyFilePath(root: string): string {
  return path.join(root, HISTORY_FILENAME);
}

export function ensureHistoryFile(
  root: string,
  settings?: HistorySettings,
): { path: string; created: boolean } {
  const filePath = historyFilePath(root);
  if (fs.existsSync(filePath)) {
    return { path: filePath, created: false };
  }

  writeHistoryFile(filePath, { version: 1, entries: [], settings });
  return { path: filePath, created: true };
}

export function readHistoryFile(filePath: string): HistoryFile {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return normalizeHistory(parsed);
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === "ENOENT") {
      return { version: 1, entries: [] };
    }

    if (err instanceof SyntaxError) {
      const backupPath = `${filePath}.invalid-${Date.now()}`;
      fs.renameSync(filePath, backupPath);
      return { version: 1, entries: [] };
    }

    throw err;
  }
}

export function writeHistoryFile(filePath: string, data: HistoryFile): void {
  const payload = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, `${payload}\n`, "utf8");
}

export function appendHistoryEntry(filePath: string, entry: HistoryEntry): void {
  const history = readHistoryFile(filePath);
  if (!shouldRecordEntry(entry, history.settings)) {
    return;
  }
  history.entries.push(entry);
  writeHistoryFile(filePath, history);
}

export function resolveHistoryCwd(value: string, root: string): string {
  if (path.isAbsolute(value)) {
    return path.resolve(value);
  }

  return path.resolve(root, value);
}

export function normalizeHistoryCwd(value: string, root: string): string {
  const resolved = resolveHistoryCwd(value, root);
  const relative = path.relative(root, resolved);
  if (relative === "" || relative === ".") {
    return ".";
  }

  return relative;
}

export function resolveGitDir(root: string): string | null {
  const gitPath = path.join(root, ".git");
  try {
    const stat = fs.statSync(gitPath);
    if (stat.isDirectory()) {
      return gitPath;
    }

    if (stat.isFile()) {
      const contents = fs.readFileSync(gitPath, "utf8").trim();
      const match = contents.match(/^gitdir:\s*(.+)\s*$/i);
      if (match) {
        return path.resolve(root, match[1]);
      }
    }
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") {
      throw err;
    }
  }

  return null;
}

export function readGitignoreFile(root: string): string {
  const gitignorePath = path.join(root, ".gitignore");
  try {
    return fs.readFileSync(gitignorePath, "utf8");
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === "ENOENT") {
      return "";
    }
    throw err;
  }
}

export function gitignoreHasEntry(
  gitignoreContents: string,
  entry: string,
): boolean {
  return gitignoreContents
    .split(/\r?\n/)
    .some((line) => line.trim() === entry);
}

export function appendGitignoreEntry(root: string, entry: string): void {
  const gitignorePath = path.join(root, ".gitignore");
  const existing = readGitignoreFile(root);
  if (gitignoreHasEntry(existing, entry)) {
    return;
  }

  const needsNewline = existing.length > 0 && !existing.endsWith("\n");
  const prefix = existing.length === 0 ? "" : needsNewline ? "\n" : "";
  fs.appendFileSync(gitignorePath, `${prefix}${entry}\n`, "utf8");
}

function normalizeHistory(value: unknown): HistoryFile {
  if (!value || typeof value !== "object") {
    return { version: 1, entries: [] };
  }

  const data = value as {
    version?: unknown;
    entries?: unknown;
    settings?: unknown;
  };
  const entries = Array.isArray(data.entries)
    ? data.entries.filter(isHistoryEntry)
    : [];
  const settings = normalizeSettings(data.settings);

  return { version: 1, settings, entries };
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as {
    timestamp?: unknown;
    command?: unknown;
    cwd?: unknown;
  };

  return (
    typeof entry.timestamp === "string" &&
    typeof entry.command === "string" &&
    typeof entry.cwd === "string"
  );
}

function normalizeSettings(value: unknown): HistorySettings | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const settings = value as { recordPhCommands?: unknown };
  if (typeof settings.recordPhCommands === "boolean") {
    return { recordPhCommands: settings.recordPhCommands };
  }

  return undefined;
}

function shouldRecordEntry(
  entry: HistoryEntry,
  settings?: HistorySettings,
): boolean {
  if (settings?.recordPhCommands === false && isPhCommand(entry.command)) {
    return false;
  }

  return true;
}

function isPhCommand(command: string): boolean {
  const commandName = extractCommandName(command);
  if (!commandName) {
    return false;
  }

  const cleaned = stripCommandEscape(commandName);
  const base = path.basename(cleaned);
  return base === "ph" || base === "phi" || base === "phl" || base === "projh";
}

function extractCommandName(command: string): string | null {
  const trimmed = command.trim();
  if (!trimmed) {
    return null;
  }

  const tokens = trimmed.split(/\s+/);
  for (const token of tokens) {
    if (token === "sudo" || token === "command" || token === "env") {
      continue;
    }

    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(token)) {
      continue;
    }

    return token;
  }

  return null;
}

function stripCommandEscape(token: string): string {
  if (token.startsWith("\\") && token.length > 1) {
    return token.slice(1);
  }

  return token;
}
