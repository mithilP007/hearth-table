import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { CalendarPlus, MapPin, Share2 } from "lucide-react";
import { CustomerShell } from "@/components/ht/CustomerShell";
import { BookingStatusBadge, StatusTimeline } from "@/components/ht/badges";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TASTING_MODE_LABEL, fetchBooking, formatDate, formatTime } from "@/lib/data";

export const Route = createFileRoute("/booking/confirm/$id")({
  head: () => ({
    meta: [
      { title: "Your tasting pass — Hearth & Table" },
      {
        name: "description",
        content:
          "Your QR tasting pass, booking reference and pickup details for an upcoming cottage food tasting.",
      },
      { property: "og:title", content: "Your tasting pass — Hearth & Table" },
      { property: "og:description", content: "Show this QR code at your tasting." },
    ],
  }),
  component: BookingConfirmation,
});

function BookingConfirmation() {
  const { id } = Route.useParams();
  const { data: booking, isPending } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => fetchBooking(id),
  });

  if (isPending || !booking) {
    return (
      <CustomerShell>
        <div className="mx-auto max-w-lg space-y-4">
          <Skeleton className="mx-auto size-56 rounded-xl bg-cream-deep" />
          <Skeleton className="mx-auto h-5 w-40 bg-cream-deep" />
          <Skeleton className="h-24 w-full rounded-xl bg-cream-deep" />
        </div>
      </CustomerShell>
    );
  }

  const slot = booking.tasting_slots;
  const product = slot?.products;
  const producer = product?.producers;

  function addToCalendar() {
    if (!slot) return;
    const start = new Date(`${slot.date}T${slot.start_time}`);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Hearth and Table//Tasting//EN",
      "BEGIN:VEVENT",
      `UID:${booking.booking_ref}@hearthandtable`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:Tasting — ${product?.name ?? "Hearth & Table"}`,
      `LOCATION:${producer?.address ?? ""}`,
      `DESCRIPTION:Booking ${booking.booking_ref} · ${TASTING_MODE_LABEL[booking.tasting_mode]}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${booking.booking_ref}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Calendar file downloaded.");
  }

  async function share() {
    const shareUrl = window.location.href;
    const text = `My Hearth & Table tasting ${booking.booking_ref}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Hearth & Table tasting", text, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard.");
    } catch {
      toast.error("Couldn't share that link.");
    }
  }

  return (
    <CustomerShell>
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-serif text-3xl font-semibold">You're on the list</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Show this pass when you arrive for your tasting.
        </p>

        <div className="mt-6 inline-flex rounded-2xl border-2 border-terracotta bg-card p-5 shadow-[var(--shadow-card)]">
          <QRCodeSVG
            value={booking.qr_token ?? booking.booking_ref}
            size={196}
            bgColor="#FFFFFF"
            fgColor="#2C2C2C"
            level="M"
          />
        </div>

        <p className="mt-4 font-mono text-lg tracking-widest">{booking.booking_ref}</p>
        <div className="mt-3">
          <BookingStatusBadge status={booking.status} full />
        </div>

        <div className="ht-card mt-6 divide-y divide-border text-left">
          {[
            ["Product", product?.name ?? "—"],
            ["Producer", producer?.business_name ?? "—"],
            [
              "Date",
              slot ? formatDate(slot.date, { weekday: "long", month: "long", day: "numeric" }) : "—",
            ],
            ["Time", slot ? formatTime(slot.start_time) : "—"],
            ["Tasting mode", TASTING_MODE_LABEL[booking.tasting_mode]],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="text-right font-medium">{value}</span>
            </div>
          ))}
          <p className="flex items-start gap-2 px-5 py-3.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0 text-terracotta" aria-hidden />
            {producer?.address ?? "Location shared after confirmation"}
          </p>
        </div>

        <div className="ht-card mt-4 p-5">
          <StatusTimeline status={booking.status} />
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1 rounded-full" onClick={addToCalendar}>
            <CalendarPlus className="mr-2 size-4" /> Add to Calendar
          </Button>
          <Button variant="outline" className="flex-1 rounded-full" onClick={share}>
            <Share2 className="mr-2 size-4" /> Share
          </Button>
        </div>

        <Link
          to="/my-bookings"
          className="mt-5 inline-block text-sm font-medium text-terracotta hover:underline"
        >
          View all my bookings
        </Link>
      </div>
    </CustomerShell>
  );
}
