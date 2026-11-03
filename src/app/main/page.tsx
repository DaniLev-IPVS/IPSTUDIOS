import type { Metadata } from "next";
import HeroStage from "@/components/HeroStage";
import { requireViewer } from "@/lib/guard";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Main() {
  await requireViewer();
  return (
    <main className="relative text-cream">
      <HeroStage />
    </main>
  );
}
