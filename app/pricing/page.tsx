import Link from "next/link";
import { configuredBps, settleChallenge } from "@/src/config/pricing";
import { feeCents } from "@/lib/credit-amounts";

// Read the configured rates at request time, not build time.
export const dynamic = "force-dynamic";
export const metadata = {
  title: "How Stakr works and what it costs",
  description:
    "The fees and payout rules for Stakr credit challenges, with a worked example.",
};

const credits = (cents: number) =>
  (cents / 100).toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const percent = (bps: number) => `${bps / 100}%`;

export default function PricingPage() {
  const entryBps = configuredBps(undefined, "STAKR_ENTRY_FEE_BPS", 500);
  const cutBps = configuredBps(undefined, "STAKR_PLATFORM_CUT_BPS", 2000);

  // Worked example, computed by the same function that settles real challenges.
  const stakeCents = 1000;
  const hostCents = 2000;
  const example = settleChallenge(
    [
      { userId: "a", stakeCents, completed: true },
      { userId: "b", stakeCents, completed: true },
      { userId: "c", stakeCents, completed: false },
    ],
    hostCents,
    cutBps,
  );
  const winner = example.credits[0];

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-5 py-12 text-foreground">
      <header className="space-y-3">
        <h1 className="text-4xl font-bold">
          How Stakr works and what it costs
        </h1>
        <p className="text-lg text-muted-foreground">
          Back your commitment with credits. Finish what you promised and you
          get your stake back plus a share of what others forfeit. There are no
          subscriptions and nothing to buy.
        </p>
      </header>

      <section className="space-y-3 rounded-xl border p-6">
        <h2 className="text-2xl font-semibold">Credits</h2>
        <p>
          Challenges are joined with credits. New members can claim free welcome
          credits once their email is verified.{" "}
          <strong>
            Credits have no cash value: they cannot be bought, withdrawn or
            exchanged for money.
          </strong>
        </p>
      </section>

      <section className="space-y-3 rounded-xl border p-6">
        <h2 className="text-2xl font-semibold">The two charges</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Entry fee: {percent(entryBps)} of your stake.</strong>{" "}
            Charged when you join, on top of the stake, and kept by Stakr. It is
            not part of the prize pool. For a {credits(stakeCents)} credit stake
            the fee is {credits(feeCents(stakeCents, entryBps))}.
          </li>
          <li>
            <strong>Platform share: {percent(cutBps)} of the pool.</strong> The
            pool is the stakes of people who did not finish plus any credits the
            host added. Stakr keeps {percent(cutBps)} of it; the rest is shared
            equally between everyone who finished.
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Each challenge shows its exact fee and rules before you join, and they
          cannot be changed after it is published. If nobody finishes, the pool
          goes to Stakr.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border p-6">
        <h2 className="text-2xl font-semibold">A worked example</h2>
        <p>
          Three people each stake {credits(stakeCents)} credits. The host adds{" "}
          {credits(hostCents)}. Two finish and one does not.
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            Pool: {credits(stakeCents)} (forfeited stake) + {credits(hostCents)}{" "}
            (host) = {credits(example.poolCents)} credits
          </li>
          <li>
            Platform share ({percent(cutBps)}):{" "}
            {credits(example.platformTakeCents)}
          </li>
          <li>
            Shared between the two finishers:{" "}
            {credits(example.poolCents - example.platformTakeCents)}
          </li>
          <li>
            <strong>
              Each finisher receives {credits(winner.amountCents)} credits
            </strong>{" "}
            ({credits(winner.stakeCents)} stake back +{" "}
            {credits(winner.bonusCents)} share)
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          This example is calculated by the same code that settles real
          challenges. Entry fees are charged separately and are not shown above.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border p-6">
        <h2 className="text-2xl font-semibold">How results are decided</h2>
        <p>
          A neutral reviewer checks the evidence you submit against the
          published rules. If your evidence is rejected you have 24 hours to
          appeal to a different reviewer. Settlement waits until every review
          and appeal is resolved.
        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        Questions? Email{" "}
        <a className="underline" href="mailto:support@stakr.app">
          support@stakr.app
        </a>
        . See also our{" "}
        <Link className="underline" href="/terms">
          Terms
        </Link>{" "}
        and{" "}
        <Link className="underline" href="/privacy">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
