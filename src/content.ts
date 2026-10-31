// All site copy, sourced from the IP Studios 2026 deck.

export const brand = {
  name: "IP Studios",
  year: "2026",
  tagline: "Monetizing IP and scaling internet trends",
  copyright: "IP Studios. All rights reserved.",
  // Official mark. See docs/brand/BRAND.md and src/components/Logo.tsx.
  mark: { name: "Branding Mark I", version: "1.0", issued: "2026-10" },
};

export const brainrotCharacters = [
  "Tung Tung Sahur",
  "Tim Cheese",
  "Ballerina Cappuccina",
  "Tralalero Tralala",
  "Brr Brr Patapim",
];

export const viralStats = [
  { value: "1 Trillion", suffix: "+", label: "Views" },
  { value: "100M", suffix: "+", label: "Fan-made videos" },
  { value: "Millions", suffix: "", label: "of fans" },
];

export const tungStats = [
  {
    value: "$30M+",
    partner: "Fortnite",
    label: "Revenue generated in its first 48 hours.",
  },
  {
    value: "$100M's",
    partner: null,
    label: "In knock-off merch and “collabs” sold around the world.",
  },
  {
    value: "#1",
    partner: "Roblox",
    label: "Custom game in Roblox history, “Steal a Brainrot”.",
  },
  {
    value: "$300M+",
    partner: null,
    label: "Revenue generated over 16 months.",
  },
  {
    value: "25M+ Players",
    partner: null,
    label: "World record in concurrent players, more than Fortnite's all-time record.",
  },
];

export const ranking = [
  { rank: 1, name: "PAW Patrol", score: 23, color: "#f5d90a" },
  { rank: 2, name: "MrBeast", score: 22, color: "#ff3b3b" },
  { rank: 3, name: "Tung Tung Sahur", score: 19, color: "#2f6bff", highlight: true },
  { rank: 4, name: "Peppa", score: 16, color: "#ff8a1f" },
  { rank: 5, name: "Teenage Mutant Ninja Turtles", score: 9, color: "#3ec46d" },
];

export const pattern = [
  { name: "Pepe", note: "Creator lost control; captured almost nothing." },
  { name: "Doge", note: "Billions of views. The IP earned $0." },
  { name: "Chill Guy", note: "Peaked and faded; never became a business." },
];

export const team = [
  {
    name: "Austin Lee",
    role: "CEO",
    photo: "/deck/team-austin.png",
    bullets: [
      "Former CMO of Pudgy Penguins and advisor to other IPs with over 300B+ views and generating $100M+ in revenue.",
      "Contributed $3B+ in enterprise value across 12+ startups.",
      "Partnered with Meme Page Networks with over 500M+ followers across all platforms.",
    ],
  },
  {
    name: "Blair Chapman III",
    role: "CSO",
    photo: "/deck/team-blair.png",
    bullets: [
      "Founder of The One Platform, the largest platform of viral editors in the world.",
      "Helped global film and music IPs such as “Iris Out” from Chainsaw Man chart #1 internationally.",
      "Worked alongside the internet's most viral creators while managing 8-figure marketing budgets at 2 unicorn start-ups.",
    ],
  },
  {
    name: "Dan Rozenberg",
    role: "CBDO",
    photo: "/deck/team-dan.png",
    bullets: [
      "Growth operator driving $100M+ in revenue across global retail distribution.",
      "Co-founded merch brands with Noah Schnapp from Stranger Things and other celebrities.",
      "Kickstarted Pudgy Penguin licensing & retail journey leading to $20M+ in revenue.",
    ],
  },
];

export const advisors = [
  {
    name: "Matt Karol",
    photo: "/deck/advisor-matt.png",
    bullets: [
      "Founder of Akashic Studios, a film and IP development company.",
      "Producer of Our Hero Balthazar, listed by Variety as one of the best films of 2026.",
      "Background in Law and M&A at Stikeman Elliott, with over 40 early-stage technology investments.",
    ],
  },
  {
    name: "Eyal Baumel",
    photo: "/deck/advisor-eyal.png",
    bullets: [
      "Founder of Flywheel and former CEO of Yoola, the #1 YouTube agency generating 15B+ monthly views across 300+ creators.",
      "Directly partnered with MrBeast, Like Nastya and Rebecca Zamolo to grow their franchises through brand and venture building.",
      "Leads Netflix partnerships for creator brands including the Stokes Twins and Jordan & Salish Matter.",
    ],
  },
  {
    name: "Phil McKenzie",
    photo: "/deck/advisor-phil.png",
    bullets: [
      "Co-Founder and COO, Goldfinch.",
      "Oscar and BAFTA winning producer and one of the UK's most active independent entertainment financiers, with more than $300m deployed across 300+ projects and producer credits on over 60 film and TV productions.",
      "Founding partner of the Commonwealth Creative Industries Alliance, coordinating creative economy development across 56 nations.",
    ],
  },
];

export const roadmap = [
  {
    phase: "Phase 1",
    title: "Break the Internet",
    active: true,
    items: ["Consolidate channels", "Creator collabs", "New content proliferation"],
  },
  {
    phase: "Phase 2",
    title: "Break into Retail",
    active: false,
    items: [
      "Global retail rollout",
      "Blind boxes, TCG, toys, D2C merch",
      "Live events + gaming",
    ],
  },
  {
    phase: "Phase 3",
    title: "Break into Hollywood",
    active: false,
    items: [
      "Feature film, theatrical",
      "Global press run",
      "Streaming + franchise licensing",
      "Become #1 grossing film of all-time",
    ],
  },
];

export const raise = {
  total: "$5,000,000",
  allocations: [
    {
      amount: "$1M",
      pct: 20,
      color: "#ff2d5e",
      label: "Acquire up to a 25% stake and a 20% revenue share in Mementum Labs",
      sub: "Triple T & 100+ brainrot characters",
    },
    {
      amount: "$1.5M",
      pct: 30,
      color: "#e6f531",
      label: "Fuel our Brainrot growth strategy and team",
      sub: null,
    },
    {
      amount: "$2.5M",
      pct: 50,
      color: "#8a1030",
      label: "Internet IP acquisitions, proprietary and celebrity IP development",
      sub: null,
    },
  ],
};

export const mementum = [
  { value: "100+ IPs", label: "under management" },
  { value: "$1.6M", label: "in MGs (4 months)" },
  { value: "$20M+", label: "in projected royalties" },
];

export const factory = {
  inputs: ["Team", "Distribution", "Network", "Retail relationships", "Data"],
  outputs: [
    {
      title: "Proprietary IP",
      note: "Create and own original franchises from 0 applying the Pudgy playbook.",
    },
    {
      title: "IP Acquisition",
      note: "Buy culturally relevant IP with existing audiences.",
    },
    {
      title: "Celebrity IP",
      note: "Partner with talent to create character franchises.",
    },
  ],
  thesis:
    "The operational muscles, audience data, relationships and revenue acquired through Tung are the exact same muscles required to launch original IP. The infrastructure becomes more valuable and cost efficient with every character pushed through the factory.",
};

// ---------------------------------------------------------------------------
// Hero site copy: one block per resting frame of the hero video.
// Positions are percentages of the 16:9 video frame, measured from the Blender
// blocking camera at each resting frame (see docs/site/CONCEPT.md, section 4c).
// ---------------------------------------------------------------------------

// TODO(Daniel): confirm the public contact address before launch.
export const contactEmail = "hello@ipstudios.com";

export const sections = {
  world: {
    eyebrow: "The world",
    title: ["Absurd characters,", "absurd names,"],
    accent: "viral since 2025",
    body: "Italian Brainrot and the meme characters around it are the most watched new IP on the internet, built entirely by fans.",
  },
  proof: {
    eyebrow: "Proof and opportunity",
    title: ["On par with"],
    accent: "IP giants",
    after: "with $0 in marketing",
    body: "Tung Tung Tung Sahur sits third in Google Trends, between MrBeast and Peppa Pig. Meme IP now competes with the biggest franchises on earth, and nobody is running it like one.",
    stats: [
      { value: "$30M+", label: "Fortnite revenue in 48 hours" },
      { value: "#1", label: "Custom game in Roblox history" },
      { value: "25M+", label: "Concurrent players, a world record" },
    ],
  },
  problem: {
    eyebrow: "The problem",
    title: ["But the internet"],
    accent: "has a pattern",
    body: "A character goes viral, peaks, and decays. Pepe, Doge and Chill Guy pulled billions of views and their IP captured almost none of it.",
    paths: [
      { tone: "accent", label: "Path A", note: "An operator turns the peak into a franchise." },
      { tone: "cream", label: "Path B", note: "It fades, like every meme before it." },
    ],
  },
  vision: {
    eyebrow: "The vision",
    title: "The IP Factory",
    left: {
      heading: "What goes in",
      items: ["Team", "Distribution", "Network", "Retail relationships", "Data"],
      note: "Every muscle built running Tung is the muscle that launches the next character.",
    },
    right: {
      heading: "What comes out",
      items: [
        { title: "Proprietary IP", note: "Original franchises built from zero on the Pudgy playbook." },
        { title: "IP acquisition", note: "Culturally relevant IP with audiences that already exist." },
        { title: "Celebrity IP", note: "Character franchises built with talent." },
      ],
    },
  },
  team: {
    eyebrow: "Team",
    title: ["We've done this"],
    accent: "before",
  },
  contact: {
    title: ["Let's build the"],
    accent: "next franchise",
    body: "IP Studios turns viral internet characters into multi-billion dollar franchises.",
    cta: "Contact us",
  },
};

/** One short line per person for the team circles. Full bios stay in `team` and `advisors`. */
export const teamCircles = [
  { name: "Austin Lee", role: "CEO", line: "Former CMO, Pudgy Penguins", photo: "/deck/team-austin.png" },
  { name: "Blair Chapman III", role: "CSO", line: "Founder, The One Platform", photo: "/deck/team-blair.png" },
  { name: "Dan Rozenberg", role: "CBDO", line: "$100M+ in retail revenue", photo: "/deck/team-dan.png" },
  { name: "Matt Karol", role: "Advisor", line: "Founder, Akashic Studios", photo: "/deck/advisor-matt.png" },
  { name: "Eyal Baumel", role: "Advisor", line: "Founder, Flywheel. Ex-CEO, Yoola", photo: "/deck/advisor-eyal.png" },
  { name: "Phil McKenzie", role: "Advisor", line: "Co-founder and COO, Goldfinch", photo: "/deck/advisor-phil.png" },
];
