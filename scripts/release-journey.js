#!/usr/bin/env node
// Release journey: drives the REAL production build in a browser, end to end, with explicit
// PASS/FAIL checks. From a brand-new signup through settlement to the cent, suspension, privacy
// export/deletion, abuse limits and the locked-down legacy surface.
//
// Run it (see docs/RUNNING_LOCALLY.md):
//   DATABASE_URL=postgresql://stakr:stakr@localhost:5432/stakr_dev?sslmode=disable \
//   CRON_SECRET=... BASE_URL=http://localhost:3000 npm run test:journey
//
// SAFETY: it TRUNCATEs users CASCADE, so it refuses to run against anything but a localhost
// database whose name ends in _dev, _test or _local.
const url = new URL(process.env.DATABASE_URL || "postgresql://invalid");
if (
  !["localhost", "127.0.0.1"].includes(url.hostname) ||
  !/_(dev|test|local)$/.test(url.pathname.slice(1))
) {
  console.error(
    `Refusing to run: DATABASE_URL must be a localhost database ending _dev, _test or _local (got ${url.hostname}${url.pathname}).`,
  );
  process.exit(3);
}
if (!process.env.CRON_SECRET) {
  console.error(
    "Refusing to run: set CRON_SECRET to the value the server was started with.",
  );
  process.exit(3);
}
// Full release journey against the production build + local Postgres (real Neon driver via local proxy).
const { chromium } = require("playwright");
const { execSync } = require("child_process");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const ENV = { CRON_SECRET: process.env.CRON_SECRET };
const PW = "Correct-Horse-9";
const psql = (q) =>
  execSync(
    `psql "${process.env.DATABASE_URL}" -X -tA -F'|' -c "${q.replace(/"/g, '\\"')}"`,
    { stdio: ["ignore", "pipe", "ignore"] },
  )
    .toString()
    .trim();
const day = 86400000,
  d = (n) =>
    new Date(Math.floor(Date.now() / day) * day + n * day)
      .toISOString()
      .slice(0, 10);
let pass = 0,
  fail = 0;
const check = (label, ok, detail = "") => {
  ok ? pass++ : fail++;
  console.log(
    `${ok ? "  PASS" : "  FAIL"}  ${label}${!ok && detail ? "  -> " + detail : ""}`,
  );
};
const section = (t) => console.log(`\n== ${t}`);
const issues = [];
function watch(page, who) {
  page.on("pageerror", (e) =>
    issues.push(`${who} PAGEERROR ${e.message.slice(0, 120)}`),
  );
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text()))
      issues.push(`${who} console.error ${m.text().slice(0, 160)}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 500)
      issues.push(`${who} HTTP ${r.status()} ${r.url().replace(BASE, "")}`);
  });
}
async function newUser(browser, who, email) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await ctx.newPage();
  watch(page, who);
  return { ctx, page, email, who };
}
async function signIn(u) {
  await u.page.goto(BASE + "/auth/signin", { waitUntil: "domcontentloaded" });
  await u.page.fill("input[type=email]", u.email);
  await u.page.fill("input[type=password]", PW);
  await u.page
    .locator("button[type=submit]")
    .filter({ hasText: /sign in/i })
    .first()
    .click();
  await u.page.waitForURL(/dashboard|onboarding|admin|verify-email/, {
    timeout: 30000,
  });
}
const apiUser = async (email, name, username) => {
  const r = await fetch(BASE + "/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: PW, name, username }),
  });
  return r.status;
};
const uid = (e) => psql(`select id from users where email='${e}'`);
const credits = (e) =>
  Number(psql(`select credits from users where email='${e}'`));

(async () => {
  psql("truncate users cascade");
  // PW_CHROMIUM lets CI/containers point at a pre-installed Chromium; otherwise Playwright's own.
  const browser = await chromium.launch(
    process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  );

  section("1. Brand-new user signs up through the real onboarding UI");
  const zed = await newUser(browser, "zed", `zed.${Date.now()}@example.test`);
  let regStatus = 0;
  zed.page.on("response", (r) => {
    if (r.url().endsWith("/api/auth/register")) regStatus = r.status();
  });
  await zed.page.goto(BASE + "/onboarding", { waitUntil: "domcontentloaded" });
  await zed.page.waitForTimeout(1200);
  const welcomeText = await zed.page.locator("body").innerText();
  check(
    "welcome screen shows NO fabricated stats",
    !/12k\+|\$1\.2M|94%/.test(welcomeText),
  );
  check(
    "welcome headline is accurate (credits, not money)",
    /Put Your Credits/.test(welcomeText),
  );
  await zed.page.getByRole("button", { name: /Start Your Journey/ }).click();
  await zed.page.waitForTimeout(800);
  await zed.page.getByText("Health & Fitness").first().click();
  await zed.page.waitForTimeout(500);
  await zed.page.getByRole("button", { name: "Exercise Daily" }).click();
  await zed.page.getByRole("button", { name: "Confirm Selection" }).click();
  await zed.page.waitForTimeout(800);
  await zed.page.fill("#name", "Zed Tester");
  await zed.page.fill("#email", zed.email);
  await zed.page.fill("#password", PW);
  await zed.page
    .locator("button[type=submit]")
    .filter({ hasText: /initialize|create|account/i })
    .first()
    .click();
  await zed.page.waitForURL(/verify-email/, { timeout: 30000 });
  check("register returned 201", regStatus === 201, String(regStatus));
  const row = psql(
    `select username, email_verified, credits from users where email='${zed.email}'`,
  ).split("|");
  check(
    "public handle is NOT derived from the email",
    !row[0].includes("zed") || /^zedtester\d{4}$/.test(row[0]),
    row[0],
  );
  check(
    "handle looks like name+4 digits",
    /^zedtester\d{4}$/.test(row[0]),
    row[0],
  );
  check(
    "new account starts unverified with 0 credits",
    row[1] === "f" && Number(row[2]) === 0,
  );

  section(
    '2. Email verification link (regression: page reloaded itself and showed "failed")',
  );
  const tok = psql(
    `select token from verification_tokens where email='${zed.email}'`,
  );
  check(
    "verification token is 43-char crypto token",
    /^[A-Za-z0-9_-]{43}$/.test(tok),
    tok,
  );
  const posts = [];
  zed.page.on("request", (r) => {
    if (r.url().includes("/api/auth/verify-email") && r.method() === "POST")
      posts.push(1);
  });
  await zed.page.goto(`${BASE}/auth/verify-email?token=${tok}`, {
    waitUntil: "domcontentloaded",
  });
  await zed.page.waitForTimeout(6000);
  const vtext = await zed.page.locator("body").innerText();
  check(
    'verify page did NOT show "Verification Failed"',
    !/Verification Failed/.test(vtext),
    zed.page.url(),
  );
  check(
    "the single-use token was submitted exactly once",
    posts.length === 1,
    String(posts.length),
  );
  check(
    "account is now verified with +50 XP",
    psql(
      `select email_verified::text||'|'||xp from users where email='${zed.email}'`,
    ) === "true|50",
  );

  section("3. Sign in, claim welcome credits");
  await signIn(zed);
  await zed.page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded" });
  await zed.page.waitForTimeout(2500);
  const dash = await zed.page.locator("body").innerText();
  check("dashboard offers the welcome credits", /free credits/i.test(dash));
  check('internal "MVP" label is gone from the UI', !/MVP/.test(dash));
  await zed.page.getByRole("button", { name: /Claim 50\.00 credits/ }).click();
  await zed.page.waitForTimeout(2500);
  check("balance is now 50.00", credits(zed.email) === 50);
  check(
    "welcome card disappears after claiming",
    !/free credits/i.test(await zed.page.locator("body").innerText()),
  );
  check(
    "one welcome_grant ledger row",
    psql(
      `select count(*) from credit_transactions t join users u on u.id=t.user_id where u.email='${zed.email}' and transaction_type='welcome_grant'`,
    ) === "1",
  );

  section("4. Other actors: admin Bob, host Alice, participant Carol");
  const emails = {
    bob: "bob@example.test",
    alice: "alice@example.test",
    carol: "carol@example.test",
  };
  for (const [n, e] of Object.entries(emails))
    check(
      `register ${n}`,
      (await apiUser(
        e,
        n[0].toUpperCase() + n.slice(1) + " Tester",
        "e2e" + n,
      )) === 201,
    );
  psql(
    `update users set email_verified=true,email_verified_at=now(),onboarding_completed=true where email like '%@example.test'`,
  );
  psql(
    `update users set is_dev=true,has_dev_access=true where email='${emails.bob}'`,
  );
  const bob = await newUser(browser, "bob", emails.bob),
    alice = await newUser(browser, "alice", emails.alice),
    carol = await newUser(browser, "carol", emails.carol);
  for (const u of [bob, alice, carol]) await signIn(u);
  for (const u of [alice, carol]) {
    const r = await u.page.request.post(BASE + "/api/user/welcome-credits");
    check(`${u.who} claims welcome credits via API`, r.status() === 200);
  }
  const again = await carol.page.request.post(
    BASE + "/api/user/welcome-credits",
  );
  check(
    "a second claim grants nothing",
    (await again.json()).granted === false,
  );

  section("5. Host publishes a challenge through the real form");
  const p = alice.page;
  await p.goto(BASE + "/create-challenge", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2000);
  await p.locator("input[name=title]").fill("Journey Daily Walk");
  await p
    .locator("textarea[name=description]")
    .fill("Walk for at least thirty minutes every day.");
  await p.locator("input[name=startDate]").fill(d(1));
  await p.locator("input[name=endDate]").fill(d(3));
  await p.locator("input[name=requiredDays]").fill("1");
  await p.locator("input[name=minStake]").fill("10");
  await p.locator("input[name=maxStake]").fill("20");
  await p.locator("input[name=hostContribution]").fill("0");
  await p.locator("input[name=maxParticipants]").fill("10");
  await p
    .locator("textarea[name=proofInstructions]")
    .fill("Describe where you walked and for how long.");
  await p.locator("textarea[name=rules]").fill("Walk for thirty minutes");
  const created = p.waitForResponse(
    (r) =>
      r.url().endsWith("/api/challenges") && r.request().method() === "POST",
  );
  await p.getByRole("button", { name: /Publish challenge/ }).click();
  check("challenge published (201)", (await created).status() === 201);
  await p.waitForTimeout(2000);
  const cid = psql(
    `select id from challenges where title='Journey Daily Walk'`,
  );
  check(
    "challenge is lifecycle v1",
    psql(`select lifecycle_version from challenges where id='${cid}'`) === "1",
  );

  section("6. Participants join with exact fee maths");
  async function join(u, stake) {
    await u.page.goto(BASE + "/challenge/" + cid, {
      waitUntil: "domcontentloaded",
    });
    await u.page.waitForTimeout(2500);
    const txt = await u.page.locator("body").innerText();
    await u.page.locator("input[type=number]").fill(String(stake));
    await u.page.locator("input[type=checkbox]").check();
    const resp = u.page.waitForResponse((r) => r.url().includes("/join"));
    await u.page.getByRole("button", { name: "Accept terms and join" }).click();
    return { status: (await resp).status(), txt };
  }
  const jz = await join(zed, 10),
    jc = await join(carol, 20);
  check("Zed joined (stake 10)", jz.status === 201);
  check("Carol joined (stake 20)", jc.status === 201);
  check(
    "Zed paid stake 10 + fee 0.50",
    credits(zed.email) === 39.5,
    String(credits(zed.email)),
  );
  check(
    "Carol paid stake 20 + fee 1.00",
    credits(carol.email) === 29,
    String(credits(carol.email)),
  );
  check(
    "join screen discloses fee and platform cut",
    /Entry fee/.test(jz.txt) && /20\.00% platform/.test(jz.txt),
  );

  section("7. Evidence, neutral review, settlement");
  psql(
    `update challenges set start_date=date_trunc('day',now() at time zone 'utc')-interval '1 day', end_date=date_trunc('day',now() at time zone 'utc')+interval '2 days'`,
  );
  await zed.page.goto(BASE + "/challenge/" + cid, {
    waitUntil: "domcontentloaded",
  });
  await zed.page.waitForTimeout(2500);
  await zed.page
    .locator("input[type=date]")
    .fill(new Date().toISOString().slice(0, 10));
  await zed.page
    .locator("textarea")
    .fill("Walked 40 minutes around the harbour this morning.");
  const sub = zed.page.waitForResponse((r) => r.url().includes("/checkins"));
  await zed.page.getByRole("button", { name: "Save proof for review" }).click();
  check("Zed submits evidence (201)", (await sub).status() === 201);
  const cantSelf = await alice.page.request.post(
    BASE + "/api/admin/verifications",
    { data: {} },
  );
  check(
    "a non-admin cannot reach the review API",
    cantSelf.status() === 403,
    String(cantSelf.status()),
  );
  await bob.page.goto(BASE + "/admin/challenges", {
    waitUntil: "domcontentloaded",
  });
  await bob.page.waitForTimeout(3000);
  await bob.page
    .locator("select[name=decision]")
    .selectOption({ label: "Approve evidence" });
  await bob.page
    .locator("textarea[name=reason]")
    .first()
    .fill("Specific place and duration; consistent with the published rules.");
  const rv = bob.page.waitForResponse(
    (r) =>
      r.url().includes("/api/admin/verifications") &&
      r.request().method() !== "GET",
  );
  await bob.page.getByRole("button", { name: "Record decision" }).click();
  check("admin approves evidence (200)", (await rv).status() === 200);
  psql(`update proof_submissions set proof_day=proof_day-5`);
  psql(
    `update challenges set start_date=start_date-interval '5 days', end_date=end_date-interval '5 days'`,
  );
  const noAuth = await fetch(BASE + "/api/cron/lifecycle");
  check(
    "cron endpoint rejects a request with no secret",
    noAuth.status === 401,
  );
  const cron = await fetch(BASE + "/api/cron/lifecycle", {
    headers: { authorization: "Bearer " + ENV.CRON_SECRET },
  });
  check(
    "cron settles the challenge",
    cron.status === 200 &&
      psql(`select status from challenges where id='${cid}'`) ===
        "rewards_distributed",
  );
  check(
    "Zed (finished) = 50 - 10.50 + 10 stake + 16 share = 65.50",
    credits(zed.email) === 65.5,
    String(credits(zed.email)),
  );
  check(
    "Carol (forfeited) = 29.00",
    credits(carol.email) === 29,
    String(credits(carol.email)),
  );
  check("Alice (host, no contribution) = 50.00", credits(alice.email) === 50);
  const platform =
    Number(
      psql(
        `select coalesce(sum(amount_cents),0) from challenge_platform_ledger`,
      ),
    ) / 100;
  check(
    "platform ledger = 4.00 cut + 1.50 entry fees = 5.50",
    platform === 5.5,
    String(platform),
  );
  const supply = Number(psql(`select sum(credits) from users`)) + platform;
  check(
    "credits conserved: balances + platform ledger = 3 welcome grants = 150.00",
    supply === 150,
    String(supply),
  );
  check(
    "ledger reconciles to balances for every user",
    psql(
      `select count(*) from users u where u.credits <> coalesce((select sum(amount) from credit_transactions t where t.user_id=u.id),0)`,
    ) === "0",
  );

  section("8. Suspension is enforced everywhere, immediately");
  const before = await carol.page.request.get(BASE + "/api/user/credits");
  check("Carol can use the API before suspension", before.status() === 200);
  await bob.page.goto(BASE + "/admin/challenges", {
    waitUntil: "domcontentloaded",
  });
  await bob.page.waitForTimeout(2000);
  await bob.page.locator("input[name=user]").fill(emails.carol);
  await bob.page
    .locator("input[name=reason]")
    .nth(1)
    .fill("Journey test: suspected duplicate account");
  const sus = bob.page.waitForResponse((r) =>
    r.url().includes("/api/admin/user-status"),
  );
  await bob.page.getByRole("button", { name: "Suspend account" }).click();
  check("admin suspends Carol by email (200)", (await sus).status() === 200);
  await new Promise((r) => setTimeout(r, 11000)); // account-status cache window is 10s
  const after = await carol.page.request.get(BASE + "/api/user/credits");
  check(
    "Carol's EXISTING session is cut off (401)",
    after.status() === 401,
    String(after.status()),
  );
  const fresh = await newUser(browser, "carol2", emails.carol);
  await fresh.page.goto(BASE + "/auth/signin", {
    waitUntil: "domcontentloaded",
  });
  await fresh.page.fill("input[type=email]", emails.carol);
  await fresh.page.fill("input[type=password]", PW);
  await fresh.page
    .locator("button[type=submit]")
    .filter({ hasText: /sign in/i })
    .first()
    .click();
  await fresh.page.waitForTimeout(4000);
  check(
    "suspended user cannot sign in again",
    !/dashboard/.test(fresh.page.url()),
    fresh.page.url(),
  );
  const lg = await bob.page.request.post(BASE + "/api/admin/user-status", {
    data: { user: emails.bob, action: "suspend", reason: "x" },
  });
  check("an admin cannot suspend themselves", lg.status() === 400);
  psql(
    `update users set moderation_status='approved' where email='${emails.carol}'`,
  );

  section("9. Privacy: data export and account deletion");
  const exp = await zed.page.request.get(BASE + "/api/user/export");
  const expBody = await exp.text();
  check(
    "export downloads JSON",
    exp.status() === 200 &&
      /attachment/.test(exp.headers()["content-disposition"] || ""),
  );
  check(
    "export contains the user, not the password hash",
    expBody.includes(zed.email) &&
      !/\$2[aby]\$/.test(expBody) &&
      !expBody.includes("password"),
  );
  await zed.page.goto(BASE + "/settings", { waitUntil: "domcontentloaded" });
  await zed.page.waitForTimeout(2500);
  await zed.page.locator('input[minlength="2"]').fill("Zed Renamed");
  const pr = zed.page.waitForResponse(
    (r) =>
      r.url().includes("/api/user/profile") && r.request().method() === "PATCH",
  );
  await zed.page.getByRole("button", { name: "Save changes" }).click();
  check(
    "display name updated",
    (await pr).status() === 200 &&
      psql(`select name from users where email='${zed.email}'`) ===
        "Zed Renamed",
  );
  const dis = await zed.page
    .getByRole("button", { name: /Delete my account permanently/ })
    .isDisabled();
  check("delete button is disabled until DELETE is typed", dis);
  await zed.page.getByLabel(/Type DELETE/).fill("DELETE");
  const del = zed.page.waitForResponse((r) =>
    r.url().includes("/api/user/delete"),
  );
  await zed.page
    .getByRole("button", { name: /Delete my account permanently/ })
    .click();
  check("account deleted (200)", (await del).status() === 200);
  await zed.page.waitForTimeout(3000);
  const gone = psql(
    `select name||'|'||email_verified::text||'|'||credits||'|'||coalesce(password_hash,'NULL') from users where id='${uid(zed.email) || "00000000-0000-0000-0000-000000000000"}'`,
  );
  const z = psql(
    `select name, credits, coalesce(password_hash,'NULL'), email like 'deleted-%' from users where name='Deleted user'`,
  ).split("|");
  check(
    "Zed is anonymised, credits forfeited, password gone",
    z[0] === "Deleted user" &&
      Number(z[1]) === 0 &&
      z[2] === "NULL" &&
      z[3] === "t",
    z.join(","),
  );
  check(
    "ledger still reconciles after deletion",
    psql(
      `select count(*) from users u where u.credits <> coalesce((select sum(amount) from credit_transactions t where t.user_id=u.id),0)`,
    ) === "0",
  );

  section("10. Legacy surface is closed; security headers are on");
  for (const path of [
    "/social",
    "/brand/1",
    "/creator/1",
    "/challenge/invite/ABC",
  ])
    check(
      `page ${path} -> 404`,
      (await fetch(BASE + path, { redirect: "manual" })).status === 404,
    );
  for (const path of [
    "/api/users",
    "/api/brands",
    "/api/creators",
    "/api/payments/withdraw",
    "/api/random-checkins/active",
    "/api/social/leaderboard",
    "/api/admin/dev-access",
    "/api/image-proxy",
  ])
    check(`api ${path} -> 404`, (await fetch(BASE + path)).status === 404);
  const root = await fetch(BASE + "/auth/signin");
  const h = root.headers;
  check(
    "CSP present and blocks framing",
    /frame-ancestors 'none'/.test(h.get("content-security-policy") || ""),
  );
  check(
    "HSTS, nosniff, DENY present",
    /max-age=63072000/.test(h.get("strict-transport-security") || "") &&
      h.get("x-content-type-options") === "nosniff" &&
      h.get("x-frame-options") === "DENY",
  );
  check("framework not advertised", !h.get("x-powered-by"));
  const health = await (await fetch(BASE + "/api/health")).json();
  check(
    "health endpoint answers with booleans only",
    health.checks &&
      health.checks.database === true &&
      !JSON.stringify(health).includes(ENV.CRON_SECRET),
  );

  section("11. Rebuilt account pages render for a real user");
  for (const r of [
    "/profile",
    "/settings",
    "/notifications",
    "/wallet",
    "/pricing",
  ]) {
    const resp = await alice.page.goto(BASE + r, {
      waitUntil: "domcontentloaded",
    });
    await alice.page.waitForTimeout(2500);
    const t = await alice.page.locator("body").innerText();
    check(
      `${r} renders (200) without legacy fakes`,
      resp.status() === 200 &&
        !/Premium|\$9\.99|Cashout|100%\s*Success/i.test(t),
    );
  }
  await alice.page.goto(BASE + "/wallet", { waitUntil: "domcontentloaded" });
  await alice.page.waitForTimeout(2500);
  const box = await alice.page.locator("table").first().boundingBox();
  check(
    "wallet table fits a 390px phone (no horizontal scroll needed)",
    box && box.width <= 390,
    JSON.stringify(box),
  );

  section("12. Abuse controls: rate limits and no account-existence oracle");
  const post = (path, body) =>
    fetch(BASE + path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  const fp = [];
  for (let i = 0; i < 4; i++)
    fp.push(
      (
        await post("/api/auth/forgot-password", {
          email: "nobody-fp@example.test",
        })
      ).status,
    );
  check(
    "forgot-password: 4th request for one address is 429",
    fp.join() === "200,200,200,429",
    fp.join(),
  );
  const resendStatuses = [];
  for (let i = 0; i < 4; i++)
    resendStatuses.push(
      (
        await post("/api/auth/resend-verification", {
          email: "nobody-rv@example.test",
        })
      ).status,
    );
  check(
    "resend-verification: 4th request for one address is 429",
    resendStatuses.join() === "200,200,200,429",
    resendStatuses.join(),
  );
  const unknown = await (
    await post("/api/auth/resend-verification", {
      email: "nobody-2@example.test",
    })
  ).json();
  const known = await (
    await post("/api/auth/resend-verification", { email: emails.alice })
  ).json();
  check(
    "resend-verification answers identically for unknown and already-verified accounts",
    unknown.success === true &&
      known.success === true &&
      unknown.message === known.message,
  );
  const rl = await newUser(browser, "attacker", "victim-guess@example.test");
  let limitedMsg = "";
  for (let i = 0; i < 10 && !limitedMsg; i++) {
    await rl.page.goto(BASE + "/auth/signin", {
      waitUntil: "domcontentloaded",
    });
    await rl.page.fill("input[type=email]", rl.email);
    await rl.page.fill("input[type=password]", "wrong-guess-" + i);
    await rl.page
      .locator("button[type=submit]")
      .filter({ hasText: /sign in/i })
      .first()
      .click();
    await rl.page.waitForTimeout(1500);
    const t = await rl.page.locator("body").innerText();
    if (/Too many sign-in attempts/.test(t))
      limitedMsg = "blocked after " + (i + 1);
  }
  check(
    'sign-in: repeated wrong passwords get a "too many attempts" message',
    !!limitedMsg,
    limitedMsg,
  );
  check(
    "health reports the shared (database) rate limiter",
    (await (await fetch(BASE + "/api/health")).json()).checks.rateLimit ===
      "database",
  );

  console.log(`\n${"=".repeat(60)}\n${pass} passed, ${fail} failed`);
  const uniq = [...new Set(issues)];
  console.log(
    uniq.length
      ? `\nBrowser issues observed (${uniq.length}):\n  ` + uniq.join("\n  ")
      : "\nNo browser console errors or 5xx responses observed.",
  );
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error("JOURNEY CRASHED:", e);
  process.exit(2);
});
