import { BadgeCheck, Clock, AlertTriangle, Check } from "lucide-react";
import type { BookingStatus, VerificationStatus } from "@/lib/data";
import { STATUS_STEPS } from "@/lib/data";
import { cn } from "@/lib/utils";

export function VerifiedBadge({
  size = "sm",
  label = "Verified",
}: {
  size?: "sm" | "lg";
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-sage-soft font-medium text-sage",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
      )}
    >
      <BadgeCheck className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />
      {label}
    </span>
  );
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status === "verified") return <VerifiedBadge />;
  if (status === "needs_attention")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
        <AlertTriangle className="size-3.5" aria-hidden /> Needs attention
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-soft px-2.5 py-1 text-xs font-medium text-amber">
      <Clock className="size-3.5" aria-hidden /> Pending
    </span>
  );
}

const BOOKING_LABEL: Record<BookingStatus, string> = {
  reserved: "Reserved — awaiting producer confirmation",
  confirmed: "Confirmed",
  ready: "Ready for pickup",
  completed: "Completed",
};

export function BookingStatusBadge({
  status,
  full = false,
}: {
  status: BookingStatus;
  full?: boolean;
}) {
  const tone =
    status === "reserved"
      ? "bg-amber-soft text-amber"
      : status === "completed"
        ? "bg-muted text-muted-foreground"
        : "bg-sage-soft text-sage";
  const text = full ? BOOKING_LABEL[status] : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", tone)}>
      {text}
    </span>
  );
}

export function StatusTimeline({ status }: { status: BookingStatus }) {
  const activeIndex = STATUS_STEPS.indexOf(status);
  return (
    <ol className="flex items-center gap-1.5">
      {STATUS_STEPS.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <li key={step} className="flex flex-1 items-center gap-1.5">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border text-[10px] font-semibold",
                  done && "border-sage bg-sage text-primary-foreground",
                  active && "border-terracotta bg-terracotta text-primary-foreground",
                  !done && !active && "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3" aria-hidden /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-[10px] capitalize",
                  active ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {step}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <span
                className={cn("mb-4 h-px flex-1", i < activeIndex ? "bg-sage" : "bg-border")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function DietaryTags({ tags }: { tags: string[] }) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className="rounded-full border border-border bg-cream px-2 py-0.5 text-[11px] text-muted-foreground"
        >
          {t}
        </span>
      ))}
    </div>
  );
}
