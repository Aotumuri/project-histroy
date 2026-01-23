import fs from "fs";
import path from "path";
import { formatError } from "../lib/errors";
import {
  appendHistoryEntry,
  findProjectRoot,
  historyFilePath,
  normalizeHistoryCwd,
} from "../lib/project";

type RecordOptions = {
  cmd: string;
  cwd?: string;
  time?: string;
};

export function recordAction(opts: RecordOptions): void {
  try {
    const command = String(opts.cmd ?? "").trim();
    if (!command) {
      return;
    }

    const cwd = path.resolve(opts.cwd ?? process.cwd());
    const timestamp = opts.time
      ? new Date(opts.time).toISOString()
      : new Date().toISOString();

    const project = findProjectRoot(cwd);
    const filePath = historyFilePath(project.root);
    if (!fs.existsSync(filePath)) {
      return;
    }

    appendHistoryEntry(filePath, {
      timestamp,
      command,
      cwd: normalizeHistoryCwd(cwd, project.root),
    });
  } catch (err) {
    console.error(formatError(err));
    process.exitCode = 1;
  }
}
