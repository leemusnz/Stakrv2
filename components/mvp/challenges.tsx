"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Brain,
  CalendarDays,
  Coins,
  Dumbbell,
  Leaf,
  Plus,
  Repeat,
  Scale,
  Search,
  Target,
  Trophy,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  button,
  field,
  IconTile,
  LoadState,
  money,
  panel,
  Shell,
  useResource,
  utc,
} from "./shell";
import { WelcomeCredits } from "./welcome";

const categoryIcons: Record<string, LucideIcon> = {
  fitness: Dumbbell,
  habit: Repeat,
  skill: Brain,
  wellness: Leaf,
  productivity: Target,
};

/** Approved proof days against the days required, from real participation data. */
export function ProofProgress({
  approved,
  required,
}: {
  approved: number;
  required: number;
}) {
  const done = Math.max(0, Number(approved) || 0);
  const pct = required > 0 ? Math.min(100, (done / required) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span>Proof days approved</span>
        <span className="font-semibold">
          {done}/{required}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Proof days approved"
        aria-valuemin={0}
        aria-valuemax={required}
        aria-valuenow={done}
        className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#F46036] to-[#D74E25] transition-all"
          style={{ width: pct + "%" }}
        />
      </div>
    </div>
  );
}

export function ChallengeList({ mine = false }: { mine?: boolean }) {
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    status: "joinable",
  });
  const [scope, setScope] = useState("joined");
  const [offset, setOffset] = useState(0);
  const query = new URLSearchParams({
    ...filters,
    offset: String(offset),
    limit: "24",
  });
  const resource = useResource(
    mine ? "/api/user/challenges?scope=" + scope : "/api/challenges?" + query,
  );
  return (
    <Shell
      title={mine ? "My challenges" : "Find your next commitment"}
      intro={
        mine
          ? "Follow your approved proof days, deadlines and credit returns."
          : "Choose a goal, lock your stake and submit evidence. Independent admins review every proof."
      }
    >
      {mine && (
        <div className="flex gap-3">
          <button
            className={button}
            aria-pressed={scope === "joined"}
            onClick={() => setScope("joined")}
          >
            Joined
          </button>
          <button
            className={button}
            aria-pressed={scope === "hosted"}
            onClick={() => setScope("hosted")}
          >
            Hosted by me
          </button>
        </div>
      )}
      {!mine && (
        <form
          className={panel + " grid gap-4 sm:grid-cols-4"}
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            setOffset(0);
            setFilters({
              q: String(data.get("q")),
              category: String(data.get("category")),
              status: String(data.get("status")),
            });
          }}
        >
          <label className="space-y-2">
            Search
            <input
              name="q"
              maxLength={100}
              className={field}
              placeholder="Challenge title"
            />
          </label>
          <label className="space-y-2">
            Category
            <select name="category" className={field}>
              <option value="">All categories</option>
              {["fitness", "habit", "skill", "wellness", "productivity"].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </select>
          </label>
          <label className="space-y-2">
            Status
            <select name="status" className={field}>
              <option value="joinable">Open to join</option>
              <option value="all">All challenges</option>
            </select>
          </label>
          <button className={button + " self-end"}>Apply filters</button>
        </form>
      )}
      <LoadState {...resource} retry={resource.refresh} />
      {resource.data && (
        <>
          {resource.data.challenges.length === 0 ? (
            <div className={panel}>
              <h2 className="text-xl font-heading font-semibold tracking-tight">
                {mine
                  ? "No challenges joined yet"
                  : "No challenges match these filters"}
              </h2>
              <p className="my-3 text-slate-600 dark:text-slate-400">
                {mine
                  ? "Browse upcoming challenges and choose a commitment that fits."
                  : "Try another filter or create a challenge with clear proof rules."}
              </p>
              <Link
                href={mine ? "/discover" : "/create-challenge"}
                className={button}
              >
                {mine ? "Explore challenges" : "Create a challenge"}
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {resource.data.challenges.map((c: any) => (
                <article key={c.id} className={panel + " flex flex-col gap-3"}>
                  <div className="flex items-center gap-3">
                    <IconTile
                      icon={categoryIcons[c.category] ?? Trophy}
                      muted
                    />
                    <p className="text-xs font-bold uppercase tracking-wide text-orange-700 dark:text-[#F46036]">
                      {c.category} · {c.status.replaceAll("_", " ")}
                    </p>
                  </div>
                  <h2 className="text-2xl font-heading font-bold tracking-tight">
                    <Link
                      href={"/challenge/" + c.id}
                      className="hover:underline"
                    >
                      {c.title}
                    </Link>
                  </h2>
                  <p className="line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {c.description}
                  </p>
                  <p className="flex gap-2 text-sm">
                    <CalendarDays
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400"
                    />
                    <span>
                      Starts {utc(c.start_date)}
                      <br />
                      Ends {utc(c.end_date)}
                    </span>
                  </p>
                  {c.lifecycle_version === 1 ? (
                    mine && c.approved_days != null ? (
                      <ProofProgress
                        approved={c.approved_days}
                        required={c.lifecycle_policy.requiredDays}
                      />
                    ) : (
                      <p className="flex items-center gap-2 text-sm">
                        <Users
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400"
                        />
                        {c.lifecycle_policy.requiredDays} approved proof days
                        required · {c.participants_count}/{c.max_participants}{" "}
                        joined
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      Legacy challenge awaiting an admin rules and credit
                      review.
                    </p>
                  )}
                  <p className="flex items-center gap-2 font-semibold">
                    <Coins
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-[#D74E25] dark:text-[#F46036]"
                    />
                    {mine && c.stake_amount != null
                      ? `${money(c.stake_amount)} credits staked · ${c.completion_status.replaceAll("_", " ")}`
                      : `${money(c.min_stake)}–${money(c.max_stake)} credit stake`}
                  </p>
                  <Link
                    href={"/challenge/" + c.id}
                    className={button + " mt-auto"}
                  >
                    View challenge
                  </Link>
                </article>
              ))}
            </div>
          )}
          {!mine && (
            <div className="flex items-center gap-4">
              <button
                className={button}
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - 24))}
              >
                Previous
              </button>
              <span>Page {offset / 24 + 1}</span>
              <button
                className={button}
                disabled={!resource.data.hasMore}
                onClick={() => setOffset(offset + 24)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </Shell>
  );
}

export function Dashboard() {
  const wallet = useResource("/api/user/credits");
  const mine = useResource("/api/user/challenges");
  const welcome = useResource("/api/user/welcome-credits");
  return (
    <Shell
      title="Make your commitment count"
      intro="Pick a challenge, back it with credits and show your progress. Your published rules determine the outcome."
    >
      {welcome.data?.eligible && (
        <WelcomeCredits
          amount={welcome.data.amount}
          onClaimed={() => {
            welcome.refresh();
            wallet.refresh();
          }}
        />
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <section className={panel}>
          <div className="flex items-center gap-3">
            <IconTile icon={Wallet} />
            <h2 className="text-lg font-heading font-semibold tracking-tight">
              Available credits
            </h2>
          </div>
          <LoadState {...wallet} retry={wallet.refresh} />
          {wallet.data && (
            <>
              <p className="my-4 text-4xl font-bold">
                {money(wallet.data.wallet.balance)}
              </p>
              <Link
                href="/wallet"
                className="text-orange-700 dark:text-[#F46036] underline"
              >
                View credit history
              </Link>
            </>
          )}
        </section>
        <section className={panel}>
          <div className="flex items-center gap-3">
            <IconTile icon={Trophy} />
            <h2 className="text-lg font-heading font-semibold tracking-tight">
              Your commitments
            </h2>
          </div>
          <LoadState {...mine} retry={mine.refresh} />
          {mine.data && (
            <>
              <p className="my-4 text-4xl font-bold">
                {
                  mine.data.challenges.filter(
                    (c: any) =>
                      !["cancelled", "rewards_distributed"].includes(c.status),
                  ).length
                }
              </p>
              <ul className="mb-4 space-y-3">
                {mine.data.challenges
                  .filter(
                    (c: any) =>
                      !["cancelled", "rewards_distributed"].includes(
                        c.status,
                      ) &&
                      c.lifecycle_version === 1 &&
                      c.approved_days != null,
                  )
                  .slice(0, 3)
                  .map((c: any) => (
                    <li key={c.id} className="space-y-1">
                      <Link
                        href={"/challenge/" + c.id}
                        className="font-semibold hover:underline"
                      >
                        {c.title}
                      </Link>
                      <ProofProgress
                        approved={c.approved_days}
                        required={c.lifecycle_policy.requiredDays}
                      />
                    </li>
                  ))}
              </ul>
              <Link
                href="/my-challenges"
                className="text-orange-700 dark:text-[#F46036] underline"
              >
                Review deadlines and submit proof
              </Link>
            </>
          )}
        </section>
      </div>
      <section className={panel + " space-y-4"}>
        <div className="flex items-center gap-3">
          <IconTile icon={Scale} muted />
          <h2 className="text-2xl font-heading font-bold tracking-tight">
            A fair finish starts with clear rules
          </h2>
        </div>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">
          Complete the required proof days to recover your stake and share the
          failed stakes and host contribution after the published platform cut.
          Pending evidence and appeals hold settlement until a neutral reviewer
          resolves them.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/discover" className={button + " gap-2"}>
            <Search aria-hidden="true" className="h-4 w-4" />
            Find a challenge
          </Link>
          <Link href="/create-challenge" className={button + " gap-2"}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            Host a challenge
          </Link>
        </div>
      </section>
    </Shell>
  );
}
