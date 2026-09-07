import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Home, Loader2, ShoppingBag, Truck } from "lucide-react";
import { CustomerShell } from "@/components/ht/CustomerShell";
import { EmptyState, RowSkeletonList } from "@/components/ht/states";
import { Button } from "@/components/ui/button";
import {
  TASTING_MODE_LABEL,
  db,
  fetchProduct,
  fetchProductSlots,
  formatDate,
  formatTime,
  makeBookingRef,
  makeQrToken,
  money,
  type Slot,
  type TastingMode,
} from "@/lib/data";
import { currentCustomerId, useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/booking/$productId")({
  head: () => ({
    meta: [
      { title: "Book a tasting — Hearth & Table" },
      {
        name: "description",
        content:
          "Pick your tasting mode, choose a date and time from the producer's open slots, and confirm your booking.",
      },
      { property: "og:title", content: "Book a tasting — Hearth & Table" },
      { property: "og:description", content: "Three steps to a confirmed cottage food tasting." },
    ],
  }),
  component: BookingFlow,
});

const MODES: { mode: TastingMode; icon: typeof Home; note: string; enabled: boolean }[] = [
  { mode: "market_pickup", icon: ShoppingBag, note: "Free · meet at the weekend market stall", enabled: true },
  { mode: "home_pickup", icon: Home, note: "Free · collect from the producer's kitchen", enabled: true },
  { mode: "producer_delivery", icon: Truck, note: "Concept preview", enabled: false },
];

function BookingFlow() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useSession();

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<TastingMode | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);

  const productQuery = useQuery({ queryKey: ["product", productId], queryFn: () => fetchProduct(productId) });
  const slotsQuery = useQuery({
    queryKey: ["product-slots", productId],
    queryFn: () => fetchProductSlots(productId),
  });

  const openSlots = useMemo(
    () => (slotsQuery.data ?? []).filter((s) => s.is_available),
    [slotsQuery.data],
  );
  const dates = useMemo(() => {
    const set = new Set<string>();
    openSlots.forEach((s) => {
      if (s.booked_count < s.capacity) set.add(s.date);
    });
    return Array.from(set).sort().slice(0, 7);
  }, [openSlots]);

  const daySlots = openSlots.filter((s) => s.date === date);
  const slot = openSlots.find((s) => s.id === slotId) ?? null;
  const product = productQuery.data;

  const confirmBooking = useMutation({
    mutationFn: async () => {
      if (!slot || !mode) throw new Error("Pick a tasting mode and time first.");
      const { data: fresh, error: freshError } = await db
        .from("tasting_slots")
        .select("capacity, booked_count")
        .eq("id", slot.id)
        .single();
      if (freshError) throw freshError;
      if (fresh.booked_count >= fresh.capacity) throw new Error("That slot just filled up.");

      const { data, error } = await db
        .from("bookings")
        .insert({
          customer_id: currentCustomerId(session),
          slot_id: slot.id,
          booking_ref: makeBookingRef(),
          tasting_mode: mode,
          status: "reserved",
          qr_token: makeQrToken(),
        })
        .select("id")
        .single();
      if (error) throw error;

      const { error: incError } = await db
        .from("tasting_slots")
        .update({ booked_count: fresh.booked_count + 1 })
        .eq("id", slot.id);
      if (incError) throw incError;

      return data.id as string;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["product-slots", productId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Tasting reserved!");
      navigate({ to: "/booking/confirm/$id", params: { id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not confirm the booking."),
  });

  return (
    <CustomerShell>
      <h1 className="font-serif text-3xl font-semibold">Book a tasting</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {product ? `${product.name} · ${product.producers?.business_name}` : "Loading product…"}
      </p>

      <div className="mt-5 max-w-2xl">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                n <= step ? "bg-terracotta" : "bg-cream-deep",
              )}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Step {step} of 3 — {step === 1 ? "tasting mode" : step === 2 ? "date & time" : "summary"}
        </p>
      </div>

      <div className="mt-6 max-w-2xl space-y-4">
        {step === 1 && (
          <>
            {MODES.map(({ mode: m, icon: Icon, note, enabled }) => (
              <button
                key={m}
                type="button"
                disabled={!enabled}
                onClick={() => setMode(m)}
                className={cn(
                  "ht-card flex w-full items-center gap-4 p-5 text-left transition-colors",
                  mode === m && "border-terracotta bg-terracotta-soft",
                  !enabled && "cursor-not-allowed opacity-60",
                )}
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-cream text-terracotta">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="block font-serif text-lg font-semibold">
                    {TASTING_MODE_LABEL[m]}
                  </span>
                  <span className="block text-sm text-muted-foreground">{note}</span>
                </span>
                {mode === m && <Check className="size-5 text-terracotta" aria-hidden />}
              </button>
            ))}
            <Button className="w-full rounded-full" disabled={!mode} onClick={() => setStep(2)}>
              Continue
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            {slotsQuery.isPending ? (
              <RowSkeletonList count={3} />
            ) : dates.length === 0 ? (
              <EmptyState
                icon={<ShoppingBag className="size-7" aria-hidden />}
                title="No open tasting times"
                description="This producer has no availability in the next 7 days."
                ctaLabel="Back to discovery"
                ctaTo="/discover"
              />
            ) : (
              <>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {dates.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setDate(d);
                        setSlotId(null);
                      }}
                      className={cn(
                        "ht-card shrink-0 px-4 py-3 text-center text-sm",
                        date === d && "border-terracotta bg-terracotta-soft",
                      )}
                    >
                      <span className="block text-xs text-muted-foreground">
                        {formatDate(d, { weekday: "short" })}
                      </span>
                      <span className="block font-semibold">
                        {formatDate(d, { month: "short", day: "numeric" })}
                      </span>
                    </button>
                  ))}
                </div>

                {date && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {daySlots.map((s) => {
                      const soldOut = s.booked_count >= s.capacity;
                      const remaining = Math.max(0, s.capacity - s.booked_count);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={soldOut}
                          onClick={() => setSlotId(s.id)}
                          className={cn(
                            "ht-card p-3 text-sm",
                            slotId === s.id && "border-terracotta bg-terracotta-soft",
                            soldOut && "cursor-not-allowed opacity-50",
                          )}
                        >
                          <span className="block font-semibold">{formatTime(s.start_time)}</span>
                          <span className="block text-xs text-muted-foreground">
                            {soldOut ? "Fully booked" : `${remaining} of ${s.capacity} left`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-full" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button className="flex-1 rounded-full" disabled={!slotId} onClick={() => setStep(3)}>
                    Continue
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {step === 3 && slot && product && mode && (
          <>
            <SummaryCard product={product.name} producer={product.producers?.business_name ?? ""} mode={mode} slot={slot} price={money(product.price)} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                className="flex-1 rounded-full"
                disabled={confirmBooking.isPending}
                onClick={() => confirmBooking.mutate()}
              >
                {confirmBooking.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Confirm Booking
              </Button>
            </div>
          </>
        )}
      </div>
    </CustomerShell>
  );
}

function SummaryCard({
  product,
  producer,
  mode,
  slot,
  price,
}: {
  product: string;
  producer: string;
  mode: TastingMode;
  slot: Slot;
  price: string;
}) {
  const rows = [
    ["Product", product],
    ["Producer", producer],
    ["Tasting mode", TASTING_MODE_LABEL[mode]],
    ["Date", formatDate(slot.date, { weekday: "long", month: "long", day: "numeric" })],
    ["Time", formatTime(slot.start_time)],
    ["Tasting fee", price],
  ];
  return (
    <div className="ht-card divide-y divide-border">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="text-right font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}
