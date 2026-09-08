import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, Loader2 } from "lucide-react";
import { ProducerShell } from "@/components/ht/ProducerShell";
import { EmptyState, RowSkeletonList } from "@/components/ht/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  db,
  fetchProducerProducts,
  fetchProducerSlots,
  formatDate,
  formatTime,
} from "@/lib/data";
import { currentProducerId, useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/producer/availability")({
  head: () => ({
    meta: [
      { title: "Tasting availability — Hearth & Table" },
      {
        name: "description",
        content: "Create tasting slots, set capacity and switch times on or off for the week ahead.",
      },
      { property: "og:title", content: "Tasting availability — Hearth & Table" },
      { property: "og:description", content: "Open the times you can host tastings." },
    ],
  }),
  component: ProducerAvailability,
});

function ProducerAvailability() {
  const { session } = useSession();
  const producerId = currentProducerId(session);
  const queryClient = useQueryClient();

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d.toISOString().slice(0, 10);
      }),
    [],
  );
  const [day, setDay] = useState(days[0] as string);
  const [form, setForm] = useState({ productId: "", time: "10:00", capacity: "10" });

  const productsQuery = useQuery({
    queryKey: ["producer-products", producerId],
    queryFn: () => fetchProducerProducts(producerId),
  });
  const slotsQuery = useQuery({
    queryKey: ["producer-slots", producerId],
    queryFn: () => fetchProducerSlots(producerId),
  });

  const daySlots = (slotsQuery.data ?? []).filter((s) => s.date === day);
  const capacityNum = Number(form.capacity);
  const errors = {
    product: form.productId ? "" : "Choose a product.",
    capacity:
      Number.isInteger(capacityNum) && capacityNum >= 1 && capacityNum <= 50
        ? ""
        : "Capacity must be between 1 and 50.",
  };
  const valid = !errors.product && !errors.capacity;

  const createSlot = useMutation({
    mutationFn: async () => {
      const { error } = await db.from("tasting_slots").insert({
        product_id: form.productId,
        date: day,
        start_time: form.time,
        capacity: capacityNum,
        booked_count: 0,
        is_available: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-slots", producerId] });
      toast.success("Tasting slot created.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create the slot."),
  });

  const toggleSlot = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      const { error } = await db.from("tasting_slots").update({ is_available: next }).eq("id", id);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      queryClient.invalidateQueries({ queryKey: ["producer-slots", producerId] });
      toast.success(next ? "Slot is open for bookings." : "Slot closed.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update the slot."),
  });

  return (
    <ProducerShell>
      <h1 className="font-serif text-3xl font-semibold">Availability</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Open the times you can host tastings in the next week.
      </p>

      <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1">
        {days.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDay(d)}
            className={cn(
              "ht-card shrink-0 px-4 py-3 text-center text-sm",
              day === d && "border-terracotta bg-terracotta-soft",
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

      <div className="ht-card mt-6 space-y-4 p-5">
        <h2 className="font-serif text-xl font-semibold">Create tasting slot</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Product</Label>
            <Select
              value={form.productId}
              onValueChange={(v) => setForm((f) => ({ ...f, productId: v }))}
            >
              <SelectTrigger className="mt-1.5 bg-cream">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {(productsQuery.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.product && <p className="mt-1.5 text-xs text-destructive">{errors.product}</p>}
          </div>
          <div>
            <Label htmlFor="s-time">Start time</Label>
            <Input
              id="s-time"
              type="time"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              className="mt-1.5 bg-cream"
            />
          </div>
          <div>
            <Label htmlFor="s-cap">Capacity</Label>
            <Input
              id="s-cap"
              inputMode="numeric"
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              className={cn("mt-1.5 bg-cream", errors.capacity && "border-destructive")}
            />
            {errors.capacity && (
              <p className="mt-1.5 text-xs text-destructive">{errors.capacity}</p>
            )}
          </div>
        </div>
        <Button
          className="rounded-full"
          disabled={!valid || createSlot.isPending}
          onClick={() => createSlot.mutate()}
        >
          {createSlot.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Create Tasting Slot
        </Button>
      </div>

      <h2 className="mt-8 font-serif text-2xl font-semibold">
        Slots on {formatDate(day, { weekday: "long", month: "long", day: "numeric" })}
      </h2>
      <div className="mt-4">
        {slotsQuery.isPending ? (
          <RowSkeletonList count={3} />
        ) : daySlots.length === 0 ? (
          <EmptyState
            icon={<CalendarClock className="size-7" aria-hidden />}
            title="No slots for this day"
            description="Create one above and customers can book it right away."
          />
        ) : (
          <div className="space-y-3">
            {daySlots.map((slot) => (
              <div key={slot.id} className="ht-card flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {formatTime(slot.start_time)} · {slot.products?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {slot.booked_count}/{slot.capacity} booked
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {slot.is_available ? "Available" : "Unavailable"}
                  </span>
                  <Switch
                    checked={slot.is_available}
                    onCheckedChange={(next) => toggleSlot.mutate({ id: slot.id, next })}
                    aria-label="Toggle slot availability"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProducerShell>
  );
}
