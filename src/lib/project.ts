import fs from "fs";
import path from "path";

export const HISTORY_FILENAME = ".projh.json";

export type HistoryEntry = {
  timestamp: string;
  command: string;
  cwd: string;
};

export type HistoryFile = {
  version: 1;
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

export function ensureHistoryFile(root: string): { path: string; created: boolean } {
  const filePath = historyFilePath(root);
  if (fs.existsSync(filePath)) {
    return { path: filePath, created: false };
  }

  writeHistoryFile(filePath, { version: 1, entries: [] });
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
  history.entries.push(entry);
  writeHistoryFile(filePath, history);
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

export function readExcludeFile(gitDir: string): string {
  const excludePath = path.join(gitDir, "info", "exclude");
  try {
    return fs.readFileSync(excludePath, "utf8");
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === "ENOENT") {
      return "";
    }
    throw err;
  }
}

export function excludeHasEntry(excludeContents: string, entry: string): boolean {
  return excludeContents
    .split(/\r?\n/)
    .some((line) => line.trim() === entry);
}

export function appendExcludeEntry(gitDir: string, entry: string): void {
  const infoDir = path.join(gitDir, "info");
  fs.mkdirSync(infoDir, { recursive: true });

  const excludePath = path.join(infoDir, "exclude");
  const existing = readExcludeFile(gitDir);
  if (excludeHasEntry(existing, entry)) {
    return;
  }

  const needsNewline = existing.length > 0 && !existing.endsWith("\n");
  const prefix = existing.length === 0 ? "" : needsNewline ? "\n" : "";
  fs.appendFileSync(excludePath, `${prefix}${entry}\n`, "utf8");
}

function normalizeHistory(value: unknown): HistoryFile {
  if (!value || typeof value !== "object") {
    return { version: 1, entries: [] };
  }

  const data = value as { version?: unknown; entries?: unknown };
  const entries = Array.isArray(data.entries)
    ? data.entries.filter(isHistoryEntry)
    : [];

  return { version: 1, entries };
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
