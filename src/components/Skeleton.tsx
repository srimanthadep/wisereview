import type { FC } from "react";

/**
 * Reusable skeleton primitive. Caller supplies size + a background color class
 * (e.g. "bg-white/[0.06]" on dark surfaces, "bg-slate-200/70" on light).
 */
export const Skeleton: FC<{ className?: string }> = ({ className = "" }) => {
  return <div className={`animate-pulse rounded-lg ${className}`} />;
};
