# Releasing

Releases are published by GitHub Actions through npm Trusted Publishing (OIDC). No npm token lives on any machine.

## One-time setup (package owner, on npmjs.com)
1. The package must already exist on npm (first publish is manual: `npm login && npm publish --access public`).
2. npmjs.com → package `windoctor` → Settings → Trusted publisher → GitHub Actions:
   - Organization or user: `ShenJun93`
   - Repository: `windoctor`
   - Workflow filename: `publish.yml`
   - Environment: leave blank
   - Allowed actions: `npm publish`
3. Optional hardening: Settings → Publishing access → "Require two-factor authentication or an automation token / trusted publisher".

## Every release
```bash
npm version patch          # bumps package.json, commits, creates tag vX.Y.Z
git push --follow-tags     # tag push triggers .github/workflows/publish.yml
```
The workflow verifies the tag matches `package.json`, runs the smoke test, and publishes with provenance.

## Test the workflow without publishing
Actions → "Publish to npm" → Run workflow → `dry_run = true`. This runs `npm publish --dry-run` (packs, lists files, uploads nothing).
