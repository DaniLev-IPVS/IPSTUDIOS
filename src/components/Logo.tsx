/**
 * IP Studios — Branding Mark I.
 *
 * IP: DM Serif Display, tracking -4% of the type size, carries the accent.
 * STUDIOS: Archivo SemiBold, caps, justified to the width of IP (primary) or to
 * a fixed tracked width (horizontal, inline). Geometry is expressed at an IP
 * type size of 100 and scales with the SVG, so every lockup keeps its
 * proportions at any size. Minimum sizes: primary 64px, inline 110px,
 * monogram 24px.
 *
 * STUDIOS uses `currentColor`, so set the text color on the parent (cream on
 * dark, ink on light). IP uses the accent token unless `mono` is set, in which
 * case the whole mark takes `currentColor` (mono cream, mono ink, ink on pink).
 * Static exports of every color way live in /public/brand.
 */

export type LogoVariant = "primary" | "horizontal" | "inline" | "monogram";

type Props = {
  variant?: LogoVariant;
  /** Whole mark in currentColor (mono cream, mono ink, ink on pink). */
  mono?: boolean;
  /** Override the IP color, e.g. "var(--color-crimson)" for small marks on cream. */
  accent?: string;
  /** Monogram tile fill. Defaults to ink. Use "none" to drop the tile. */
  tile?: string;
  title?: string;
  className?: string;
};

const SERIF = "var(--font-display), Georgia, serif";
const SANS = "var(--font-sans), Arial, sans-serif";
/** Width of "IP" in DM Serif Display at 100px with -4 tracking. */
const IP_W = 78.6;

export default function Logo({
  variant = "primary",
  mono = false,
  accent = "var(--color-accent)",
  tile = "var(--color-ink)",
  title = "IP Studios",
  className,
}: Props) {
  const ip = mono ? "currentColor" : accent;
  const common = { role: "img", "aria-label": title, className } as const;

  if (variant === "monogram") {
    return (
      <svg viewBox="0 0 200 200" {...common}>
        {tile !== "none" && <rect width="200" height="200" rx="44" fill={tile} />}
        <text x={100 - IP_W / 2} y="136" fontFamily={SERIF} fontSize="100" letterSpacing="-4" fill={ip}>
          IP
        </text>
      </svg>
    );
  }

  if (variant === "horizontal") {
    // IP | hairline | STUDIOS, cap centers aligned
    return (
      <svg viewBox="0 0 348.6 112" {...common}>
        <text x="20" y="92" fontFamily={SERIF} fontSize="100" letterSpacing="-4" fill={ip}>
          IP
        </text>
        <path d="M120.6 26V86" stroke="currentColor" strokeOpacity=".4" strokeWidth="1" />
        <text
          x="142.6"
          y="66.08"
          fontFamily={SANS}
          fontWeight="600"
          fontSize="28"
          textLength="186"
          lengthAdjust="spacing"
          fill="currentColor"
        >
          STUDIOS
        </text>
      </svg>
    );
  }

  if (variant === "inline") {
    // Baseline-aligned, for navigation and footers
    return (
      <svg viewBox="0 0 143.44 53" {...common}>
        <text x="12" y="41" fontFamily={SERIF} fontSize="40" letterSpacing="-1.6" fill={ip}>
          IP
        </text>
        <text
          x="53.44"
          y="41"
          fontFamily={SANS}
          fontWeight="600"
          fontSize="12"
          textLength="78"
          lengthAdjust="spacing"
          fill="currentColor"
        >
          STUDIOS
        </text>
      </svg>
    );
  }

  // Primary: stacked, STUDIOS justified to the width of IP
  return (
    <svg viewBox="0 0 118.6 137.36" {...common}>
      <text x="20" y="92" fontFamily={SERIF} fontSize="100" letterSpacing="-4" fill={ip}>
        IP
      </text>
      <text
        x="20"
        y="117.36"
        fontFamily={SANS}
        fontWeight="600"
        fontSize="13"
        textLength={IP_W}
        lengthAdjust="spacing"
        fill="currentColor"
      >
        STUDIOS
      </text>
    </svg>
  );
}
