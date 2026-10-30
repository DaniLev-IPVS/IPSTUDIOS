import type { Metadata } from "next";
import { Archivo, DM_Serif_Display } from "next/font/google";
import "./globals.css";

// Branding Mark I type pairing: DM Serif Display (display) + Archivo (text).
const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IP Studios — Monetizing IP and Scaling Internet Trends",
  description:
    "IP Studios turns viral internet characters into multi-billion dollar franchises. Home of Tung Tung Tung Sahur and the Italian Brainrot universe.",
  openGraph: {
    title: "IP Studios",
    description: "Monetizing IP and scaling internet trends.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSerif.variable} ${archivo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
