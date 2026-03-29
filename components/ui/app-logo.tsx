import type { CSSProperties } from "react";

type AppLogoProps = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  textClassName?: string;
};

export function AppLogo({
  size = 40,
  showWordmark = false,
  className,
  textClassName,
}: AppLogoProps) {
  const iconStyle: CSSProperties = {
    width: size,
    height: size,
  };

  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      <span
        aria-hidden="true"
        style={{
          ...iconStyle,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: Math.max(14, Math.round(size * 0.34)),
          background:
            "radial-gradient(circle at 28% 24%, rgba(255,255,255,0.32), transparent 34%), linear-gradient(145deg, #0f2f76 0%, #0049db 45%, #006631 100%)",
          boxShadow: "0 14px 30px rgba(0,73,219,0.22)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg
          viewBox="0 0 64 64"
          style={{ width: "72%", height: "72%" }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 42L21 23L32 37L43 17L54 42"
            stroke="rgba(255,255,255,0.96)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="43" cy="17" r="5" fill="#62FF96" />
          <path
            d="M43 17L49 11"
            stroke="#62FF96"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M45 11H53V19"
            stroke="#62FF96"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {showWordmark ? (
        <span className={textClassName} style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1 }}>
          <span
            className="font-display font-extrabold"
            style={{ color: "var(--on-surface)", fontSize: Math.max(20, Math.round(size * 0.46)) }}
          >
            WOYOhub
          </span>
          <span
            style={{
              color: "var(--outline)",
              fontSize: Math.max(10, Math.round(size * 0.2)),
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginTop: 4,
            }}
          >
            Intellectual Ascent
          </span>
        </span>
      ) : null}
    </span>
  );
}
