import { render, waitFor } from "@testing-library/react";
import { PWARegistration } from "@/components/pwa-registration";

// Regression: a first-time visitor's page was force-reloaded ~0.5s after load
// because sw.js claims the page and the component reloaded on EVERY
// controllerchange. A one-shot request in flight (the email-verification POST)
// was repeated and the user saw "Verification Failed" after succeeding.
describe("PWARegistration reload behaviour", () => {
  const realLocation = window.location;
  let reload: jest.Mock;
  let listeners: Record<string, () => void>;

  function stubServiceWorker(controller: unknown) {
    listeners = {};
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        controller,
        register: jest
          .fn()
          .mockResolvedValue({
            scope: "/",
            addEventListener: jest.fn(),
            update: jest.fn(),
          }),
        addEventListener: (type: string, fn: () => void) => {
          listeners[type] = fn;
        },
        removeEventListener: (type: string) => {
          delete listeners[type];
        },
      },
    });
  }

  beforeEach(() => {
    reload = jest.fn();
    delete (window as unknown as { location?: Location }).location;
    (window as unknown as { location: Partial<Location> }).location = {
      ...realLocation,
      reload,
    };
  });

  afterEach(() => {
    (window as unknown as { location: Location }).location = realLocation;
  });

  it("does NOT reload when the worker claims the page on a first visit", async () => {
    stubServiceWorker(null);
    render(<PWARegistration />);
    await waitFor(() => expect(listeners.controllerchange).toBeDefined());
    listeners.controllerchange();
    expect(reload).not.toHaveBeenCalled();
  });

  it("reloads once when an existing worker is replaced by an update", async () => {
    stubServiceWorker({ state: "activated" });
    render(<PWARegistration />);
    await waitFor(() => expect(listeners.controllerchange).toBeDefined());
    listeners.controllerchange();
    listeners.controllerchange();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("removes its listener on unmount", async () => {
    stubServiceWorker(null);
    const { unmount } = render(<PWARegistration />);
    await waitFor(() => expect(listeners.controllerchange).toBeDefined());
    unmount();
    expect(listeners.controllerchange).toBeUndefined();
  });
});
