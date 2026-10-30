import { randomInt } from "crypto";

/**
 * Public handle for a new account. Derived from the display name plus a random
 * number, never from the email address: the handle is shown to other people,
 * so basing it on the email's local part would publish part of a private
 * identifier. Always 7-24 chars of [a-z0-9], matching users.username varchar(50).
 */
export function generateHandle(displayName: string): string {
  const base = displayName
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 14);
  return `${base || "member"}${randomInt(1000, 10000)}`;
}
