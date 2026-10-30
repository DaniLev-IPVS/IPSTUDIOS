# IP Studios — Brand & Information Reference

Source: `IP-Studios-Deck-2026.pdf` (16-slide investor deck, 2026) plus the October 2026 brand kit (Branding Mark I). This file summarizes both so the site can be built from them. Structured copy also lives in `src/content.ts`.

## Positioning

- **Name:** IP Studios. Mark: Branding Mark I ("IP" in hot pink over "STUDIOS" in cream, see below)
- **Tagline:** Monetizing IP and scaling internet trends
- **Thesis:** Memes are never monetized correctly. IP Studios is "The IP Factory": acquire 25% of Tung Tung Tung Sahur and his universe, turn it into a multi-billion dollar franchise, and use that revenue, data and distribution to fund the next 100 IPs.

## Official mark: Branding Mark I

Chosen October 2026 from a 20-option exploration (option 03, "Masthead"). Version 1.0. The full kit, with copyable SVGs and a live contrast table, is the "IP Studios Brand Kit" artifact; the exploration is the "IP Studios Logo Options" artifact.

**Construction**

- **IP** — DM Serif Display Regular, tracking −4% of the type size. Always carries the accent (hot pink), or crimson at small sizes on cream, or the mono color.
- **STUDIOS** — Archivo SemiBold, all caps, letter-spaced until it spans exactly the width of IP. Type size 13% of the IP size; baseline 16% of the IP size below the IP baseline. Takes the text color of its ground (cream on dark, ink on light).
- **Unit x** — the cap height of the I. Clear space is ½x on every side, measured from the ink of the letters.
- **Never** stretch, recolor outside the palette, add effects, outline, swap typefaces, rotate, or retype the mark. Use the exported files.

**Lockups** (code in `src/components/Logo.tsx`, static files in `public/brand/`)

| Lockup | Use | Minimum size | Files |
| --- | --- | --- | --- |
| Primary (stacked) | Default. Covers, title cards, packaging | 64px / 18mm wide | `primary-*.svg` |
| Horizontal | Banners, email headers, sponsor rows | 140px wide | `horizontal-*.svg` |
| Inline | Site nav, footers, document headers, video bugs | 110px / 30mm wide | `inline-*.svg` |
| Monogram | App icon, favicon, social avatar (IP in a tile, radius 22%) | 24px / 7mm | `monogram-*.svg`, `src/app/icon.svg` |

**Color ways:** `on-dark` (pink IP, cream STUDIOS, for ink and wine grounds), `on-light` (pink IP, ink STUDIOS, 64px and up), `on-light-crimson` (small sizes and print on cream), `on-pink` (all ink), `mono-cream`, `mono-ink`. Monogram tiles: ink (default), wine, cream, pink, transparent.

The exported SVGs reference the Google Fonts families by name. Install DM Serif Display and Archivo before opening them in Figma or Illustrator, and convert text to outlines before sending files to printers or partners.

## Visual identity

| Token | Value | Use | Share |
| --- | --- | --- | --- |
| Ink | `#0a0607` | Page ground, type on light surfaces | 55% |
| Wine | `#4d0a1c` | Gradient mid-tone, card fills | 15% |
| Wine 2 | `#7a0f2a` | Gradient focal point, hover states | 8% |
| Crimson | `#a3123a` | Secondary card tone, small IP on cream | 4% |
| Accent (hot pink) | `#ff2d5e` | The IP in the mark, one or two words per headline, `$` and `+` on numbers | 5% |
| Cream | `#f4e8dd` | Headline and body text on dark | 10% |
| Cream 2 | `#d9c8bb` | Secondary text, hairline rules | 2% |
| Muted | `#9c8a86` | Eyebrows, labels, captions | 1% |
| Line | `rgba(244,232,221,.14)` | Hairline borders | — |

- **Wine radial** (the signature ground): `radial-gradient(ellipse 80% 110% at 60% 45%, #7a0f2a 0%, #4d0a1c 45%, #0a0607 100%)` with a 10% film-grain overlay set to overlay blend. Class `.bg-wine-radial` plus `.grain`.
- **Display type:** DM Serif Display, all caps, leading .95, tracking −1% to −2%. One or two words per headline in accent pink. Stats: large serif numerals with the `+` or `$` in pink, Archivo label beneath.
- **Text type:** Archivo. Body 400 at 16/1.6; UI labels 600; eyebrows 600, all caps, `.32em` tracking, muted (e.g. `2 0 2 6` on covers uses wider `.9em`).
- **Contrast:** cream on ink 16.7:1, pink on ink 5.6:1, cream on wine 12.7:1, ink on pink 5.6:1, pink on cream 3.0:1 (large type and the logo only; use crimson for small marks on cream).
- **Texture:** black-to-wine radial with subtle grain; registration-mark crosshairs on cover slides.
- **Cards:** rounded (≈24px), wine gradient fill, hairline cream border at ~14% opacity. Inactive cards use a darker ink gradient.

## Slide-by-slide content

1. **Cover.** 2026 · IP Studios · Monetizing IP and scaling internet trends.
2. **Italian Brainrot.** Character lineup (watermelon zebra, banana gorilla, Tung, coffee-cup ninja, Brr Brr Patapim).
3. **Absurd characters with absurd names that keep going viral since 2025.** Tung Tung Sahur, Tim Cheese, Ballerina Cappuccina, Tralalero Tralala, Brr Brr Patapim. Stats: 1 Trillion+ views · 100M+ fan-made videos · Millions of fans.
4. **The main character: Tung Tung Tung Sahur.**
5. **Tung is the most undervalued IP in the world right now.** $30M+ Fortnite revenue in first 48h · $100M's in knock-off merch and "collabs" · #1 custom game in Roblox history ("Steal a Brainrot") · $300M+ revenue over 16 months · 25M+ concurrent players (world record, more than Fortnite's all-time record).
6. **On par with IP giants, with $0 in marketing.** Google Trends ranking: PAW Patrol 23, MrBeast 22, Tung Tung Sahur 19, Peppa 16, TMNT 9.
7. **But the internet has a pattern… memes are never monetized correctly.** Pepe (creator lost control; captured almost nothing), Doge (billions of views, IP earned $0), Chill Guy (peaked and faded; never became a business).
8. **We have the opportunity to make history…** The next 3 years decide if Tung (A) cements his legacy next to Pikachu and Hello Kitty or (B) goes into the forgotten IP underworld.
9. **We've done this before.** Austin Lee (CEO), Blair Chapman III (CSO), Dan Rozenberg (CBDO). Full bios in `src/content.ts`.
10. **Advisors.** Matt Karol, Eyal Baumel, Phil McKenzie.
11. **We're acquiring 25% of Tung & his universe to turn it into a multi-billion dollar franchise.**
12. **Commercialization roadmap.** Phase 1 Break the Internet · Phase 2 Break into Retail · Phase 3 Break into Hollywood. $450M+ projected revenue.
13. **We're looking for strategic investors.** Raise $5,000,000: $1M Mementum Labs stake (25% + 20% revenue share) · $1.5M Brainrot growth strategy and team · $2.5M internet IP acquisitions, proprietary and celebrity IP development.
14. **Acquisition overview: Mementum Lab.** 100+ IPs under management · $1.6M in MGs (4 months) · $20M+ projected royalties.
15. **Tung funds the next 100 IPs.** Tung → revenue + data + distribution → IP Studios (team, distribution, network, retail relationships, data) → Proprietary IP, IP Acquisition, Celebrity IP.
16. **Closing.** IP Studios. All rights reserved.
