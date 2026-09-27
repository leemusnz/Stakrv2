"use client";
import { usePathname } from "next/navigation";
import { NavigationWrapper } from "@/components/navigation-wrapper";
import { MobileContentSpacer } from "@/components/mobile-content-spacer";
import { Footer } from "@/components/footer";

export function ApplicationFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const hasOwnNavigation =
    [
      "/dashboard",
      "/discover",
      "/my-challenges",
      "/my-active",
      "/wallet",
      "/create-challenge",
      "/admin/challenges",
    ].includes(path) ||
    /^\/challenge\/[^/]+$/.test(path) ||
    path.startsWith("/edit-challenge/");
  if (hasOwnNavigation) return <>{children}</>;
  return (
    <>
      <NavigationWrapper />
      <main style={{ paddingBottom: "var(--bottom-nav-safe-space, 0px)" }}>
        {children}
        <MobileContentSpacer />
      </main>
      <Footer />
    </>
  );
}
