# project-history

Store per-project command history in `.projh.json`.

## First-time setup (install once)

Do this once after installing the CLI.

1. Add the hook to `~/.zshrc`:
   `ph hook >> ~/.zshrc`
2. Reload your shell:
   `source ~/.zshrc`

## Per-project setup (do this for each project)

Run this in every project where you want history tracking.

1. Initialize:
   `ph init`
2. If asked, choose whether to add `.projh.json` to `.git/info/exclude`.

## View history

- Interactive viewer (latest 10 per page):
  `ph list` (or `ph l`)
  - Press `1-9`/`0` to run a command
  - Use Left/Right arrows to move between pages
- Plain output (latest 20):
  `ph list --plain`
- Plain output (latest 100):
  `ph list --plain -n 100`
- Plain output (all):
  `ph list --plain --all`

## Commands

- `ph init` initializes `.projh.json` and can add it to `.git/info/exclude`.
- `ph record` is used by the shell hook to append entries.
- `ph list` shows recent entries (newest first).
- `ph hook` prints the zsh hook snippet.
- `ph unhook` removes the hook from `~/.zshrc`.
- `ph uninstall` is an alias of `ph unhook`.

## Build (publish)

`npm run build` emits JavaScript into `dist/`.

## Uninstall (macOS, zsh)

1. Remove the hook:
   `ph unhook`
2. Uninstall the package with your package manager.
