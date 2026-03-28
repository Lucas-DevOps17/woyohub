"use client";

export function GradBar({
  pct,
  h = 8,
  variant = "tertiary",
}: {
  pct: number;
  h?: number;
  variant?: "tertiary" | "primary" | "custom";
}) {
  const bg =
    variant === "tertiary"
      ? "linear-gradient(90deg, var(--tertiary), var(--tertiary-fixed))"
      : "linear-gradient(90deg, var(--primary), var(--primary-container))";

  return (
    <div
      style={{ height: h, borderRadius: h }}
      className="w-full bg-surface-dim dark:bg-[#334]"
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: h,
          background: bg,
          transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </div>
  );
}
