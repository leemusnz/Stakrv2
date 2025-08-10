# Stakr V2 – Deploy Console Issues Summary

This document summarizes the errors shown during the latest Vercel deployment.

## What went wrong

1) Outdated pnpm lockfile
- Error: `ERR_PNPM_OUTDATED_LOCKFILE`
- Cause: `pnpm-lock.yaml` is not in sync with `package.json`.

2) CI frozen lockfile
- In CI (Vercel), installs run with a frozen lockfile by default.
- Result: Installation fails when `package.json` changes without an updated lockfile.

3) New dependencies not reflected in lockfile
- The console explicitly lists:
  - `browser-image-compression@latest`
  - `puppeteer@latest`
- These are present in `package.json` but not captured in `pnpm-lock.yaml`.

4) pnpm version note (informational)
- Detected `pnpm-lock.yaml` format 9.
- Vercel selected `pnpm@10` based on project creation date.
- This message is informational and not the cause of failure.

5) Install step failed
- `pnpm install` exited with status 1, so the build never reached `next build`.

## Quick fixes

- Preferred: Run `pnpm install` locally to update `pnpm-lock.yaml`, commit it, and redeploy.
- Or (CI override): Add a `vercel.json` with `"installCommand": "pnpm install --no-frozen-lockfile"` to allow installs even when the lockfile is stale.

Optional hygiene:
- Pin versions instead of `latest` for reproducible builds (especially for CI).
- If `puppeteer` is only for tests, consider moving it to `devDependencies`.
