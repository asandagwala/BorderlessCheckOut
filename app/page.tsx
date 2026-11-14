import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { UhuruLogo } from "@/components/ui/uhuru-logo";

const featureCards = [
  {
    tag: "Borderless Checkout",
    title: "Accept payments",
    description:
      "Send a simple payment link priced in ZAR or USDC, then watch every completed payment verify on-chain and settle into one clear place.",
    image: "/uhuru/hands-harvest.png",
    alt: "Artisan hands holding fresh green shea fruit, roasted nuts, and rich golden shea butter",
    accentColor: "#1E6B45",
    badgeBg: "bg-[#EAF6F0] text-[#1E6B45] border-[#1E6B45]/20",
    borderAccent: "group-hover:border-[#1E6B45]",
    href: "/checkout/ord_live_checkout_01",
    ctaLabel: "Try live checkout",
  },
  {
    tag: "Real-Time Reconciliation",
    title: "Stay in control",
    description:
      "Keep customer orders, verified blockchain transfers, and your live merchant balance clear, accurate, and ready whenever you need them.",
    image: "/uhuru/baskets.png",
    alt: "Vibrant handwoven African baskets in rich terracotta, emerald green, gold, and magenta",
    accentColor: "#E59A18",
    badgeBg: "bg-[#FFF6E0] text-[#A86A06] border-[#E59A18]/30",
    borderAccent: "group-hover:border-[#E59A18]",
    href: "/dashboard",
    ctaLabel: "Explore dashboard",
  },
  {
    tag: "Protected Treasury",
    title: "Pay suppliers with confidence",
    description:
      "Review supplier invoices against your independent $500 spending limit and approved vendor list before a single cent of USDC moves.",
    image: "/uhuru/woman-bowl.png",
    alt: "Smiling African merchant carrying a carved calabash bowl of golden shea butter",
    accentColor: "#C84B24",
    badgeBg: "bg-[#FFF1EB] text-[#C84B24] border-[#C84B24]/25",
    borderAccent: "group-hover:border-[#C84B24]",
    href: "/dashboard",
    ctaLabel: "See supplier controls",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-[#181412] font-body-arial selection:bg-[#C84B24] selection:text-white">
      {/* Top vibrant textile-inspired accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#C84B24] via-[#E59A18] to-[#1E6B45]" />

      {/* Sticky Editorial Header */}
      <header className="sticky top-0 z-30 border-b border-[#EDE2D6] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-22 max-w-7xl items-center justify-between px-5 sm:px-8">
          <UhuruLogo href="/" size="md" theme="dark" showSlogan={true} />

          <nav className="hidden items-center gap-8 text-sm font-bold text-[#463C35] md:flex">
            <a
              href="#capabilities"
              className="transition-colors hover:text-[#C84B24]"
            >
              Capabilities
            </a>
            <a
              href="#protection"
              className="transition-colors hover:text-[#C84B24]"
            >
              Treasury Protection
            </a>
            <Link
              href="/checkout/ord_live_checkout_01"
              className="transition-colors hover:text-[#C84B24]"
            >
              Live Checkout
            </Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="hidden rounded-lg px-4 py-2.5 text-sm font-bold text-[#3A302A] transition hover:bg-[#FFF8EE] hover:text-[#C84B24] sm:inline-block"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-[#C84B24] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-[0_6px_20px_-4px_rgba(200,75,36,0.45)] transition hover:bg-[#A63816] hover:shadow-[0_10px_24px_-4px_rgba(200,75,36,0.55)]"
            >
              Dashboard <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Editorial Hero Section */}
        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[#E59A18]/40 bg-[#FFF8EE] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#C84B24]">
              <span className="h-2 w-2 rounded-full bg-[#E59A18]" />
              Made for African business
            </div>

            <h1 className="font-montserrat-extrabold text-5xl leading-[0.98] tracking-tight text-[#161210] sm:text-6xl lg:text-[68px]">
              Freedom to Pay.
              <br />
              <span className="bg-gradient-to-r from-[#C84B24] via-[#B83226] to-[#E59A18] bg-clip-text text-transparent">
                Freedom to Grow.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#4E443C]">
              UHURU gives your business one vibrant, trusted place to accept
              USDC payments, verify settlements on Base Sepolia, and automate
              supplier spending — with the confidence to keep moving forward.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3.5">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2.5 rounded-lg bg-[#C84B24] px-7 py-4 text-sm font-bold text-white shadow-[0_10px_26px_-6px_rgba(200,75,36,0.5)] transition hover:-translate-y-0.5 hover:bg-[#A63816]"
              >
                Open your dashboard
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-[#181412]/15 bg-white px-6 py-4 text-sm font-bold text-[#181412] transition hover:border-[#C84B24] hover:bg-[#FFF8EE] hover:text-[#C84B24]"
              >
                Create an account
              </Link>
              <Link
                href="/checkout/ord_live_checkout_01"
                className="inline-flex items-center gap-2 rounded-lg bg-[#FFF6E0] px-5 py-4 text-sm font-bold text-[#9A6004] transition hover:bg-[#FCE8B8]"
              >
                <Wallet className="size-4 text-[#E59A18]" />
                Try live customer checkout
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-[#EFE5DA] pt-7 text-sm font-bold text-[#3D342E]">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4.5 text-[#1E6B45]" />
                Simple payment links
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4.5 text-[#C84B24]" />
                On-chain verified records
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4.5 text-[#E59A18]" />
                $500 policy-guarded payouts
              </span>
            </div>
          </div>

          {/* Hero Photography Showcase */}
          <div className="relative">
            {/* Warm decorative offset frame */}
            <div
              className="absolute -inset-3 -z-10 rounded-2xl bg-gradient-to-br from-[#FFF3E0] via-[#FDE8D7] to-[#E8F5EE]"
              aria-hidden="true"
            />
            <div className="relative min-h-[480px] overflow-hidden rounded-2xl border border-[#E8DCD0] bg-stone-100 shadow-[0_24px_60px_-15px_rgba(24,20,18,0.18)] sm:min-h-[570px]">
              <Image
                src="/uhuru/hero.png"
                alt="Unrefined shea butter in a wooden bowl resting on rich red African earth"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#140F0D]/90 via-[#140F0D]/45 to-transparent p-7 sm:p-8 text-white">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#E59A18] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#181412]">
                  Built on trust & craft
                </div>
                <p className="mt-3 max-w-md font-slogan text-xl font-bold leading-snug text-white">
                  A payment experience rooted in the energy, colour, and
                  craftsmanship of African enterprise.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-bold text-white/85">
                  <span className="rounded-md bg-white/15 px-2.5 py-1 backdrop-blur-sm">
                    Base Sepolia USDC
                  </span>
                  <span className="rounded-md bg-white/15 px-2.5 py-1 backdrop-blur-sm">
                    ZAR &rarr; USDC Auto-Quote
                  </span>
                  <span className="rounded-md bg-white/15 px-2.5 py-1 backdrop-blur-sm">
                    Instant Reconciliation
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Three-Image Feature Storytelling Section */}
        <section
          id="capabilities"
          className="border-y border-[#ECE0D3] bg-[#FFF8EE] py-20"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C84B24]">
                  Everything in reach
                </p>
                <h2 className="mt-3 font-montserrat-extrabold text-3xl tracking-tight text-[#181412] sm:text-4xl">
                  Made for the rhythm of business.
                </h2>
              </div>
              <p className="max-w-md text-base leading-relaxed text-[#544940]">
                Less time chasing payment screenshots and bank delays. More time
                creating, trading, and growing what matters.
              </p>
            </div>

            <div className="grid gap-7 md:grid-cols-3">
              {featureCards.map((card) => (
                <article
                  key={card.title}
                  className={`group flex flex-col overflow-hidden rounded-2xl border border-[#E8DCD0] bg-white shadow-[0_12px_32px_-12px_rgba(24,20,18,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(200,75,36,0.18)] ${card.borderAccent}`}
                >
                  <div className="relative h-64 overflow-hidden bg-stone-100">
                    <Image
                      src={card.image}
                      alt={card.alt}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute top-4 left-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] backdrop-blur-md ${card.badgeBg}`}
                      >
                        {card.tag}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-7">
                    <div>
                      <h3 className="font-montserrat-extrabold text-2xl text-[#181412]">
                        {card.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-[#544940]">
                        {card.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#F2E8DC]">
                      <Link
                        href={card.href}
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#C84B24] transition group-hover:translate-x-1"
                      >
                        {card.ctaLabel}
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Protection & Textile Storytelling Section */}
        <section
          id="protection"
          className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center"
        >
          <div>
            <div className="inline-flex h-13 w-13 items-center justify-center rounded-2xl bg-[#FFF1EB] text-[#C84B24] shadow-sm">
              <ShieldCheck className="size-7" />
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#8B1E24]">
              Independent Policy Governance
            </p>
            <h2 className="mt-2 font-montserrat-extrabold text-3xl tracking-tight text-[#181412] sm:text-4xl">
              Your business, clearly protected.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#544940]">
              Every customer payment is verified directly against Base Sepolia
              blockchain receipts before an order is marked paid. Every supplier
              payout proposal is checked by an independent policy engine before
              funds can leave your treasury.
            </p>

            <div className="mt-7 space-y-3.5">
              <div className="flex items-start gap-3.5 rounded-xl border border-[#E8DCD0] bg-[#FFF8EE]/70 p-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1E6B45] text-xs font-bold text-white">
                  1
                </span>
                <div>
                  <p className="font-slogan text-sm font-bold text-[#181412]">
                    Approved Supplier Invoices (&le; $500 USDC)
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#5B5047]">
                    Verified against your whitelist and settled automatically on
                    Base Sepolia with an immutable transaction hash.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-xl border border-[#E8DCD0] bg-[#FFF8EE]/70 p-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8B1E24] text-xs font-bold text-white">
                  2
                </span>
                <div>
                  <p className="font-slogan text-sm font-bold text-[#181412]">
                    Over-Limit Invoices (&gt; $500 USDC) Blocked Automatically
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#5B5047]">
                    Proposals exceeding your $500.00 threshold are intercepted
                    and held for merchant review — never executed silently.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-[#8B1E24] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#6E151A]"
              >
                <Sparkles className="size-4 text-[#E59A18]" />
                Test Treasury Protection
              </Link>
            </div>
          </div>

          <div className="relative h-88 overflow-hidden rounded-2xl border border-[#E8DCD0] shadow-[0_20px_50px_-15px_rgba(24,20,18,0.16)] sm:h-[430px]">
            <Image
              src="/uhuru/textiles.png"
              alt="Folded African heritage textiles in crimson, ochre gold, and emerald green"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#181412]/70 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4 rounded-xl border border-white/20 bg-[#181412]/75 p-5 text-white backdrop-blur-md">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#E59A18]">
                  Woven into every transaction
                </p>
                <p className="mt-1 font-slogan text-base font-bold">
                  Real Base Sepolia USDC verification &bull; Zero mock balances
                </p>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#E59A18] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#181412] transition hover:bg-[#F2A922]"
              >
                Open Dashboard <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Vibrant Textile Footer */}
      <footer className="relative overflow-hidden bg-[#14100E] py-14 text-white">
        <Image
          src="/uhuru/footer-textile.png"
          alt="Woven kente textile pattern in gold, green, and crimson"
          fill
          className="object-cover opacity-40"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#14100E]/90 via-[#14100E]/75 to-[#14100E]/90" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 sm:flex-row sm:items-center sm:px-8">
          <UhuruLogo href="/" theme="light" size="md" showSlogan={true} />

          <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-white/85">
            <Link
              href="/dashboard"
              className="transition hover:text-[#E59A18]"
            >
              Merchant Dashboard
            </Link>
            <Link
              href="/checkout/ord_live_checkout_01"
              className="transition hover:text-[#E59A18]"
            >
              Customer Checkout
            </Link>
            <Link href="/login" className="transition hover:text-[#E59A18]">
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#C84B24] px-4 py-2 text-xs uppercase tracking-wider text-white transition hover:bg-[#A63816]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
