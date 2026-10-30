import Logo from "@/components/Logo";
import { brand } from "@/content";

export default function Home() {
  return (
    <main className="bg-wine-radial grain relative flex min-h-screen flex-col items-center justify-center gap-8 px-5 text-center text-cream">
      <p className="eyebrow !tracking-[0.9em]">{brand.year}</p>
      <h1 className="m-0">
        <Logo variant="primary" className="block w-[min(300px,70vw)]" />
        <span className="sr-only">{brand.name}</span>
      </h1>
      <p className="display text-xl tracking-wide text-cream-2 sm:text-2xl">
        {brand.tagline}
      </p>
    </main>
  );
}
