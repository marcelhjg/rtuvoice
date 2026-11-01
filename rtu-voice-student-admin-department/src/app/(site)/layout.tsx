import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
