"use strict";
const assert = require("node:assert");
const { effectivePolicy, unescapedWinPath, parseJsonText } = require("../bin/windoctor.js");

// Process scope (e.g. a parent shell started with -ExecutionPolicy Bypass) must not hide the policy new terminals get.
assert.deepStrictEqual(effectivePolicy({ MachinePolicy: "Undefined", UserPolicy: "Undefined", Process: "Bypass", CurrentUser: "Undefined", LocalMachine: "Restricted" }), { policy: "Restricted", scope: "LocalMachine" });
assert.deepStrictEqual(effectivePolicy({ Process: "Bypass", CurrentUser: "RemoteSigned", LocalMachine: "Restricted" }), { policy: "RemoteSigned", scope: "CurrentUser" });
assert.deepStrictEqual(effectivePolicy({ MachinePolicy: "AllSigned", CurrentUser: "RemoteSigned" }), { policy: "AllSigned", scope: "MachinePolicy" });
assert.deepStrictEqual(effectivePolicy({ MachinePolicy: "Undefined", UserPolicy: "Undefined", Process: "Undefined", CurrentUser: "Undefined", LocalMachine: "Undefined" }), { policy: "Restricted", scope: "default" });

// Git Bash drops unquoted single backslashes; quoted ones survive.
assert.strictEqual(unescapedWinPath(String.raw`C:\Users\me\hook.exe --x`), true);
assert.strictEqual(unescapedWinPath(String.raw`python C:\Users\me\hook.py`), true);
assert.strictEqual(unescapedWinPath(String.raw`python "C:\Users\me\hook.py"`), false);
assert.strictEqual(unescapedWinPath(String.raw`python 'C:\Users\me\hook.py'`), false);
assert.strictEqual(unescapedWinPath(String.raw`"C:\Program Files\x\hook.exe"`), false);
assert.strictEqual(unescapedWinPath(String.raw`python C:\\Users\\me\\hook.py`), false);
assert.strictEqual(unescapedWinPath("python C:/Users/me/hook.py"), false);
assert.strictEqual(unescapedWinPath("echo hi"), false);

// UTF-8 BOM from Windows PowerShell 5.1 is valid settings, not broken JSON.
assert.deepStrictEqual(parseJsonText('\uFEFF{"hooks":{}}'), { hooks: {} });
assert.throws(() => parseJsonText("{broken"));

console.log("ok — unit");
