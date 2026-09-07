import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaTo,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaTo?: string;
  action?: ReactNode;
}) {
  return (
    <div className="ht-card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-cream text-terracotta">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {ctaLabel && ctaTo && (
        <Link
          to={ctaTo}
          className="mt-1 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {ctaLabel}
        </Link>
      )}
      {action}
    </div>
  );
}

export function CardSkeletonGrid({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ht-card overflow-hidden">
          <Skeleton className="h-40 w-full rounded-none bg-cream-deep" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-2/3 bg-cream-deep" />
            <Skeleton className="h-3 w-1/2 bg-cream-deep" />
            <Skeleton className="h-3 w-1/3 bg-cream-deep" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RowSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ht-card flex items-center gap-4 p-4">
          <Skeleton className="size-16 shrink-0 rounded-lg bg-cream-deep" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 bg-cream-deep" />
            <Skeleton className="h-3 w-1/4 bg-cream-deep" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full bg-cream-deep" />
        </div>
      ))}
    </div>
  );
}

export function StatSkeletonRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ht-card space-y-2 p-5">
          <Skeleton className="h-3 w-20 bg-cream-deep" />
          <Skeleton className="h-7 w-14 bg-cream-deep" />
        </div>
      ))}
    </div>
  );
}
