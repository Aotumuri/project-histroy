import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import readline from "readline";
import { formatError } from "../lib/errors";
import {
  HistoryEntry,
  appendHistoryEntry,
  ensureHistoryFile,
  findProjectRoot,
  historyFilePath,
  readHistoryFile,
} from "../lib/project";

type ListOptions = {
  limit?: string | number;
  all?: boolean;
  root?: string;
  plain?: boolean;
};

const PAGE_SIZE = 10;

export function listAction(opts: ListOptions): void {
  try {
    const startDir = opts.root ? path.resolve(opts.root) : process.cwd();
    const project = findProjectRoot(startDir);
    const filePath = historyFilePath(project.root);

    if (!fs.existsSync(filePath)) {
      console.log(`No ${filePath} found`);
      return;
    }

    const history = readHistoryFile(filePath);
    if (history.entries.length === 0) {
      console.log("No history entries yet");
      return;
    }

    const ordered = history.entries.slice().reverse();
    const interactive = Boolean(
      process.stdin.isTTY && process.stdout.isTTY && !opts.plain,
    );
    const entries = resolveEntries(ordered, opts, interactive);

    if (interactive) {
      runInteractiveList(entries);
      return;
    }

    for (const entry of entries) {
      process.stdout.write(formatEntry(entry));
    }
  } catch (err) {
    console.error(formatError(err));
    process.exitCode = 1;
  }
}

function resolveEntries(
  entries: HistoryEntry[],
  opts: ListOptions,
  interactive: boolean,
): HistoryEntry[] {
  if (opts.all) {
    return entries;
  }

  if (opts.limit !== undefined && opts.limit !== null && opts.limit !== "") {
    const limit = parseLimit(opts.limit);
    return entries.slice(0, limit);
  }

  if (interactive) {
    return entries;
  }

  return entries.slice(0, 20);
}

function parseLimit(value: unknown): number {
  if (value === undefined || value === null || value === "") {
    return 20;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    throw new Error(`Invalid limit: ${value}`);
  }

  return parsed;
}

function formatEntry(entry: HistoryEntry): string {
  return `${entry.timestamp} | ${entry.cwd} | ${entry.command}\n`;
}

function runInteractiveList(entries: HistoryEntry[]): void {
  let page = 0;
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const stdin = process.stdin;
  const render = () => {
    renderPage(entries, page);
  };

  readline.emitKeypressEvents(stdin);
  stdin.resume();
  if (stdin.isTTY) {
    stdin.setRawMode(true);
  }

  const cleanup = () => {
    stdin.removeListener("keypress", onKeypress);
    if (stdin.isTTY) {
      stdin.setRawMode(false);
    }
    stdin.pause();
  };

  const onKeypress = (input: string, key: readline.Key) => {
    if (key?.ctrl && key.name === "c") {
      cleanup();
      return;
    }

    if (key?.name === "left") {
      if (page > 0) {
        page -= 1;
        render();
      } else {
        beep();
      }
      return;
    }

    if (key?.name === "right") {
      if (page < totalPages - 1) {
        page += 1;
        render();
      } else {
        beep();
      }
      return;
    }

    if (input === "q" || key?.name === "escape") {
      cleanup();
      return;
    }

    if (/^[0-9]$/.test(input)) {
      const index = input === "0" ? 9 : Number(input) - 1;
      const pageEntries = getPageEntries(entries, page);
      const entry = pageEntries[index];
      if (!entry) {
        beep();
        return;
      }

      cleanup();
      runEntry(entry);
    }
  };

  stdin.on("keypress", onKeypress);
  render();
}

function getPageEntries(entries: HistoryEntry[], page: number): HistoryEntry[] {
  const start = page * PAGE_SIZE;
  return entries.slice(start, start + PAGE_SIZE);
}

function renderPage(entries: HistoryEntry[], page: number): void {
  console.clear();
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const header = `ph list (${entries.length} entries) page ${
    page + 1
  }/${totalPages}`;
  const help = "1-9/0 run, Left/Right arrows page, q quit";

  process.stdout.write(`${header}\n${help}\n\n`);

  const pageEntries = getPageEntries(entries, page);
  const width = Math.max(40, process.stdout.columns ?? 120);
  for (let i = 0; i < pageEntries.length; i += 1) {
    const label = indexLabel(i);
    const line = `${label}) ${formatEntryLine(pageEntries[i])}`;
    process.stdout.write(`${truncate(line, width)}\n`);
  }
}

function runEntry(entry: HistoryEntry): void {
  try {
    const project = findProjectRoot(entry.cwd);
    const result = ensureHistoryFile(project.root);
    appendHistoryEntry(result.path, {
      timestamp: new Date().toISOString(),
      command: entry.command,
      cwd: entry.cwd,
    });
  } catch (err) {
    console.error(formatError(err));
  }

  process.stdout.write(`\n$ ${entry.command}\n`);
  const result = spawnSync(entry.command, {
    shell: true,
    stdio: "inherit",
    cwd: entry.cwd,
  });

  if (result.error) {
    console.error(formatError(result.error));
    process.exitCode = 1;
  } else if (typeof result.status === "number") {
    process.exitCode = result.status;
  } else if (result.signal) {
    process.exitCode = 1;
  }

  process.exit();
}

function formatEntryLine(entry: HistoryEntry): string {
  return `${entry.timestamp} | ${entry.cwd} | ${entry.command}`;
}

function truncate(value: string, width: number): string {
  if (value.length <= width) {
    return value;
  }

  if (width <= 3) {
    return value.slice(0, width);
  }

  return `${value.slice(0, width - 3)}...`;
}

function indexLabel(index: number): string {
  if (index === 9) {
    return "0";
  }
  return String(index + 1);
}

function beep(): void {
  process.stdout.write("\u0007");
}
