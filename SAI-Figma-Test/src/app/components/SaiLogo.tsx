import React from "react";

export interface SaiLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  subtitle?: string;
  variant?: "dark" | "light";
  onClick?: () => void;
}

/**
 * SAI – Smart AI Property Finder Brand Logo
 * Features the signature AI Neural Crest + Smart Architecture Pin in brand teal gradients.
 */
export const SaiLogoIcon: React.FC<{ sizePx?: number; className?: string }> = ({
  sizePx = 36,
  className = "",
}) => {
  return (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 transition-transform duration-300 ${className}`}
      style={{ minWidth: sizePx, minHeight: sizePx }}
    >
      <defs>
        {/* Main Brand Gradient */}
        <linearGradient id="saiBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00A8A3" />
          <stop offset="50%" stopColor="#008F8C" />
          <stop offset="100%" stopColor="#004F4D" />
        </linearGradient>

        {/* Neural Glow Gradient */}
        <linearGradient id="saiNeuralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>

        {/* Roof Gradient */}
        <linearGradient id="saiRoofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E6F4F2" />
        </linearGradient>

        <filter id="saiShadow" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#004F4D" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Background Crest */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="13"
        fill="url(#saiBgGrad)"
        filter="url(#saiShadow)"
      />

      {/* Subtle Inner Highlight Border */}
      <rect
        x="2.75"
        y="2.75"
        width="42.5"
        height="42.5"
        rx="12.25"
        stroke="rgba(255, 255, 255, 0.25)"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Smart Home Apex / Roof */}
      <path
        d="M24 10.5L12 21.5H16.5V34.5C16.5 35.6 17.4 36.5 18.5 36.5H29.5C30.6 36.5 31.5 35.6 31.5 34.5V21.5H36L24 10.5Z"
        fill="url(#saiRoofGrad)"
        opacity="0.96"
      />

      {/* Smart AI Neural Hub & Door Keyway */}
      <path
        d="M21 27.5C21 25.84 22.34 24.5 24 24.5C25.66 24.5 27 25.84 27 27.5C27 28.8 26.18 29.9 25 30.3V34.5C25 35.05 24.55 35.5 24 35.5C23.45 35.5 23 35.05 23 34.5V30.3C21.82 29.9 21 28.8 21 27.5Z"
        fill="#006D6A"
      />

      {/* AI Intelligence Nodes (Constellation atop roof) */}
      <circle cx="24" cy="16.5" r="2.2" fill="url(#saiNeuralGrad)" />
      <circle cx="17.5" cy="22" r="1.5" fill="url(#saiNeuralGrad)" />
      <circle cx="30.5" cy="22" r="1.5" fill="url(#saiNeuralGrad)" />

      {/* Neural Link Connectors */}
      <line x1="24" y1="16.5" x2="17.5" y2="22" stroke="url(#saiNeuralGrad)" strokeWidth="1.2" strokeDasharray="1.5 1" opacity="0.85" />
      <line x1="24" y1="16.5" x2="30.5" y2="22" stroke="url(#saiNeuralGrad)" strokeWidth="1.2" strokeDasharray="1.5 1" opacity="0.85" />
      <line x1="24" y1="18.7" x2="24" y2="24.5" stroke="#008F8C" strokeWidth="1.2" opacity="0.8" />
    </svg>
  );
};

export const SaiLogo: React.FC<SaiLogoProps> = ({
  size = "md",
  className = "",
  showText = true,
  subtitle = "Smart AI Finder",
  variant = "dark",
  onClick,
}) => {
  const sizeMap = {
    xs: { px: 26, text: "text-base", sub: "text-[8px]" },
    sm: { px: 32, text: "text-lg", sub: "text-[9px]" },
    md: { px: 38, text: "text-xl", sub: "text-[10px]" },
    lg: { px: 48, text: "text-2xl", sub: "text-xs" },
    xl: { px: 60, text: "text-3xl", sub: "text-sm" },
  };

  const { px, text, sub } = sizeMap[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? "cursor-pointer group" : ""} ${className}`}
    >
      <div className="relative transform transition-transform group-hover:scale-105 duration-200">
        <SaiLogoIcon sizePx={px} />
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span
            className={`notranslate font-black tracking-tight leading-none ${
              variant === "light" ? "text-white" : "text-slate-800"
            } ${text}`}
          >
            SAI
          </span>
          {subtitle && (
            <p
              className={`font-bold tracking-wide mt-1 uppercase ${
                variant === "light" ? "text-[#67E8F9]" : "text-[#006D6A]"
              } ${sub}`}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SaiLogo;
