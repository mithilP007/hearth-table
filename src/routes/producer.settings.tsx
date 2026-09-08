import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, CreditCard, LogOut, Save, User, Loader2 } from "lucide-react";
import { ProducerShell } from "@/components/ht/ProducerShell";
import { VerificationBadge } from "@/components/ht/badges";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { db, fetchProducer } from "@/lib/data";
import { clearSession, currentProducerId, useSession } from "@/lib/session";

export const Route = createFileRoute("/producer/settings")({
  head: () => ({
    meta: [
      { title: "Producer settings — Hearth & Table" },
      {
        name: "description",
        content: "Manage your notification preferences, profile details, payout settings and demo sign-out.",
      },
      { property: "og:title", content: "Producer settings — Hearth & Table" },
      { property: "og:description", content: "Producer account configuration." },
    ],
  }),
  component: ProducerSettings,
});

type NotificationPrefs = {
  new_tasting_request: boolean;
  booking_reminders: boolean;
  conversion_alerts: boolean;
  weekly_summary: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  new_tasting_request: true,
  booking_reminders: true,
  conversion_alerts: true,
  weekly_summary: false,
};

function ProducerSettings() {
  const { session } = useSession();
  const producerId = currentProducerId(session);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const producerQuery = useQuery({
    queryKey: ["producer", producerId],
    queryFn: () => fetchProducer(producerId),
  });

  const producer = producerQuery.data;

  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    if (producer && (producer as unknown as { notification_prefs?: NotificationPrefs }).notification_prefs) {
      setPrefs(
        (producer as unknown as { notification_prefs: NotificationPrefs }).notification_prefs ??
          DEFAULT_PREFS,
      );
    }
  }, [producer]);

  const savePrefs = useMutation({
    mutationFn: async (updatedPrefs: NotificationPrefs) => {
      const { error } = await db
        .from("producers")
        .update({ notification_prefs: updatedPrefs })
        .eq("id", producerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer", producerId] });
      toast.success("Notification preferences saved!");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save preferences."),
  });

  function togglePref(key: keyof NotificationPrefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    savePrefs.mutate(next);
  }

  function handleLogout() {
    clearSession();
    toast.success("Signed out of producer account.");
    navigate({ to: "/" });
  }

  return (
    <ProducerShell>
      <h1 className="font-serif text-3xl font-semibold">Producer settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage notifications, view your kitchen profile, and payout connection.
      </p>

      <div className="mt-6 max-w-2xl space-y-6">
        {/* Profile Card */}
        <section className="ht-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-terracotta-soft text-terracotta">
              <User className="size-5" aria-hidden />
            </span>
            <h2 className="font-serif text-xl font-semibold">Kitchen profile</h2>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <p className="text-xs text-muted-foreground">Business name</p>
                <p className="font-serif text-lg font-semibold">
                  {producer?.business_name ?? session?.name ?? "Vega Hearth Breads"}
                </p>
              </div>
              {producer && <VerificationBadge status={producer.verification_status} />}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <p className="text-xs text-muted-foreground">Account email</p>
                <p className="text-sm font-medium">
                  {session?.email ?? "marisol@vegahearth.demo"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Kitchen address</p>
                <p className="text-sm font-medium">{producer?.address ?? "Austin, TX"}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="ht-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-sage-soft text-sage">
              <Bell className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-serif text-xl font-semibold">Notifications</h2>
              <p className="text-xs text-muted-foreground">Choose when you receive email &amp; SMS alerts</p>
            </div>
          </div>

          <div className="space-y-4 pt-2 divide-y divide-border">
            <div className="flex items-center justify-between pt-3">
              <div>
                <Label htmlFor="pref-request" className="font-medium cursor-pointer">
                  New Tasting Request
                </Label>
                <p className="text-xs text-muted-foreground">Instant alert when a customer reserves a slot</p>
              </div>
              <Switch
                id="pref-request"
                checked={prefs.new_tasting_request}
                onCheckedChange={() => togglePref("new_tasting_request")}
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <Label htmlFor="pref-reminder" className="font-medium cursor-pointer">
                  Booking Reminders
                </Label>
                <p className="text-xs text-muted-foreground">Reminder 2 hours before scheduled tasting</p>
              </div>
              <Switch
                id="pref-reminder"
                checked={prefs.booking_reminders}
                onCheckedChange={() => togglePref("booking_reminders")}
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <Label htmlFor="pref-conversion" className="font-medium cursor-pointer">
                  Conversion Alerts
                </Label>
                <p className="text-xs text-muted-foreground">Alert when a tasting customer orders full size</p>
              </div>
              <Switch
                id="pref-conversion"
                checked={prefs.conversion_alerts}
                onCheckedChange={() => togglePref("conversion_alerts")}
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <Label htmlFor="pref-weekly" className="font-medium cursor-pointer">
                  Weekly Summary
                </Label>
                <p className="text-xs text-muted-foreground">Monday digest of tasting counts &amp; revenue</p>
              </div>
              <Switch
                id="pref-weekly"
                checked={prefs.weekly_summary}
                onCheckedChange={() => togglePref("weekly_summary")}
              />
            </div>
          </div>
        </section>

        {/* Payout Info (demo) */}
        <section className="ht-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-cream text-terracotta">
                <CreditCard className="size-5" aria-hidden />
              </span>
              <h2 className="font-serif text-xl font-semibold">Payout Info</h2>
            </div>
            <span className="rounded-full bg-amber-soft px-3 py-1 text-xs font-semibold text-amber">
              Demo Mode
            </span>
          </div>

          <div className="rounded-xl border border-dashed border-border bg-cream/50 p-5 text-center space-y-2">
            <p className="font-serif text-base font-semibold">Stripe Connect Payouts</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Stripe payout integration will connect your bank account at commercial launch. In this prototype, tasting payouts are simulated.
            </p>
            <Button variant="outline" size="sm" className="mt-2 rounded-full" disabled>
              Stripe payout — connect at launch
            </Button>
          </div>
        </section>

        {/* Log Out */}
        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 size-4" /> Log out of producer account
          </Button>
        </div>
      </div>
    </ProducerShell>
  );
}
