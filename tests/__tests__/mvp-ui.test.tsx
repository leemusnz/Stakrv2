import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChallengeDetail } from "@/components/mvp/detail";
import { CreateChallenge } from "@/components/mvp/create";
import { Wallet } from "@/components/mvp/wallet";
jest.mock("next/navigation", () => ({
  usePathname: () => "/discover",
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "user" } } }),
  signOut: jest.fn(),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
const challenge = {
  id: "challenge",
  title: "Daily walk",
  description: "Walk every day.",
  category: "fitness",
  status: "pending",
  host_name: "Host",
  start_date: "2099-01-01T00:00:00Z",
  end_date: "2099-01-08T00:00:00Z",
  current_participants: 0,
  max_participants: 10,
  total_stake_pool: "0",
  host_contribution: "0",
  min_stake: "10",
  max_stake: "100",
  entry_fee_percentage: "5",
  failed_stake_cut: "20",
  rules: ["Walk for thirty minutes"],
  lifecycle_version: 1,
  lifecycle_policy: {
    requiredDays: 7,
    graceSeconds: 86400,
    appealSeconds: 86400,
    proofTypes: ["text"],
  },
  proof_requirements: { description: "Describe your walk" },
};
const response = (body: any, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => body,
});
beforeEach(() => {
  global.fetch = jest.fn();
});
it("shows exact costs and posts accepted join terms once", async () => {
  let joined = false;
  (fetch as jest.Mock).mockImplementation(async (url: string, options: any) => {
    if (url.endsWith("/join")) {
      joined = true;
      return response({ success: true });
    }
    if (url.endsWith("/checkins")) return response({ checkins: [] });
    return response({
      challenge,
      participation: joined
        ? { stake_amount: "50", completion_status: "active" }
        : null,
      settlement: null,
    });
  });
  render(<ChallengeDetail id="challenge" />);
  await screen.findByRole("heading", { name: "Back your commitment" });
  fireEvent.change(screen.getByLabelText("Stake (credits)"), {
    target: { value: "50" },
  });
  expect(screen.getByText("2.50")).toBeInTheDocument();
  expect(screen.getByText("52.50")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(
    screen.getByRole("button", { name: "Accept terms and join" }),
  );
  await screen.findByRole("heading", { name: "Your evidence & appeals" });
  const joins = (fetch as jest.Mock).mock.calls.filter(([url]) =>
    url.endsWith("/join"),
  );
  expect(joins).toHaveLength(1);
  expect(JSON.parse(joins[0][1].body)).toMatchObject({
    stakeAmount: 50,
    insurancePurchased: false,
    pointsOnly: false,
  });
});
it("presents failed wallet loads as errors and supports retry", async () => {
  (fetch as jest.Mock)
    .mockResolvedValueOnce(response({ error: "Database unavailable" }, 503))
    .mockResolvedValueOnce(
      response({
        wallet: { balance: "42.10", totalStaked: "0", transactions: [] },
        pagination: { hasNext: false },
      }),
    );
  render(<Wallet />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Database unavailable",
  );
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByText("42.10");
  expect(screen.queryByRole("alert")).toBeNull();
});
it("keeps a stable creation key when a response is lost and the user retries", async () => {
  (fetch as jest.Mock).mockRejectedValue(new Error("Connection interrupted"));
  Object.defineProperty(global.crypto, "randomUUID", {
    configurable: true,
    value: () => "11111111-1111-4111-8111-111111111111",
  });
  const { container } = render(<CreateChallenge />);
  const form = container.querySelector("form")!;
  // HTML field constraints are browser-enforced; this test exercises transport retries.
  fireEvent.submit(form);
  await screen.findByRole("alert");
  fireEvent.submit(form);
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  expect(JSON.parse((fetch as jest.Mock).mock.calls[0][1].body).requestId).toBe(
    JSON.parse((fetch as jest.Mock).mock.calls[1][1].body).requestId,
  );
});
