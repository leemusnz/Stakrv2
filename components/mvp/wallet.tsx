"use client";

import Link from "next/link";
import { useState } from "react";
import {
  button,
  LoadState,
  money,
  panel,
  Shell,
  useResource,
  utc,
} from "./shell";

export function Wallet() {
  const [page, setPage] = useState(1),
    r = useResource("/api/user/credits?page=" + page);
  return (
    <Shell
      title="Your credits"
      intro="Every stake, fee, return and refund is recorded here. Credits are for challenges; cash deposits and withdrawals are unavailable in this MVP."
    >
      <LoadState {...r} retry={r.refresh} />
      {r.data && (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <section className={panel}>
              <h2>Available balance</h2>
              <p className="mt-3 text-4xl font-bold">
                {money(r.data.wallet.balance)}
              </p>
            </section>
            <section className={panel}>
              <h2>Stakes awaiting settlement</h2>
              <p className="mt-3 text-4xl font-bold">
                {money(r.data.wallet.totalStaked)}
              </p>
            </section>
          </div>
          <section className={panel}>
            <h2 className="mb-4 text-2xl font-bold">Credit history</h2>
            {!r.data.wallet.transactions.length ? (
              <p>No credit transactions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3">Date (UTC)</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.data.wallet.transactions.map((t: any) => (
                      <tr key={t.id} className="border-b">
                        <td className="whitespace-nowrap p-3">{utc(t.date)}</td>
                        <td className="p-3">
                          {t.challengeId ? (
                            <Link
                              href={"/challenge/" + t.challengeId}
                              className="text-orange-700 underline"
                            >
                              {t.description}
                            </Link>
                          ) : (
                            t.description
                          )}
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {Number(t.amount) > 0 ? "+" : ""}
                          {money(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-5 flex items-center gap-4">
              <button
                className={button}
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>Page {page}</span>
              <button
                className={button}
                disabled={!r.data.pagination.hasNext}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </section>
        </>
      )}
    </Shell>
  );
}
