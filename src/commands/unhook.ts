import fs from "fs";
import os from "os";
import path from "path";
import { formatError } from "../lib/errors";
import { stripZshHook } from "../lib/hook";

type UnhookOptions = {
  shell?: string;
};

export function unhookAction(opts: UnhookOptions): void {
  try {
    const shell = String(opts.shell ?? "zsh").toLowerCase();
    if (shell !== "zsh") {
      throw new Error(`Unsupported shell: ${shell}`);
    }

    const zshrcPath = path.join(os.homedir(), ".zshrc");
    if (!fs.existsSync(zshrcPath)) {
      console.log(`No ${zshrcPath} found`);
      return;
    }

    const contents = fs.readFileSync(zshrcPath, "utf8");
    const result = stripZshHook(contents);
    if (!result.removed) {
      console.log(`No ph hook found in ${zshrcPath}`);
      return;
    }

    fs.writeFileSync(zshrcPath, result.updated, "utf8");
    console.log(`Removed ph hook from ${zshrcPath}`);
  } catch (err) {
    console.error(formatError(err));
    process.exitCode = 1;
  }
}
