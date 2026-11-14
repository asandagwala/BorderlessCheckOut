import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UHURU | Freedom to Pay. Freedom to Grow.",
  description:
    "Accept USDC payments, verify on-chain settlements, and automate supplier payouts with African warmth, speed, and independent policy governance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-white text-[#181412] selection:bg-[#C84B24] selection:text-white">
        {children}
      </body>
    </html>
  );
}
