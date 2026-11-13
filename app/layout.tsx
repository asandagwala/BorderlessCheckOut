import type { Metadata } from "next";
import { Montserrat, Play } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

const play = Play({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-play",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Borderless Checkout | African SME Stablecoin Payments",
  description:
    "Accept USDC at checkout, verify on Base Sepolia, and automate treasury supplier settlements via AI agents governed by independent policy engines.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${play.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-play bg-[#fff3e2] text-zinc-900 selection:bg-[#700c20] selection:text-white">
        {children}
      </body>
    </html>
  );
}
