#!/usr/bin/env node
import { program } from "commander";
import { hookAction } from "./commands/hook";
import { initAction } from "./commands/init";
import { listAction } from "./commands/list";
import { recordAction } from "./commands/record";
import { unhookAction } from "./commands/unhook";

program
  .name("ph")
  .description("Simply manage project history")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize project history for the current project")
  .option("-r, --root <path>", "Override project root")
  .action(initAction);

program
  .command("record")
  .description("Record a command (used by shell hook)")
  .requiredOption("-c, --cmd <command>", "Command to record")
  .option("-w, --cwd <path>", "Working directory", process.cwd())
  .option("-t, --time <iso>", "Timestamp (ISO-8601)")
  .action(recordAction);

program
  .command("list")
  .description("Show recent history entries (newest first)")
  .alias("l")
  .option("-n, --limit <number>", "Max entries to show")
  .option("--all", "Show all entries")
  .option("--full", "Show full timestamp and absolute cwd")
  .option("--plain", "Print plain output instead of interactive")
  .option("-r, --root <path>", "Override project root")
  .action(listAction);

program
  .command("hook")
  .description("Print a zsh hook snippet")
  .option("--shell <shell>", "Shell to generate hook for", "zsh")
  .action(hookAction);

program
  .command("unhook")
  .description("Remove the ph shell hook from ~/.zshrc")
  .option("--shell <shell>", "Shell to remove hook for", "zsh")
  .action(unhookAction);

program
  .command("uninstall")
  .description("Alias for unhook (run before uninstalling the CLI)")
  .option("--shell <shell>", "Shell to remove hook for", "zsh")
  .action(unhookAction);

program.parse();
