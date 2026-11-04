// The one definition of "the sign-in human check (Cloudflare Turnstile) is switched on".
//
// It needs BOTH keys: the public site key (shows the box in the browser) and the secret
// key (lets the server check what the box produced). Everything that depends on it asks
// here, so they cannot disagree:
//   - config/security-headers.cjs trusts Cloudflare's origin only when this is true;
//   - next.config.mjs bakes the answer into the browser bundle (turnstileClientEnv);
//   - lib/turnstile.ts decides on the server.
// If the form and the server ever disagreed, a half-finished setup (one key) could block
// password sign-in for everybody (Codex review on PR #13).

function turnstileOn(env = process.env) {
  return Boolean(
    env.TURNSTILE_SECRET_KEY?.trim() &&
    env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
  );
}

// What the browser is told, at build time: a yes or no, never a key. (The public site key
// reaches the browser separately; the secret key never does.)
function turnstileClientEnv(env = process.env) {
  return { NEXT_PUBLIC_TURNSTILE_ENABLED: turnstileOn(env) ? "1" : "" };
}

module.exports = { turnstileOn, turnstileClientEnv };
