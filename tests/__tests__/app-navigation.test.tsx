/**
 * Regression guards for B-030 (signed-in pages lost the real navigation and
 * graphics; install prompt came back after dismissal; uploaded avatars never
 * showed; one missing date crashed a page) and B-031 (email address sent to
 * third-party avatar services).
 */
import fs from "fs";
import path from "path";
import { act, render, screen, waitFor } from "@testing-library/react";
import {
  avatarSeed,
  getAllAvatars,
  getPersonalizedAvatar,
} from "@/lib/avatars";
import { utc } from "@/components/mvp/shell";

const root = path.join(__dirname, "..", "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { email: "jane.doe@example.com" } },
    update: jest.fn(),
  }),
}));

describe("navigation (B-030)", () => {
  it("gives every page the real navigation, with no per-page opt-out", () => {
    const frame = read("components/application-frame.tsx");
    expect(frame).toContain("<NavigationWrapper />");
    expect(frame).not.toMatch(/hasOwnNavigation|return <>\{children\}<\/>/);
    // The shared shell must not draw its own header again.
    expect(read("components/mvp/shell.tsx")).not.toMatch(/<header|<nav\b/);
  });

  it("has no dead links, fake numbers or currency sign in the menu", () => {
    const nav = read("components/navigation.tsx");
    expect(nav).not.toMatch(
      /href[:=]\s*"\/(social|my-active|admin)"|activeStakes/,
    );
    // A "$" shown as text before a number (JSX text, not a JS template literal).
    expect(nav).not.toMatch(/(^|>)\s*\$\{/m);
    expect(nav).toContain('fetch("/api/user/credits"');
    expect(read("components/navigation-wrapper.tsx")).not.toMatch(
      /activeStakes|credits:/,
    );
  });
});

describe("dates (B-030)", () => {
  it("shows 'Not scheduled' instead of crashing on a missing date", () => {
    expect(utc(undefined)).toBe("Not scheduled");
    expect(utc(null)).toBe("Not scheduled");
    expect(utc("2026-11-10T08:00:00Z")).toBe("10 Nov 2026, 08:00 UTC");
  });
});

describe("avatars", () => {
  it("never puts the email address in a third-party avatar URL (B-031)", () => {
    const email = "jane.doe@example.com";
    const urls = [
      getPersonalizedAvatar(email).url,
      ...getAllAvatars(email).map((a) => a.url),
    ];
    expect(urls.length).toBeGreaterThan(1);
    for (const url of urls) {
      expect(url).not.toContain("jane");
      expect(url).not.toContain("example");
      expect(url).not.toContain(encodeURIComponent(email));
    }
    // Stable per person, different between people.
    expect(avatarSeed(email)).toBe(avatarSeed(" Jane.Doe@example.com "));
    expect(avatarSeed(email)).not.toBe(avatarSeed("someone@example.com"));
  });

  it("uses the uploaded avatar the profile API returns (B-030)", async () => {
    const { useUserAvatar } = await import("@/hooks/use-user-avatar");
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        profile: { avatar: "https://cdn.example.org/me.png" },
      }),
    })) as any;
    function Probe() {
      return <span data-testid="avatar">{useUserAvatar().avatarUrl}</span>;
    }
    render(<Probe />);
    await waitFor(() =>
      expect(screen.getByTestId("avatar").textContent).toBe(
        "https://cdn.example.org/me.png",
      ),
    );
  });
});

describe("install prompt (B-030)", () => {
  const iphone =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    Object.defineProperty(window.navigator, "userAgent", {
      value: iphone,
      configurable: true,
    });
    window.matchMedia = jest.fn().mockReturnValue({ matches: false }) as any;
  });
  afterEach(() => jest.useRealTimers());

  it("stays closed after 'Got it', including after a reload", async () => {
    const { PWAInstallPrompt } =
      await import("@/components/pwa-install-prompt");
    const first = render(<PWAInstallPrompt />);
    act(() => jest.advanceTimersByTime(3500));
    expect(screen.getByText("Install Stakr")).toBeInTheDocument();
    act(() => screen.getByRole("button", { name: "Got it" }).click());
    act(() => jest.advanceTimersByTime(10_000));
    expect(screen.queryByText("Install Stakr")).toBeNull();
    first.unmount();
    render(<PWAInstallPrompt />); // a fresh page load
    act(() => jest.advanceTimersByTime(10_000));
    expect(screen.queryByText("Install Stakr")).toBeNull();
  });
});

describe("menu balance (B-030, Codex review of PR #15)", () => {
  it("refreshes after a successful change, without a page change", async () => {
    let balance = 0;
    global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/user/welcome-credits" && init?.method === "POST") {
        balance = 50;
        return { ok: true, json: async () => ({ success: true }) };
      }
      return { ok: true, json: async () => ({ wallet: { balance } }) };
    }) as any;
    const { useCreditBalance } = await import("@/components/navigation");
    const { api } = await import("@/components/mvp/shell");
    function Probe() {
      const value = useCreditBalance();
      return <span data-testid="balance">{String(value)}</span>;
    }
    render(<Probe />);
    await waitFor(() =>
      expect(screen.getByTestId("balance").textContent).toBe("0"),
    );
    await act(async () => {
      await api("/api/user/welcome-credits", {});
    });
    await waitFor(() =>
      expect(screen.getByTestId("balance").textContent).toBe("50"),
    );
  });
});
