/**
 * Tells the menu's credit balance to refresh after something may have changed it
 * (welcome credits, joining or hosting a challenge, an admin grant). Browser-only.
 */
export const CREDITS_CHANGED = "stakr:credits-changed";

export function announceCreditsChanged(): void {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(CREDITS_CHANGED));
}
