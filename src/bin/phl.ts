#!/usr/bin/env node
import { spawnSync } from "child_process";
import path from "path";

const cliPath = path.resolve(__dirname, "../cli.js");
const args = [cliPath, "list", ...process.argv.slice(2)];

const result = spawnSync(process.execPath, args, { stdio: "inherit" });
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
