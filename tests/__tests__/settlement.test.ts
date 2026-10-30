import { settleChallenge } from "@/src/config/pricing";
import { distributeRewards } from "@/lib/reward-calculation";
import { distributeXPRewards } from "@/lib/xp-reward-calculation";
it("legacy credit and XP settlement paths fail closed", async () => {
  await expect(distributeRewards("legacy")).rejects.toThrow(
    "Legacy settlement is disabled",
  );
  await expect(distributeXPRewards("legacy")).rejects.toThrow("not available");
});
it("conserves every cent for varied stakes, completion counts and cut rates", () => {
  for (let n = 0; n <= 20; n++)
    for (const cut of [0, 500, 2000, 10000])
      for (let winners = 0; winners <= n; winners++) {
        const participants = Array.from({ length: n }, (_, i) => ({
          userId: String(i).padStart(3, "0"),
          stakeCents: 1 + i * 113,
          completed: i < winners,
        }));
        const plan = settleChallenge(participants, 791, cut);
        expect(
          plan.credits.reduce((v, r) => v + r.amountCents, 0) +
            plan.platformTakeCents,
        ).toBe(participants.reduce((v, p) => v + p.stakeCents, 0) + 791);
        for (const reward of plan.credits)
          expect(reward.amountCents).toBeGreaterThanOrEqual(
            participants.find((p) => p.userId === reward.userId)!.stakeCents,
          );
      }
});
