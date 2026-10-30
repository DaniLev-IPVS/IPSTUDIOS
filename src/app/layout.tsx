import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import "./globals.css";

const instrument = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
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
    <html lang="en" className={`${instrument.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
