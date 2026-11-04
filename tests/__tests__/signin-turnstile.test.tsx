// The sign-in form's "prove you're human" check (Cloudflare Turnstile). It is off
// until the owner sets a site key, and then password sign-in needs a fresh token
// for every attempt (a token works once).
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import SignInPage from "@/app/auth/signin/page";

let mockSignInCalls: unknown[][] = [];
let mockSignInResult: { ok: boolean; error?: string } = {
  ok: false,
  error: "CredentialsSignin",
};

jest.mock("next-auth/react", () => ({
  signIn: async (...args: unknown[]) => {
    mockSignInCalls.push(args);
    return mockSignInResult;
  },
  getSession: async () => null,
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {} }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("@/components/ui/background-image", () => ({
  BackgroundImage: () => null,
}));

// next/link watches its links with an IntersectionObserver, which jsdom does not provide.
beforeAll(() => {
  (window as any).IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
});

type Rendered = { id: string; options: Record<string, any> };
let rendered: Rendered[] = [];
let removed: string[] = [];

function installTurnstile() {
  (window as any).turnstile = {
    render: (_el: HTMLElement, options: Record<string, any>) => {
      const id = "widget-" + rendered.length;
      rendered.push({ id, options });
      return id;
    },
    remove: (id: string) => {
      removed.push(id);
    },
  };
}

const signInButton = () => screen.getByRole("button", { name: "Sign In" });
function fillForm() {
  fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
    target: { value: "victim@example.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("••••••••"), {
    target: { value: "correct-horse-9" },
  });
}
const pass = (token: string, index = rendered.length - 1) =>
  act(() => rendered[index].options.callback(token));

describe("sign-in form with the human check", () => {
  beforeEach(() => {
    mockSignInCalls = [];
    mockSignInResult = { ok: false, error: "CredentialsSignin" };
    rendered = [];
    removed = [];
    document.head.innerHTML = "";
    delete (window as any).turnstile;
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "0x4AAAAAAA";
    // The build sets this only when BOTH keys exist (config/turnstile.cjs).
    process.env.NEXT_PUBLIC_TURNSTILE_ENABLED = "1";
  });
  afterAll(() => {
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    delete process.env.NEXT_PUBLIC_TURNSTILE_ENABLED;
  });

  it("keeps Sign In disabled until the check has been passed", async () => {
    installTurnstile();
    render(<SignInPage />);
    await waitFor(() => expect(rendered).toHaveLength(1));
    expect(rendered[0].options.sitekey).toBe("0x4AAAAAAA");
    fillForm();
    expect(signInButton()).toBeDisabled();
    pass("tok-1");
    expect(signInButton()).toBeEnabled();
  });

  it("sends the token along with the password", async () => {
    installTurnstile();
    render(<SignInPage />);
    await waitFor(() => expect(rendered).toHaveLength(1));
    fillForm();
    pass("tok-1");
    fireEvent.click(signInButton());
    await waitFor(() => expect(mockSignInCalls).toHaveLength(1));
    expect(mockSignInCalls[0][0]).toBe("credentials");
    expect(mockSignInCalls[0][1]).toMatchObject({
      email: "victim@example.com",
      turnstileToken: "tok-1",
      redirect: false,
    });
  });

  it("asks for a fresh check after a failed attempt, because a token works once", async () => {
    installTurnstile();
    render(<SignInPage />);
    await waitFor(() => expect(rendered).toHaveLength(1));
    fillForm();
    pass("tok-1");
    fireEvent.click(signInButton());
    await waitFor(() => expect(rendered).toHaveLength(2));
    expect(removed).toContain("widget-0");
    expect(signInButton()).toBeDisabled();
    pass("tok-2");
    expect(signInButton()).toBeEnabled();
  });

  it("tells the person to complete the check when the server asks for it", async () => {
    installTurnstile();
    mockSignInResult = { ok: false, error: "error=challenge_required" };
    render(<SignInPage />);
    await waitFor(() => expect(rendered).toHaveLength(1));
    fillForm();
    pass("tok-1");
    fireEvent.click(signInButton());
    expect(await screen.findByText(/security check/i)).toBeInTheDocument();
  });

  it("disables Sign In again if the token expires", async () => {
    installTurnstile();
    render(<SignInPage />);
    await waitFor(() => expect(rendered).toHaveLength(1));
    fillForm();
    pass("tok-1");
    expect(signInButton()).toBeEnabled();
    act(() => rendered[0].options["expired-callback"]());
    expect(signInButton()).toBeDisabled();
  });

  it("loads Cloudflare's script once, and renders the widget when it arrives", async () => {
    render(<SignInPage />);
    const scripts = () =>
      document.head.querySelectorAll(
        'script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]',
      );
    await waitFor(() => expect(scripts()).toHaveLength(1));
    expect(scripts()[0].getAttribute("src")).toContain("render=explicit");
    expect(rendered).toHaveLength(0);
    installTurnstile();
    act(() => {
      scripts()[0].dispatchEvent(new Event("load"));
    });
    await waitFor(() => expect(rendered).toHaveLength(1));
  });

  // When Cloudflare is down, or an ad-blocker or firewall stops its script loading, the
  // widget can never produce a token. The form must not be the thing that turns that into
  // "nobody can sign in with a password": it lets the person try, and the SERVER decides
  // (it asks Cloudflare itself, so a visitor cannot fake an outage). Codex review, PR #13, P1.
  describe("when the check cannot run", () => {
    const script = () =>
      document.head.querySelector(
        'script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]',
      ) as HTMLScriptElement;

    it("explains it, and still lets the person try when Cloudflare's script cannot be loaded", async () => {
      render(<SignInPage />);
      await waitFor(() => expect(script()).not.toBeNull());
      expect(screen.queryByRole("alert")).toBeNull();
      fillForm();
      // While the widget is still loading, Sign In waits (the normal case).
      expect(signInButton()).toBeDisabled();
      const failed = script();
      act(() => {
        failed.dispatchEvent(new Event("error"));
      });
      expect(await screen.findByRole("alert")).toHaveTextContent(
        /security check did not load properly/i,
      );
      expect(signInButton()).toBeEnabled();
      // The dead script tag is removed, so a later mount can try again.
      expect(document.head.contains(failed)).toBe(false);

      fireEvent.click(signInButton());
      await waitFor(() => expect(mockSignInCalls).toHaveLength(1));
      expect(mockSignInCalls[0][1]).toMatchObject({
        email: "victim@example.com",
        turnstileToken: "",
      });
    });

    it("lets the person try when the widget itself reports an error", async () => {
      installTurnstile();
      render(<SignInPage />);
      await waitFor(() => expect(rendered).toHaveLength(1));
      fillForm();
      expect(signInButton()).toBeDisabled();
      act(() => rendered[0].options["error-callback"]());
      expect(await screen.findByRole("alert")).toHaveTextContent(
        /security check did not load properly/i,
      );
      expect(signInButton()).toBeEnabled();
      fireEvent.click(signInButton());
      await waitFor(() => expect(mockSignInCalls).toHaveLength(1));
      expect(mockSignInCalls[0][1]).toMatchObject({ turnstileToken: "" });
    });

    it("sends the real token if the widget fails after it already produced one", async () => {
      installTurnstile();
      render(<SignInPage />);
      await waitFor(() => expect(rendered).toHaveLength(1));
      fillForm();
      pass("tok-1");
      act(() => rendered[0].options["error-callback"]());
      fireEvent.click(signInButton());
      await waitFor(() => expect(mockSignInCalls).toHaveLength(1));
      expect(mockSignInCalls[0][1]).toMatchObject({ turnstileToken: "tok-1" });
    });
  });
});

// Off means off: with neither key, and with only the public site key (a half-finished
// setup), the form must behave exactly as before. The server ignores a lone key, so a form
// that demanded a token would block password sign-in for everyone. Codex review, PR #13, P2.
describe.each([
  ["no keys are set", {}],
  [
    "only the public site key is set",
    { NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAAA" },
  ],
])("sign-in form when %s", (_name, env) => {
  beforeEach(() => {
    mockSignInCalls = [];
    mockSignInResult = { ok: false, error: "CredentialsSignin" };
    rendered = [];
    document.head.innerHTML = "";
    delete (window as any).turnstile;
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    delete process.env.NEXT_PUBLIC_TURNSTILE_ENABLED;
    Object.assign(process.env, env);
  });
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  });

  it("is unchanged: no widget, no script, Sign In works straight away", async () => {
    installTurnstile();
    render(<SignInPage />);
    fillForm();
    expect(signInButton()).toBeEnabled();
    fireEvent.click(signInButton());
    await waitFor(() => expect(mockSignInCalls).toHaveLength(1));
    expect(mockSignInCalls[0][1]).not.toHaveProperty("turnstileToken");
    expect(rendered).toHaveLength(0);
    expect(document.head.querySelectorAll("script")).toHaveLength(0);
  });
});
