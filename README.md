# project-history

Store per-project command history in `.projh.json` (cwd is stored relative to the project root). Keep this file private and out of version control.

## First-time setup (install once)

Do this once after installing the CLI.

1. Add the hook to `~/.zshrc`:
   `ph hook >> ~/.zshrc`
2. Reload your shell:
   `source ~/.zshrc`

## Per-project setup (do this for each project)

Run this in every project where you want history tracking.

1. Initialize:
   `ph init` (or `phi`)
2. If asked, choose whether to add `.projh.json` to `.gitignore` (recommended so it is not published).
3. If asked, choose whether to record `ph` commands in history.

## View history

- Interactive viewer (latest 10 per page):
  `ph list` (or `ph l`, `phl`)
  - Press `1-9`/`0` to run a command
  - Use Left/Right arrows to move between pages
- Full output (full ISO timestamp + recorded cwd):
  `ph list --full`
- Plain output (latest 20):
  `ph list --plain`
- Plain output (latest 100):
  `ph list --plain -n 100`
- Plain output (all):
  `ph list --plain --all`

## Commands

- `ph init` initializes `.projh.json` and can add it to `.gitignore`.
- `ph record` is used by the shell hook to append entries.
- `ph list` shows recent entries (newest first).
- `ph reset` clears history entries after confirmation.
- `phi` runs `ph init`.
- `phl` runs `ph list`.
- `ph hook` prints the zsh hook snippet.
- `ph unhook` removes the hook from `~/.zshrc`.
- `ph uninstall` is an alias of `ph unhook`.

## Build (publish)

`npm run build` emits JavaScript into `dist/`.

## Uninstall (macOS, zsh)

1. Remove the hook:
   `ph unhook`
2. Uninstall the package with your package manager.
