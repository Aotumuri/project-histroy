import { pickBox } from "cli-box-picker";
import path from "path";
import { formatError } from "../lib/errors";
import {
  HISTORY_FILENAME,
  ensureHistoryFile,
  appendGitignoreEntry,
  findProjectRoot,
  gitignoreHasEntry,
  readHistoryFile,
  readGitignoreFile,
  resolveGitDir,
  writeHistoryFile,
} from "../lib/project";

type InitOptions = {
  root?: string;
};

export async function initAction(opts: InitOptions): Promise<void> {
  try {
    const startDir = opts.root ? path.resolve(opts.root) : process.cwd();
    const project = findProjectRoot(startDir);
    const gitDir = resolveGitDir(project.root);
    if (gitDir) {
      const existing = readGitignoreFile(project.root);
      if (!gitignoreHasEntry(existing, HISTORY_FILENAME)) {
        const choice = await pickBox({
          question: `Add ${HISTORY_FILENAME} to .gitignore?`,
          choices: {
            y: { value: "Yes", description: "Ignore local history file" },
            n: { value: "No", description: "Keep it tracked or decide later" },
          },
          defaultIndex: 0,
          confirm: true,
        });

        if (choice.value === "Yes") {
          appendGitignoreEntry(project.root, HISTORY_FILENAME);
          console.log(`Added ${HISTORY_FILENAME} to .gitignore`);
        }
      }
    }

    const result = ensureHistoryFile(project.root);
    if (result.created) {
      console.log(`Initialized ${result.path}`);
    } else {
      console.log(`Found ${result.path}`);
    }

    const history = readHistoryFile(result.path);
    if (history.settings?.recordPhCommands === undefined) {
      const choice = await pickBox({
        question: "Record ph commands in history?",
        choices: {
          y: {
            value: "Yes",
            description: "Keep ph/phi/phl/projh commands",
          },
          n: {
            value: "No",
            description: "Ignore ph/phi/phl/projh commands",
          },
        },
        defaultIndex: 1,
        confirm: true,
      });

      const settings = {
        ...(history.settings ?? {}),
        recordPhCommands: choice.value === "Yes",
      };
      writeHistoryFile(result.path, { ...history, settings });
    }
  } catch (err) {
    console.error(formatError(err));
    process.exitCode = 1;
  }
}
