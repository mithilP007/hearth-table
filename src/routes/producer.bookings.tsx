import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Check, Inbox, QrCode, X, Loader2 } from "lucide-react";
import { ProducerShell } from "@/components/ht/ProducerShell";
import { BookingStatusBadge, StatusTimeline } from "@/components/ht/badges";
import { EmptyState, RowSkeletonList } from "@/components/ht/states";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TASTING_MODE_LABEL,
  db,
  fetchProducerBookings,
  formatDate,
  formatTime,
  type Booking,
  type BookingStatus,
} from "@/lib/data";
import { currentProducerId, useSession } from "@/lib/session";

export const Route = createFileRoute("/producer/bookings")({
  head: () => ({
    meta: [
      { title: "Tasting bookings — Hearth & Table" },
      {
        name: "description",
        content: "Review incoming tasting requests, view upcoming confirmed tastings, and scan guest passes.",
      },
      { property: "og:title", content: "Tasting bookings — Hearth & Table" },
      { property: "og:description", content: "Manage customer tasting requests and confirmations." },
    ],
  }),
  component: ProducerBookings,
});

type FilterTab = "all" | BookingStatus;

function ProducerBookings() {
  const { session } = useSession();
  const producerId = currentProducerId(session);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [scannerSimulating, setScannerSimulating] = useState(false);

  const bookingsQuery = useQuery({
    queryKey: ["producer-bookings", producerId],
    queryFn: () => fetchProducerBookings(producerId),
  });

  const bookings = bookingsQuery.data ?? [];

  const incomingRequests = useMemo(
    () => bookings.filter((b) => b.status === "reserved"),
    [bookings],
  );

  const upcomingConfirmed = useMemo(
    () => bookings.filter((b) => b.status === "confirmed" || b.status === "ready"),
    [bookings],
  );

  const filteredBookings = useMemo(() => {
    if (filter === "all") return bookings;
    return bookings.filter((b) => b.status === filter);
  }, [bookings, filter]);

  const acceptBooking = useMutation({
    mutationFn: async (booking: Booking) => {
      const { error } = await db
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", booking.id);
      if (error) throw error;
    },
    onSuccess: (_, booking) => {
      queryClient.invalidateQueries({ queryKey: ["producer-bookings", producerId] });
      toast.success(`Request ${booking.booking_ref} accepted and confirmed!`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not accept booking."),
  });

  const declineBooking = useMutation({
    mutationFn: async (booking: Booking) => {
      const slot = booking.tasting_slots;
      const { error: delErr } = await db.from("bookings").delete().eq("id", booking.id);
      if (delErr) throw delErr;

      if (slot) {
        const newCount = Math.max(0, slot.booked_count - 1);
        await db.from("tasting_slots").update({ booked_count: newCount }).eq("id", slot.id);
      }
    },
    onSuccess: (_, booking) => {
      queryClient.invalidateQueries({ queryKey: ["producer-bookings", producerId] });
      queryClient.invalidateQueries({ queryKey: ["producer-slots", producerId] });
      toast.success(`Request ${booking.booking_ref} declined and slot freed.`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not decline booking."),
  });

  const advanceStatus = useMutation({
    mutationFn: async ({ bookingId, nextStatus }: { bookingId: string; nextStatus: BookingStatus }) => {
      const { error } = await db.from("bookings").update({ status: nextStatus }).eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-bookings", producerId] });
      toast.success("Booking status updated.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update status."),
  });

  function handleSimulateScan() {
    setScannerSimulating(true);
    setTimeout(() => {
      setScannerSimulating(false);
      if (upcomingConfirmed.length > 0) {
        const target = upcomingConfirmed[0];
        toast.success(`Scanned pass ${target.booking_ref} for ${target.profiles?.full_name ?? "Guest"}!`);
      } else {
        toast.info("Scanner ready — no confirmed bookings waiting for check-in.");
      }
    }, 1200);
  }

  return (
    <ProducerShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Tasting bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review incoming requests, check in guests, and track past tastings.
          </p>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList className="bg-cream-deep">
            <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
            <TabsTrigger value="reserved">Reserved ({incomingRequests.length})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="ready">Ready</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filter === "all" || filter === "reserved" ? (
        <section className="mt-6">
          <h2 className="font-serif text-xl font-semibold flex items-center gap-2">
            Incoming Requests
            {incomingRequests.length > 0 && (
              <span className="rounded-full bg-amber-soft px-2.5 py-0.5 text-xs font-semibold text-amber">
                {incomingRequests.length} pending
              </span>
            )}
          </h2>
          <div className="mt-3">
            {bookingsQuery.isPending ? (
              <RowSkeletonList count={2} />
            ) : incomingRequests.length === 0 ? (
              <EmptyState
                icon={<Inbox className="size-7" aria-hidden />}
                title="No incoming requests"
                description="When customers reserve a tasting time, their requests will show up here for your approval."
              />
            ) : (
              <div className="space-y-3">
                {incomingRequests.map((b) => (
                  <div key={b.id} className="ht-card p-4 border-l-4 border-l-amber">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <img
                          src={b.tasting_slots?.products?.image_url ?? ""}
                          alt={b.tasting_slots?.products?.name ?? "Product"}
                          className="size-16 rounded-lg object-cover bg-cream-deep"
                        />
                        <div>
                          <p className="font-serif text-base font-semibold">
                            {b.tasting_slots?.products?.name}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            Customer: {b.profiles?.full_name ?? "Guest"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {b.tasting_slots
                              ? `${formatDate(b.tasting_slots.date)} at ${formatTime(b.tasting_slots.start_time)}`
                              : "—"}{" "}
                            · {TASTING_MODE_LABEL[b.tasting_mode]}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground mt-1">{b.booking_ref}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {b.status === "reserved" ? (
                          <>
                            <Button
                              className="rounded-full bg-terracotta hover:bg-terracotta/90 text-primary-foreground"
                              disabled={b.status !== "reserved" || acceptBooking.isPending || declineBooking.isPending}
                              onClick={() => acceptBooking.mutate(b)}
                            >
                              <Check className="mr-1.5 size-4" /> Accept &amp; Confirm
                            </Button>
                            <Button
                              variant="outline"
                              className="rounded-full text-destructive border-border"
                              disabled={b.status !== "reserved" || acceptBooking.isPending || declineBooking.isPending}
                              onClick={() => declineBooking.mutate(b)}
                            >
                              <X className="mr-1.5 size-4" /> Decline
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground capitalize">
                            Status: {b.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {filter === "all" || filter === "confirmed" || filter === "ready" ? (
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-xl font-semibold">Upcoming Confirmed &amp; Ready</h2>
          </div>

          <div className="mt-3 grid gap-4 lg:grid-cols-3">
            {/* Check-in scanner placeholder box */}
            <div className="ht-card flex flex-col items-center justify-center p-6 border-dashed border-2 border-border text-center bg-cream/50 lg:col-span-1">
              <div className="flex size-12 items-center justify-center rounded-full bg-terracotta-soft text-terracotta mb-3">
                <QrCode className="size-6" aria-hidden />
              </div>
              <h3 className="font-serif text-base font-semibold">Check-in scanner (demo)</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                Scan customer QR pass upon arrival at market pickup or kitchen collection to complete tasting.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-full"
                disabled={scannerSimulating}
                onClick={handleSimulateScan}
              >
                {scannerSimulating && <Loader2 className="mr-2 size-3.5 animate-spin" />}
                {scannerSimulating ? "Scanning..." : "Simulate QR Scan"}
              </Button>
            </div>

            {/* Confirmed list */}
            <div className="space-y-3 lg:col-span-2">
              {bookingsQuery.isPending ? (
                <RowSkeletonList count={2} />
              ) : upcomingConfirmed.length === 0 ? (
                <EmptyState
                  icon={<Inbox className="size-7" aria-hidden />}
                  title="No upcoming tastings"
                  description="Confirmed tastings will appear here with QR passes and status controls."
                />
              ) : (
                upcomingConfirmed.map((b) => (
                  <div key={b.id} className="ht-card p-4">
                    <div className="flex gap-4">
                      <img
                        src={b.tasting_slots?.products?.image_url ?? ""}
                        alt={b.tasting_slots?.products?.name ?? "Product"}
                        className="size-16 shrink-0 rounded-lg object-cover bg-cream-deep"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-serif text-base font-semibold">
                              {b.tasting_slots?.products?.name}
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              Guest: {b.profiles?.full_name ?? "Customer"}
                            </p>
                          </div>
                          <BookingStatusBadge status={b.status} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {b.tasting_slots
                            ? `${formatDate(b.tasting_slots.date)} · ${formatTime(b.tasting_slots.start_time)}`
                            : "—"}{" "}
                          · {TASTING_MODE_LABEL[b.tasting_mode]}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground mt-0.5">{b.booking_ref}</p>
                      </div>
                      <div className="hidden shrink-0 rounded-lg border border-border bg-card p-1 sm:block">
                        <QRCodeSVG value={b.qr_token ?? b.booking_ref} size={48} fgColor="#2C2C2C" />
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
                      <div className="flex-1 max-w-sm">
                        <StatusTimeline status={b.status} />
                      </div>
                      <div className="flex gap-2">
                        {b.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full text-xs"
                            onClick={() => advanceStatus.mutate({ bookingId: b.id, nextStatus: "ready" })}
                          >
                            Mark Ready
                          </Button>
                        )}
                        {b.status === "ready" && (
                          <Button
                            size="sm"
                            className="rounded-full text-xs bg-sage text-primary-foreground hover:bg-sage/90"
                            onClick={() => advanceStatus.mutate({ bookingId: b.id, nextStatus: "completed" })}
                          >
                            Mark Completed
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      ) : null}

      {filter !== "all" && filter !== "reserved" && filter !== "confirmed" && filter !== "ready" ? (
        <section className="mt-6">
          <h2 className="font-serif text-xl font-semibold capitalize">{filter} Tastings</h2>
          <div className="mt-3 space-y-3">
            {filteredBookings.length === 0 ? (
              <EmptyState
                icon={<Inbox className="size-7" aria-hidden />}
                title={`No ${filter} bookings`}
                description={`Bookings with status '${filter}' will appear here.`}
              />
            ) : (
              filteredBookings.map((b) => (
                <div key={b.id} className="ht-card flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={b.tasting_slots?.products?.image_url ?? ""}
                      alt={b.tasting_slots?.products?.name ?? "Product"}
                      className="size-14 rounded-lg object-cover bg-cream-deep"
                    />
                    <div>
                      <p className="font-serif text-base font-semibold">
                        {b.tasting_slots?.products?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {b.profiles?.full_name ?? "Guest"} · {b.booking_ref}
                      </p>
                    </div>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}
    </ProducerShell>
  );
}
