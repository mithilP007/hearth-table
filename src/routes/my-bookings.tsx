import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { CalendarHeart } from "lucide-react";
import { CustomerShell } from "@/components/ht/CustomerShell";
import { BookingStatusBadge, StatusTimeline } from "@/components/ht/badges";
import { EmptyState, RowSkeletonList } from "@/components/ht/states";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TASTING_MODE_LABEL,
  db,
  fetchCustomerBookings,
  formatDate,
  formatTime,
  money,
  type Booking,
} from "@/lib/data";
import { currentCustomerId, useSession } from "@/lib/session";

export const Route = createFileRoute("/my-bookings")({
  head: () => ({
    meta: [
      { title: "My tastings — Hearth & Table" },
      {
        name: "description",
        content:
          "Upcoming and past cottage food tastings with QR passes, live status and one-tap conversion to a full order.",
      },
      { property: "og:title", content: "My tastings — Hearth & Table" },
      { property: "og:description", content: "Track every tasting you've booked." },
    ],
  }),
  component: MyBookings,
});

function MyBookings() {
  const { session } = useSession();
  const customerId = currentCustomerId(session);
  const queryClient = useQueryClient();
  const [checkout, setCheckout] = useState<Booking | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["bookings", customerId],
    queryFn: () => fetchCustomerBookings(customerId),
  });

  const { upcoming, past } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const list = data ?? [];
    return {
      upcoming: list.filter(
        (b) => b.status !== "completed" && (b.tasting_slots?.date ?? "9999") >= today,
      ),
      past: list.filter(
        (b) => b.status === "completed" || (b.tasting_slots?.date ?? "0000") < today,
      ),
    };
  }, [data]);

  const placeOrder = useMutation({
    mutationFn: async (booking: Booking) => {
      const { error } = await db.from("bookings").update({ status: "completed" }).eq("id", booking.id);
      if (error) throw error;
    },
    onSuccess: (_, booking) => {
      queryClient.setQueryData<Booking[]>(["bookings", customerId], (old) =>
        old ? old.map((b) => (b.id === booking.id ? { ...b, status: "completed" as BookingStatus } : b)) : []
      );
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.refetchQueries({ queryKey: ["bookings", customerId] });
      setCheckout(null);
      toast.success("Full order placed — tasting marked complete.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not place the order."),
  });

  return (
    <CustomerShell>
      <h1 className="font-serif text-3xl font-semibold">My tastings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Passes, status updates and full orders.</p>

      <Tabs defaultValue="upcoming" className="mt-6">
        <TabsList className="bg-cream-deep">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {isPending ? (
            <RowSkeletonList />
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarHeart className="size-7" aria-hidden />}
              title="No tastings booked yet"
              description="No tastings booked yet — discover producers near you."
              ctaLabel="Discover producers"
              ctaTo="/discover"
            />
          ) : (
            upcoming.map((b) => (
              <BookingCard key={b.id} booking={b} onConvert={() => setCheckout(b)} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-3">
          {isPending ? (
            <RowSkeletonList count={2} />
          ) : past.length === 0 ? (
            <EmptyState
              icon={<CalendarHeart className="size-7" aria-hidden />}
              title="Nothing in your history yet"
              description="Completed tastings will collect here."
              ctaLabel="Discover producers"
              ctaTo="/discover"
            />
          ) : (
            past.map((b) => <BookingCard key={b.id} booking={b} />)
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!checkout} onOpenChange={(open) => !open && setCheckout(null)}>
        <DialogContent className="bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Order full size</DialogTitle>
          </DialogHeader>
          {checkout && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {checkout.tasting_slots?.products?.name} ·{" "}
                {checkout.tasting_slots?.products?.producers?.business_name}
              </p>
              <div className="ht-card divide-y divide-border text-sm">
                <Row
                  label="Full order"
                  value={money(checkout.tasting_slots?.products?.full_order_price)}
                />
                <Row
                  label="Tasting fee credit"
                  value={`− ${money(checkout.tasting_slots?.products?.price)}`}
                />
                <Row
                  label="Total"
                  strong
                  value={money(
                    Number(checkout.tasting_slots?.products?.full_order_price ?? 0) -
                      Number(checkout.tasting_slots?.products?.price ?? 0),
                  )}
                />
              </div>
              <Button
                className="w-full rounded-full"
                disabled={placeOrder.isPending}
                onClick={() => placeOrder.mutate(checkout)}
              >
                Place Order
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Mock checkout — no payment is taken in this demo.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </CustomerShell>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}

function BookingCard({ booking, onConvert }: { booking: Booking; onConvert?: () => void }) {
  const slot = booking.tasting_slots;
  const product = slot?.products;
  const canConvert =
    onConvert && (booking.status === "confirmed" || booking.status === "ready");

  return (
    <div className="ht-card p-4">
      <div className="flex gap-4">
        <img
          src={product?.image_url ?? ""}
          alt={product?.name ?? "Tasting"}
          loading="lazy"
          className="size-20 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <Link
                to="/booking/confirm/$id"
                params={{ id: booking.id }}
                className="font-serif text-lg font-semibold hover:underline"
              >
                {product?.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {product?.producers?.business_name}
              </p>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {slot ? `${formatDate(slot.date)} · ${formatTime(slot.start_time)}` : "—"} ·{" "}
            {TASTING_MODE_LABEL[booking.tasting_mode]}
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{booking.booking_ref}</p>
        </div>
        <div className="hidden shrink-0 rounded-lg border border-border bg-card p-1.5 sm:block">
          <QRCodeSVG value={booking.qr_token ?? booking.booking_ref} size={56} fgColor="#2C2C2C" />
        </div>
      </div>

      <div className="mt-4">
        <StatusTimeline status={booking.status} />
      </div>

      {canConvert && (
        <Button className="mt-4 w-full rounded-full sm:w-auto" onClick={onConvert}>
          Convert to Full Order
        </Button>
      )}
    </div>
  );
}
