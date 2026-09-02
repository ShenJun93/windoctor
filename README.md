# windoctor

**Why does Claude Code / Codex CLI not work on my Windows machine?**

`windoctor` answers that in ten seconds. One command, zero dependencies, nothing installed, nothing changed. It checks the things that actually break coding agents on Windows and prints the exact fix for each.

```powershell
npx windoctor
```

```text
windoctor 0.1.0 — Claude Code / Codex CLI on Windows

✔ PASS Windows detected
✔ PASS Node.js version
✖ FAIL npm global bin is NOT on PATH
       C:\Users\you\AppData\Roaming\npm — this is the #1 cause of 'claude' is not recognized right after npm i -g.
       fix: Add it to your user PATH, then open a new terminal: ...
! WARN `python3` is not on PATH (only `python`)
       Claude Code hooks and many plugins written for macOS/Linux call `python3`. On this machine that fails with `python3: command not found`.
       fix: copy "C:\Python313\python.exe" "C:\Python313\python3.exe"
✔ PASS Git Bash found
! WARN Windows Terminal installed but not in use
       ref: anthropics/claude-code#826, #14828
...
1 FAIL · 2 WARN · 9 PASS · 3 INFO
```

## What it checks

| Check | Symptom it explains |
|---|---|
| npm global bin on PATH | `'claude' is not recognized`, `'codex' is not recognized` right after install |
| Node.js / npm version | install failures, `ERR_REQUIRE_ESM` |
| `claude` / `codex` on PATH, duplicates | wrong version runs, hanging `--version` |
| Git for Windows + Git Bash | Claude Code refuses to start; hooks fail |
| `bash` shadowed by WSL's System32\bash.exe | hooks silently run inside WSL |
| Microsoft Store python/python3 stubs | `python3: command not found`, Store window opens |
| `python3` alias missing | Stop/PreToolUse hooks written for macOS fail |
| PowerShell execution policy | `claude.ps1 cannot be loaded because running scripts is disabled` |
| Console code page / PYTHONUTF8 | Vietnamese, CJK, emoji become `?`; `UnicodeEncodeError` in hooks |
| Long paths | `ENAMETOOLONG`, `Filename too long` in node_modules and worktrees |
| Windows Terminal vs conhost | flicker, scroll-to-top, IME duplicate candidates |
| WSL + `CODEX_HOME` mismatch | Codex in WSL writes config/worktrees to the Windows side |
| IME keyboard layouts | dropped characters while typing Vietnamese/Japanese/Chinese/Korean |
| `~/.claude/settings.json` | broken JSON silently ignored; hooks that call a missing `python3` |

Exit code: `0` all good, `1` warnings, `2` failures. `--json` for machine-readable output.

## What it does not do

It never modifies your system. Every fix is printed for you to run. `windoctor --fix` is not a thing yet; tell me in an issue which fixes you want automated.

## Why this exists

As of September 2026 there are 900 open issues with "windows" in the title on `anthropics/claude-code` and 2,651 on `openai/codex`. Most first-day failures are the same six things. This tool was written by a Windows + Vietnamese-IME user who hit every one of them.

## License

MIT
