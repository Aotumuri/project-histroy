import { formatError } from "../lib/errors";
import { buildZshHook } from "../lib/hook";

type HookOptions = {
  shell?: string;
};

export function hookAction(opts: HookOptions): void {
  try {
    const shell = String(opts.shell ?? "zsh").toLowerCase();
    if (shell !== "zsh") {
      throw new Error(`Unsupported shell: ${shell}`);
    }

    process.stdout.write(buildZshHook());
  } catch (err) {
    console.error(formatError(err));
    process.exitCode = 1;
  }
}
