#!/usr/bin/env node
/* windoctor — diagnose Claude Code / Codex CLI setups on Windows. Zero deps. */
"use strict";
const { execSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const args = new Set(process.argv.slice(2));
const JSON_OUT = args.has("--json");
const isWin = process.platform === "win32";
const PKG_VERSION = require("../package.json").version;
if (args.has("--version") || args.has("-v")) { console.log(PKG_VERSION); process.exit(0); }
if (args.has("--help") || args.has("-h")) {
  console.log(`windoctor ${PKG_VERSION} — diagnose Claude Code / Codex CLI setups on Windows

Usage: npx windoctor [--json] [--version] [--help]

Read-only: prints every problem found with the exact fix. Never changes your system.
No telemetry. Exit code 0 = ok, 1 = warnings, 2 = failures.`);
  process.exit(0);
}

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"], encoding: "utf8", timeout: 15000, windowsHide: true, ...opts }).trim();
  } catch { return null; }
}
function which(name) {
  const out = run(isWin ? `where.exe ${name}` : `which ${name}`);
  return out ? out.split(/\r?\n/).filter(Boolean) : [];
}
function ps(script) {
  const r = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script], { encoding: "utf8", timeout: 20000, windowsHide: true });
  return r.status === 0 ? (r.stdout || "").trim() : null;
}
function semver(s) { const m = (s || "").match(/(\d+)\.(\d+)\.(\d+)/); return m ? m.slice(1, 4).map(Number) : null; }

const results = [];
function report(id, status, title, detail, fix, ref) { results.push({ id, status, title, detail, fix, ref }); }

// ---------- checks ----------
function checkPlatform() {
  if (!isWin) report("platform", "INFO", "Not Windows", `Running on ${process.platform}; most checks are Windows-specific.`);
  else report("platform", "PASS", "Windows detected", `${os.release()} · ${os.arch()} · ${os.cpus().length} threads · ${Math.round(os.totalmem() / 2 ** 30)} GB RAM`);
}

function checkNode() {
  const v = semver(process.version);
  if (v[0] >= 20) report("node", "PASS", "Node.js version", `${process.version}`);
  else if (v[0] >= 18) report("node", "WARN", "Node.js is old", `${process.version}; Claude Code wants 18+, Codex wants 20+. Some installs fail on 18.`, "Install Node 22 or 24 LTS from https://nodejs.org (or `winget install OpenJS.NodeJS.LTS`).");
  else report("node", "FAIL", "Node.js too old", process.version, "Install Node 22 or 24 LTS.");
  const npm = run("npm --version");
  report("npm", npm ? "PASS" : "FAIL", "npm on PATH", npm ? `npm ${npm}` : "npm not found", npm ? undefined : "Reinstall Node.js; npm ships with it.");
}

function checkNpmGlobalBinOnPath() {
  const prefix = run("npm config get prefix");
  if (!prefix) return;
  const bin = isWin ? prefix : path.join(prefix, "bin");
  const onPath = (process.env.PATH || "").split(path.delimiter).some(p => p && path.resolve(p).toLowerCase() === path.resolve(bin).toLowerCase());
  if (onPath) report("npm-bin", "PASS", "npm global bin is on PATH", bin);
  else report("npm-bin", "FAIL", "npm global bin is NOT on PATH", `${bin} — this is the #1 cause of \`'claude' is not recognized\` / \`'codex' is not recognized\` right after \`npm i -g\`.`,
    `Add it to your user PATH, then open a new terminal:\n    [Environment]::SetEnvironmentVariable('Path', $env:Path + ';${bin}', 'User')`);
}

function checkAgent(name, pkg, minMajor) {
  const found = which(name);
  if (!found.length) { report(name, "INFO", `${name} not installed`, `No \`${name}\` on PATH.`, `npm install -g ${pkg}   (note: the package is ${pkg}, not \`${name}\`)`); return; }
  const ver = run(`${name} --version`);
  report(name, ver ? "PASS" : "WARN", `${name} on PATH`, `${found[0]}${ver ? " · " + ver : " · version check failed"}`, ver ? undefined : `Run \`${name} --version\` manually; a hanging version check usually means a broken shim in ${path.dirname(found[0])}.`);
  const distinct = [...new Set(found.map(f => f.replace(/\.(cmd|exe|ps1)$/i, "").toLowerCase()))];
  if (distinct.length > 1) report(`${name}-dupes`, "WARN", `Multiple ${name} entries on PATH`, found.join("\n    "), "Keep one install (npm global OR standalone installer), remove the other, restart the terminal.");
}

function checkGitBash() {
  const git = which("git");
  if (!git.length) { report("git", "FAIL", "Git for Windows not on PATH", "Claude Code on Windows requires Git for Windows (it runs commands through Git Bash).", "winget install Git.Git   then restart the terminal."); return; }
  report("git", "PASS", "git on PATH", `${git[0]} · ${run("git --version") || ""}`);
  const envBash = process.env.CLAUDE_CODE_GIT_BASH_PATH;
  const candidates = [envBash, "C:\\Program Files\\Git\\bin\\bash.exe", "C:\\Program Files\\Git\\usr\\bin\\bash.exe", path.join(path.dirname(path.dirname(git[0])), "bin", "bash.exe")].filter(Boolean);
  const bash = candidates.find(p => fs.existsSync(p));
  const sysBash = which("bash").find(p => /System32\\bash\.exe$/i.test(p));
  if (!bash) report("git-bash", "FAIL", "Git Bash (bash.exe) not found", "Claude Code needs Git's bash.exe.", "Reinstall Git for Windows, or set CLAUDE_CODE_GIT_BASH_PATH to your bash.exe.");
  else report("git-bash", envBash ? "PASS" : "PASS", "Git Bash found", `${bash}${envBash ? " (via CLAUDE_CODE_GIT_BASH_PATH)" : ""}`);
  if (sysBash && which("bash")[0] === sysBash) report("wsl-bash-shadow", "WARN", "`bash` on PATH resolves to WSL's System32\\bash.exe", `${sysBash} comes before Git's bash. Hooks and scripts that call \`bash\` may run inside WSL instead of Git Bash.`, "Move `C:\\Program Files\\Git\\bin` above `%SystemRoot%\\System32` in PATH, or set CLAUDE_CODE_GIT_BASH_PATH.");
}

function checkPythonStubs() {
  const apps = path.join(process.env.LOCALAPPDATA || "", "Microsoft", "WindowsApps");
  for (const exe of ["python.exe", "python3.exe"]) {
    const p = path.join(apps, exe);
    if (fs.existsSync(p)) {
      const real = which(exe.replace(".exe", ""));
      const firstIsStub = real[0] && real[0].toLowerCase() === p.toLowerCase();
      if (firstIsStub) report(`py-stub-${exe}`, "FAIL", `${exe} resolves to the Microsoft Store stub`, `${p} is an App Execution Alias that opens the Store instead of running Python. Hooks that call \`${exe.replace(".exe", "")}\` fail with "command not found" or open a Store window.`,
        "Settings → Apps → Advanced app settings → App execution aliases → turn OFF the python/python3 aliases; then install Python from python.org or `winget install Python.Python.3.13`.", "anthropics/claude-code#85475");
    }
  }
  const py = which("python"), py3 = which("python3");
  if (py.length && !py3.length) report("python3-alias", "WARN", "`python3` is not on PATH (only `python`)", "Claude Code hooks and many plugins written for macOS/Linux call `python3`. On this machine that fails with `python3: command not found`.",
    `Create a shim next to python.exe:\n    copy "${py[0]}" "${path.join(path.dirname(py[0]), "python3.exe")}"\n  or add a python3.cmd on PATH containing:  @python %*`);
  else if (py3.length) { const v = run("python3 --version"); report("python3-alias", v ? "PASS" : "WARN", "`python3` resolves", `${py3[0]} · ${v || "but `python3 --version` failed from Node (shim without .exe/.cmd? PowerShell may still resolve it)"}`, v ? undefined : "Prefer a real python3.exe copy or python3.cmd so cmd.exe, PowerShell and Git Bash all resolve it."); }
  else report("python", "INFO", "Python not on PATH", "Only needed if you use hooks/plugins that run Python.", "winget install Python.Python.3.13");
}

function checkExecutionPolicy() {
  if (!isWin) return;
  const pol = ps("Get-ExecutionPolicy -Scope CurrentUser") || "";
  const eff = ps("Get-ExecutionPolicy") || "";
  if (/Restricted|AllSigned/i.test(eff)) report("execpolicy", "FAIL", "PowerShell execution policy blocks scripts", `Effective policy: ${eff}. npm-installed commands (claude.ps1, codex.ps1) refuse to run under this policy.`, "Set-ExecutionPolicy -Scope CurrentUser RemoteSigned");
  else report("execpolicy", "PASS", "PowerShell execution policy", `${eff}${pol && pol !== eff ? ` (CurrentUser: ${pol})` : ""}`);
}

function checkEncoding() {
  if (!isWin) return;
  const cp = run("chcp");
  const code = (cp || "").match(/(\d+)/)?.[1];
  const utf8Env = process.env.PYTHONUTF8 === "1";
  if (code && code !== "65001") report("codepage", "WARN", `Console code page is ${code}, not UTF-8 (65001)`, "Vietnamese/CJK text and emoji in tool output can turn into `?` or mojibake; Python hooks may raise UnicodeEncodeError.", `Run \`chcp 65001\` in the session, and set PYTHONUTF8=1 for Python:\n    [Environment]::SetEnvironmentVariable('PYTHONUTF8','1','User')${utf8Env ? "" : ""}`);
  else report("codepage", "PASS", "Console code page", code ? `${code} (UTF-8)` : (cp || "unknown"));
  if (!utf8Env) report("pythonutf8", "INFO", "PYTHONUTF8 not set", "Python defaults to the legacy code page on Windows; set PYTHONUTF8=1 to avoid encoding errors in hooks.", "[Environment]::SetEnvironmentVariable('PYTHONUTF8','1','User')");
}

function checkLongPaths() {
  if (!isWin) return;
  const v = ps("(Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\FileSystem' -Name LongPathsEnabled -ErrorAction SilentlyContinue).LongPathsEnabled");
  if (v === "1") report("longpaths", "PASS", "Long paths enabled", "LongPathsEnabled=1");
  else report("longpaths", "WARN", "Long paths (>260 chars) disabled", "Deep node_modules / worktree paths can fail with ENAMETOOLONG or 'path too long' during npm install and file edits.", "As Administrator:\n    New-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\FileSystem' -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force\n  and `git config --global core.longpaths true`");
}

function checkTerminal() {
  if (!isWin) return;
  const wt = which("wt").length > 0 || fs.existsSync(path.join(process.env.LOCALAPPDATA || "", "Microsoft", "WindowsApps", "wt.exe"));
  const inWT = !!process.env.WT_SESSION;
  if (inWT) report("terminal", "PASS", "Running inside Windows Terminal", "Best-supported host for Claude Code and Codex TUIs.");
  else if (wt) report("terminal", "WARN", "Windows Terminal installed but not in use", "Legacy conhost shows the known scrolling/flicker bugs and IME duplicate-candidate issues far more often.", "Open Windows Terminal (`wt`) and run claude/codex there.", "anthropics/claude-code#826, #14828");
  else report("terminal", "WARN", "Windows Terminal not installed", "Legacy conhost is the host most associated with flicker, scroll-jump and IME bugs.", "winget install Microsoft.WindowsTerminal", "anthropics/claude-code#826, #14828");
}

function checkRg() {
  const rg = which("rg");
  report("rg", rg.length ? "PASS" : "INFO", "ripgrep (rg)", rg.length ? rg[0] : "Not on PATH. Claude Code bundles its own; Codex Desktop bundles one that sometimes fails with Access Denied when a broken rg shadows it.", rg.length ? undefined : "Optional: winget install BurntSushi.ripgrep.MSVC", rg.length ? undefined : "openai/codex#13542");
}

function checkWsl() {
  if (!isWin) return;
  const wsl = which("wsl");
  if (!wsl.length) { report("wsl", "INFO", "WSL not installed", "Fine for native Windows use."); return; }
  const codexHome = process.env.CODEX_HOME;
  if (codexHome && /^[A-Za-z]:\\/.test(codexHome)) report("codex-home", "WARN", "CODEX_HOME points at a Windows path", `${codexHome}. If you run Codex inside WSL, it will inherit this Windows path and store worktrees/config on the Windows side.`, "Unset CODEX_HOME for WSL sessions, or set it per-environment.", "openai/codex#13762, #13549");
  else report("wsl", "PASS", "WSL present", `${wsl[0]}${codexHome ? " · CODEX_HOME=" + codexHome : ""}`);
}

function checkIme() {
  if (!isWin) return;
  const langs = ps("(Get-WinUserLanguageList | ForEach-Object { $_.LanguageTag }) -join ','") || "";
  const ime = /vi|ja|ko|zh/i.test(langs);
  if (ime) report("ime", "INFO", "IME language detected", `Keyboard languages: ${langs}. Claude Code and Codex TUIs have open issues with IME composition (duplicate candidates, dropped characters), worst on legacy conhost.`, "Use Windows Terminal; type Vietnamese/CJK prompts in an editor and paste, or use the Desktop/VS Code UI for long non-ASCII input.", "anthropics/claude-code#… (28 open IME issues)");
  else {
    const tools = (ps("Get-Process -Name UniKeyNT,UniKey,EVKey,EVKey64,GoTiengViet,OpenKey -ErrorAction SilentlyContinue | Select-Object -ExpandProperty ProcessName") || "").split(/\r?\n/).filter(Boolean);
    if (tools.length) report("ime", "INFO", "Vietnamese input tool running", `${tools.join(", ")} with layout ${langs}. Telex/VNI tools send composed characters through the console; Claude Code/Codex TUIs can drop or duplicate them, worst on legacy conhost.`, "Use Windows Terminal; for long Vietnamese prompts, compose in an editor and paste.", "anthropics/claude-code (28 open IME issues)");
    else report("ime", "PASS", "No IME layout or Vietnamese input tool detected", langs || "unknown");
  }
}

function checkClaudeConfig() {
  const home = os.homedir();
  const settings = path.join(home, ".claude", "settings.json");
  if (!fs.existsSync(settings)) { report("claude-settings", "INFO", "No ~/.claude/settings.json", "Claude Code has not been run yet, or uses defaults."); return; }
  try {
    const j = JSON.parse(fs.readFileSync(settings, "utf8"));
    const hooks = JSON.stringify(j.hooks || {});
    const py3 = /python3(?!\.)/.test(hooks) && !which("python3").length;
    const bashHooks = /"command":\s*"(\/usr\/bin\/bash|bash)\b/.test(hooks);
    if (py3) report("claude-hooks-python3", "FAIL", "A hook calls `python3` but `python3` is not on PATH", settings, "Fix python3 (see above) or point the hook at your python.exe.");
    else report("claude-settings", "PASS", "~/.claude/settings.json parses", `${Object.keys(j.hooks || {}).length} hook event(s) configured`);
    if (bashHooks) report("claude-hooks-bash", "INFO", "Hooks invoke `bash`", "Make sure `bash` resolves to Git Bash, not WSL (see wsl-bash-shadow).");
    const cmds = []; (function walk(v) { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") { if (typeof v.command === "string") cmds.push(v.command); Object.values(v).forEach(walk); } })(j.hooks || {});
    const backslash = cmds.filter(c => /[A-Za-z]:\\/.test(c) && !/[A-Za-z]:\\\\/.test(c) && !/^"?[A-Za-z]:\\/.test(c.trim()));
    if (backslash.length) report("claude-hooks-backslash", "WARN", "Hook command contains a Windows path with single backslashes", `${backslash.length} hook command(s) like: ${backslash[0].slice(0, 80)}. Hooks run through Git Bash, which eats unescaped backslashes, so the command can silently never execute.`, "Use forward slashes (C:/Users/...), or quote the path, or double the backslashes in settings.json.", "anthropics/claude-code#88578, #85475");
  } catch (e) { report("claude-settings", "FAIL", "~/.claude/settings.json is not valid JSON", String(e.message), "Fix the JSON; Claude Code silently ignores broken settings."); }
}

// ---------- run ----------
[checkPlatform, checkNode, checkNpmGlobalBinOnPath, () => checkAgent("claude", "@anthropic-ai/claude-code", 1), () => checkAgent("codex", "@openai/codex", 0),
 checkGitBash, checkPythonStubs, checkExecutionPolicy, checkEncoding, checkLongPaths, checkTerminal, checkRg, checkWsl, checkIme, checkClaudeConfig]
  .forEach(fn => { try { fn(); } catch (e) { report(fn.name, "INFO", `${fn.name} skipped`, String(e.message)); } });

const counts = results.reduce((a, r) => (a[r.status] = (a[r.status] || 0) + 1, a), {});
if (JSON_OUT) { console.log(JSON.stringify({ version: PKG_VERSION, platform: process.platform, counts, results }, null, 2)); }
else {
  const icon = { PASS: "✔", WARN: "!", FAIL: "✖", INFO: "·" };
  console.log(`\nwindoctor 0.1.0 — Claude Code / Codex CLI on Windows\n`);
  for (const r of results) {
    console.log(`${icon[r.status]} ${r.status.padEnd(4)} ${r.title}`);
    if (r.detail) console.log(`       ${r.detail.replace(/\n/g, "\n       ")}`);
    if (r.fix && r.status !== "PASS") console.log(`       fix: ${r.fix.replace(/\n/g, "\n       ")}`);
    if (r.ref && r.status !== "PASS") console.log(`       ref: ${r.ref}`);
  }
  console.log(`\n${counts.FAIL || 0} FAIL · ${counts.WARN || 0} WARN · ${counts.PASS || 0} PASS · ${counts.INFO || 0} INFO\n`);
}
process.exitCode = counts.FAIL ? 2 : counts.WARN ? 1 : 0;
