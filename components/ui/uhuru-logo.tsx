import React from "react";
import Link from "next/link";

interface UhuruLogoProps {
  href?: string;
  theme?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  showSlogan?: boolean;
  className?: string;
}

/**
 * UHURU Brand Logo Component
 * - Standalone "U" on the left (Arain Bold)
 * - "UHURU" wordmark next to it (Arain Bold)
 * - Slogan "Freedom to Pay. Freedom to Grow." directly underneath the wordmark (Montserrat)
 */
export function UhuruLogo({
  href,
  theme = "dark",
  size = "md",
  showSlogan = true,
  className = "",
}: UhuruLogoProps) {
  const isLight = theme === "light";

  const sizeStyles = {
    sm: {
      markBox: "h-9 w-9 rounded-[8px] text-[22px]",
      wordmark: "text-[20px] tracking-[0.06em]",
      slogan: "text-[8.5px] tracking-[0.14em]",
      gap: "gap-2.5",
    },
    md: {
      markBox: "h-11 w-11 rounded-[10px] text-[27px]",
      wordmark: "text-[24px] tracking-[0.06em]",
      slogan: "text-[9.5px] tracking-[0.15em]",
      gap: "gap-3",
    },
    lg: {
      markBox: "h-13 w-13 rounded-[12px] text-[32px]",
      wordmark: "text-[30px] tracking-[0.07em]",
      slogan: "text-[10.5px] tracking-[0.16em]",
      gap: "gap-3.5",
    },
  }[size];

  const content = (
    <div className={`inline-flex items-center ${sizeStyles.gap} select-none group ${className}`}>
      {/* Standalone U on the left in Arain Bold */}
      <div
        className={`relative flex shrink-0 items-center justify-center font-arain leading-none transition-transform duration-200 group-hover:scale-[1.03] ${sizeStyles.markBox} ${
          isLight
            ? "bg-gradient-to-br from-[#E59A18] via-[#C84B24] to-[#8B1E24] text-white shadow-[0_6px_18px_rgba(200,75,36,0.35)] ring-1 ring-white/25"
            : "bg-gradient-to-br from-[#C84B24] to-[#8B1E24] text-white shadow-[0_6px_18px_rgba(200,75,36,0.28)]"
        }`}
        aria-hidden="true"
      >
        <span className="translate-y-[0.5px]">U</span>
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#E59A18] ring-2 ring-white" />
      </div>

      {/* Right column: UHURU wordmark (Arain Bold) + Slogan directly underneath (Montserrat) */}
      <div className="flex flex-col justify-center">
        <span
          className={`font-arain leading-[1.02] uppercase ${sizeStyles.wordmark} ${
            isLight ? "text-white" : "text-[#181412]"
          }`}
        >
          UHURU
        </span>
        {showSlogan && (
          <span
            className={`mt-1 font-slogan font-semibold uppercase leading-tight ${sizeStyles.slogan} ${
              isLight ? "text-[#F7D794]" : "text-[#C84B24]"
            }`}
          >
            Freedom to Pay. Freedom to Grow.
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
