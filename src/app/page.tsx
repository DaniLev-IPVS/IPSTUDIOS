import { brand } from "@/content";

export default function Home() {
  return (
    <main className="bg-wine-radial grain relative flex min-h-screen flex-col items-center justify-center gap-6 px-5 text-center">
      <p className="eyebrow !tracking-[0.9em]">{brand.year}</p>
      <h1 className="display text-7xl sm:text-9xl">
        <span className="text-accent">IP</span> Studios
      </h1>
      <p className="display text-xl tracking-wide text-cream-2 sm:text-2xl">
        {brand.tagline}
      </p>
    </main>
  );
}
