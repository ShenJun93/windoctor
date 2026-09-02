---
name: windoctor
description: Diagnose why Claude Code or Codex CLI fails on Windows. Use when a user on Windows reports "claude is not recognized", "codex is not recognized", python3 not found in a hook, Git Bash missing, "running scripts is disabled", garbled Vietnamese/CJK/emoji output, ENAMETOOLONG, or an agent that "stopped working after install/update". Runs the read-only `windoctor` CLI and turns its findings into the exact fix commands.
---

# windoctor (Windows environment doctor for Claude Code / Codex CLI)

## When to use
The user is on Windows and something about Claude Code or Codex CLI does not run, is not found, or behaves oddly right after install or update. Do not use for macOS/Linux problems or for Desktop-app UI bugs.

## Run
```bash
npx -y windoctor --json
```
If npm cannot reach the registry, use the GitHub source: `npx -y github:ShenJun93/windoctor --json`.

The tool is read-only: it never changes the system and makes no network calls. Exit code 0 = ok, 1 = warnings, 2 = failures.

## Interpret
1. Read `results[]`. Handle every `FAIL` first, then `WARN`. Ignore `PASS`; mention `INFO` only if it matches the user's symptom.
2. For each finding, show the user the `fix` text verbatim as a command block. Do not run fixes yourself unless the user asks; several of them change PATH, execution policy, or registry values.
3. Map common symptoms to check ids:
   - "not recognized" right after `npm i -g` → `npm-bin`, `claude`, `codex`, `*-dupes`
   - `python3: command not found` in a hook → `python3-alias`, `py-stub-python3.exe`, `claude-hooks-python3`
   - hook never runs, no error → `claude-hooks-backslash`, `wsl-bash-shadow`
   - "running scripts is disabled" → `execpolicy`
   - `?` or mojibake in output, `UnicodeEncodeError` → `codepage`, `pythonutf8`
   - `ENAMETOOLONG` / "Filename too long" → `longpaths`
   - flicker, scroll jumps, dropped Vietnamese/CJK characters → `terminal`, `ime`
4. After the user applies a fix, tell them to open a new terminal and run `npx -y windoctor` again to confirm.

## Do not
- Do not claim a problem is fixed until the re-run shows the check as PASS.
- Do not generalize beyond the findings; if every check passes, say so and move to the agent's own logs.
