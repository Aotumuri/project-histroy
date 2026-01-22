import path from "path";
import { formatError } from "../lib/errors";
import {
  appendHistoryEntry,
  ensureHistoryFile,
  findProjectRoot,
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
    const result = ensureHistoryFile(project.root);

    appendHistoryEntry(result.path, {
      timestamp,
      command,
      cwd,
    });
  } catch (err) {
    console.error(formatError(err));
    process.exitCode = 1;
  }
}
