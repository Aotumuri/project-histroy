import fs from "fs";
import os from "os";
import path from "path";
import { formatError } from "../lib/errors";
import { buildZshHook, hasZshHook } from "../lib/hook";

type HookOptions = {
  shell?: string;
};

export function hookAction(opts: HookOptions): void {
  try {
    const shell = String(opts.shell ?? "zsh").toLowerCase();
    if (shell !== "zsh") {
      throw new Error(`Unsupported shell: ${shell}`);
    }

    const zshrcPath = path.join(os.homedir(), ".zshrc");
    if (fs.existsSync(zshrcPath)) {
      const contents = fs.readFileSync(zshrcPath, "utf8");
      if (hasZshHook(contents)) {
        throw new Error(`ph hook already present in ${zshrcPath}`);
      }
    }

    process.stdout.write(buildZshHook());
  } catch (err) {
    console.error(formatError(err));
    process.exitCode = 1;
  }
}
