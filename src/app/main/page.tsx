import type { Metadata } from "next";
import HeroStage from "@/components/HeroStage";
import SessionTimer from "@/components/SessionTimer";
import { requireViewer, viewerTimeLeft } from "@/lib/guard";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Main() {
  await requireViewer();
  const msLeft = await viewerTimeLeft();
  return (
    <main className="relative text-cream">
      {msLeft !== null && <SessionTimer msLeft={msLeft} />}
      <HeroStage />
    </main>
  );
}
