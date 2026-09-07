import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Inbox } from "lucide-react";
import { ProducerShell } from "@/components/ht/ProducerShell";
import { BookingStatusBadge, VerificationBadge } from "@/components/ht/badges";
import { EmptyState, RowSkeletonList, StatSkeletonRow } from "@/components/ht/states";
import { Button } from "@/components/ui/button";
import {
  TASTING_MODE_LABEL,
  fetchProducer,
  fetchProducerBookings,
  formatDate,
  formatTime,
} from "@/lib/data";
import { currentProducerId, useSession } from "@/lib/session";

export const Route = createFileRoute("/producer/dashboard")({
  head: () => ({
    meta: [
      { title: "Producer dashboard — Hearth & Table" },
      {
        name: "description",
        content:
          "Your tasting numbers at a glance: upcoming tastings, total bookings, conversion rate and verification status.",
      },
      { property: "og:title", content: "Producer dashboard — Hearth & Table" },
      { property: "og:description", content: "Run your cottage food tastings in one place." },
    ],
  }),
  component: ProducerDashboard,
});

function ProducerDashboard() {
  const { session } = useSession();
  const producerId = currentProducerId(session);

  const producerQuery = useQuery({
    queryKey: ["producer", producerId],
    queryFn: () => fetchProducer(producerId),
  });
  const bookingsQuery = useQuery({
    queryKey: ["producer-bookings", producerId],
    queryFn: () => fetchProducerBookings(producerId),
  });

  const bookings = bookingsQuery.data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings.filter(
    (b) => (b.tasting_slots?.date ?? "0000") >= today && b.status !== "completed",
  );
  const pending = bookings.filter((b) => b.status === "reserved");
  const converted = bookings.filter((b) => b.status === "completed").length;
  const conversion = bookings.length ? Math.round((converted / bookings.length) * 100) : 0;

  return (
    <ProducerShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">
            Welcome back{producerQuery.data ? `, ${producerQuery.data.business_name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's how your tastings are doing.</p>
        </div>
        {producerQuery.data && <VerificationBadge status={producerQuery.data.verification_status} />}
      </div>

      <div className="mt-6">
        {bookingsQuery.isPending ? (
          <StatSkeletonRow />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Upcoming tastings" value={upcoming.length} />
            <Stat label="Total bookings" value={bookings.length} />
            <Stat label="Tasting conversion" value={`${conversion}%`} />
            <Stat label="Pending requests" value={pending.length} />
          </div>
        )}
      </div>

      {pending.length > 0 && (
        <div className="ht-card mt-6 flex flex-wrap items-center gap-4 border-l-4 border-l-amber p-5">
          <AlertCircle className="size-5 text-amber" aria-hidden />
          <div className="flex-1">
            <p className="font-medium">
              {pending.length} tasting {pending.length === 1 ? "request" : "requests"} awaiting your
              confirmation
            </p>
            <p className="text-sm text-muted-foreground">
              Customers see "Reserved" until you accept.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link to="/producer/bookings">Review requests</Link>
          </Button>
        </div>
      )}

      <h2 className="mt-8 font-serif text-2xl font-semibold">Recent bookings</h2>
      <div className="mt-4">
        {bookingsQuery.isPending ? (
          <RowSkeletonList count={3} />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={<Inbox className="size-7" aria-hidden />}
            title="No bookings yet"
            description="Add tasting slots so customers can reserve a time."
            ctaLabel="Manage availability"
            ctaTo="/producer/availability"
          />
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 6).map((b) => (
              <div key={b.id} className="ht-card flex flex-wrap items-center gap-4 p-4">
                <img
                  src={b.tasting_slots?.products?.image_url ?? ""}
                  alt={b.tasting_slots?.products?.name ?? "Product"}
                  loading="lazy"
                  className="size-14 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{b.tasting_slots?.products?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {b.profiles?.full_name ?? "Customer"} ·{" "}
                    {b.tasting_slots
                      ? `${formatDate(b.tasting_slots.date)} ${formatTime(b.tasting_slots.start_time)}`
                      : ""}{" "}
                    · {TASTING_MODE_LABEL[b.tasting_mode]}
                  </p>
                </div>
                <BookingStatusBadge status={b.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </ProducerShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="ht-card p-5">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold">{value}</p>
    </div>
  );
}
