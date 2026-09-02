# Releasing

Releases are published by GitHub Actions through npm Trusted Publishing (OIDC). No npm token lives on any machine.

## History
- 0.1.0 published manually on 2026-09-02 12:44 UTC by npm user `hoanguyen93` from commit `40e2054` (no provenance; local publish). Every later version goes through the workflow below.

## One-time setup (package owner, on npmjs.com)
1. Done: the package exists (`windoctor@0.1.0`).
2. npmjs.com → package `windoctor` → Settings → Trusted publisher → GitHub Actions:
   - Organization or user: `ShenJun93`
   - Repository: `windoctor`
   - Workflow filename: `publish.yml`
   - Environment: leave blank
   - Allowed actions: `npm publish`
3. Do not push tag `v0.1.0`: it would re-run the publish of an existing version and fail. The next release is `npm version patch` → `v0.1.1`, only when there is a real change.
4. Optional hardening: Settings → Publishing access → "Require two-factor authentication or an automation token / trusted publisher".

## Every release
```bash
npm version patch          # bumps package.json, commits, creates tag vX.Y.Z
git push --follow-tags     # tag push triggers .github/workflows/publish.yml
```
The workflow verifies the tag matches `package.json`, runs the smoke test, and publishes with provenance.

## Verification limit
npm does not validate a trusted-publisher entry until a real publish (docs: "errors will only appear when you attempt to publish"). The dry run proves packaging, permissions and tool versions, not the OIDC exchange. If the first tagged release fails with `ENEEDAUTH`, the fix is on npmjs.com: workflow filename must be exactly `publish.yml`, repository `ShenJun93/windoctor`.

## Test the workflow without publishing
Actions → "Publish to npm" → Run workflow → `dry_run = true`. This runs `npm publish --dry-run` (packs, lists files, uploads nothing).
