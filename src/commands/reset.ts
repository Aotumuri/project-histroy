import { pickBox } from "cli-box-picker";
import fs from "fs";
import path from "path";
import { formatError } from "../lib/errors";
import {
  HISTORY_FILENAME,
  findProjectRoot,
  historyFilePath,
  readHistoryFile,
  writeHistoryFile,
} from "../lib/project";

type ResetOptions = {
  root?: string;
};

export async function resetAction(opts: ResetOptions): Promise<void> {
  try {
    const startDir = opts.root ? path.resolve(opts.root) : process.cwd();
    const project = findProjectRoot(startDir);
    const filePath = historyFilePath(project.root);

    if (!fs.existsSync(filePath)) {
      console.log(`No ${filePath} found`);
      return;
    }

    const choice = await pickBox({
      question: `Reset ${HISTORY_FILENAME}?`,
      choices: {
        y: { value: "Yes", description: "Clear all history entries" },
        n: { value: "No", description: "Keep existing history" },
      },
      defaultIndex: 1,
      confirm: true,
    });

    if (choice.value !== "Yes") {
      return;
    }

    const history = readHistoryFile(filePath);
    writeHistoryFile(filePath, { ...history, entries: [] });
    console.log(`Reset ${filePath}`);
  } catch (err) {
    console.error(formatError(err));
    process.exitCode = 1;
  }
}
