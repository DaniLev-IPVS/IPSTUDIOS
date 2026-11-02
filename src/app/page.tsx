import CoverRoom from "@/components/cover/CoverRoom";
import Gate from "@/components/cover/Gate";
import { hasAccess } from "@/lib/guard";

// The deck cover, live: 2026, the IP STUDIOS mark and the line under it, over the hero's room.
export default async function Cover({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const { k } = await searchParams;
  const access = await hasAccess().catch(() => false);
  return (
    <main className="cover">
      <CoverRoom />
      <div className="cover-vignette" aria-hidden />
      <p className="cover-year" aria-label="2026">2 0 2 6</p>
      <span className="cover-cross cover-cross-l" aria-hidden />
      <span className="cover-cross cover-cross-r" aria-hidden />
      <div className="cover-center">
        <h1 className="cover-mark">
          <span className="text-accent">IP</span> STUDIOS
        </h1>
        <p className="cover-sub">Monetizing IP and scaling internet trends</p>
        <Gate linkToken={k} hasAccess={access} />
      </div>
      <p className="cover-foot">
        <b>IP</b>STUDIOS. ALL RIGHTS RESERVED.
      </p>
    </main>
  );
}
