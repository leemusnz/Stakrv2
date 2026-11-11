"use client";
import { NavigationWrapper } from "@/components/navigation-wrapper";
import { MobileContentSpacer } from "@/components/mobile-content-spacer";
import { Footer } from "@/components/footer";

// One navigation for every page: the top bar (desktop menu, avatar, theme toggle,
// notifications) plus the phone bottom bar. Signed-in pages used to skip this and draw
// their own row of text links (B-030).
export function ApplicationFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[#F46036] focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <NavigationWrapper />
      <main
        id="main"
        style={{ paddingBottom: "var(--bottom-nav-safe-space, 0px)" }}
      >
        {children}
        <MobileContentSpacer />
      </main>
      <Footer />
    </>
  );
}
