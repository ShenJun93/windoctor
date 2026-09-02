"use strict";
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const bin = path.join(__dirname, "..", "bin", "windoctor.js");
const r = spawnSync(process.execPath, [bin, "--json"], { encoding: "utf8", timeout: 60000 });
if (r.error) { console.error(r.error); process.exit(1); }
let j;
try { j = JSON.parse(r.stdout); } catch (e) { console.error("non-JSON output:\n" + r.stdout.slice(0, 500)); process.exit(1); }
const ids = new Set(j.results.map(x => x.id));
for (const must of ["platform", "node", "npm"]) if (!ids.has(must)) { console.error("missing check: " + must); process.exit(1); }
for (const x of j.results) if (!["PASS", "WARN", "FAIL", "INFO"].includes(x.status)) { console.error("bad status " + x.id); process.exit(1); }
console.log(`ok — ${j.results.length} checks, exit code ${r.status}, counts ${JSON.stringify(j.counts)}`);
