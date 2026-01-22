import { pickBox } from "cli-box-picker";
import path from "path";
import { formatError } from "../lib/errors";
import {
  HISTORY_FILENAME,
  appendExcludeEntry,
  ensureHistoryFile,
  excludeHasEntry,
  findProjectRoot,
  readExcludeFile,
  resolveGitDir,
} from "../lib/project";

type InitOptions = {
  root?: string;
};

export async function initAction(opts: InitOptions): Promise<void> {
  try {
    const startDir = opts.root ? path.resolve(opts.root) : process.cwd();
    const project = findProjectRoot(startDir);
    const result = ensureHistoryFile(project.root);

    if (result.created) {
      console.log(`Initialized ${result.path}`);
    } else {
      console.log(`Found ${result.path}`);
    }

    const gitDir = resolveGitDir(project.root);
    if (!gitDir) {
      return;
    }

    const existing = readExcludeFile(gitDir);
    if (excludeHasEntry(existing, HISTORY_FILENAME)) {
      return;
    }

    const choice = await pickBox({
      question: `Add ${HISTORY_FILENAME} to .git/info/exclude?`,
      choices: {
        y: { value: "Yes", description: "Ignore local history file" },
        n: { value: "No", description: "Keep it tracked or decide later" },
      },
      defaultIndex: 0,
      confirm: true,
    });

    if (choice.value === "Yes") {
      appendExcludeEntry(gitDir, HISTORY_FILENAME);
      console.log(`Added ${HISTORY_FILENAME} to .git/info/exclude`);
    }
  } catch (err) {
    console.error(formatError(err));
    process.exitCode = 1;
  }
}
