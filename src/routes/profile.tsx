import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { LogOut, Save, User, Loader2 } from "lucide-react";
import { CustomerShell } from "@/components/ht/CustomerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/data";
import {
  clearSession,
  demoCustomer,
  demoProducer,
  saveSession,
  useSession,
  currentCustomerId,
} from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Hearth & Table" },
      {
        name: "description",
        content: "Your Hearth & Table details, dietary preferences and demo sign-in controls.",
      },
      { property: "og:title", content: "Your profile — Hearth & Table" },
      { property: "og:description", content: "Manage your tasting preferences and account." },
    ],
  }),
  component: ProfilePage,
});

const DIET_OPTIONS = ["Gluten-Free", "Vegan", "Nut-Free", "Halal", "Kosher", "Vegetarian"];

function ProfilePage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const person = session ?? demoCustomer;
  const custId = currentCustomerId(session);

  const [name, setName] = useState(person.name ?? "");
  const [phone, setPhone] = useState("");
  const [diet, setDiet] = useState<string[]>(person.dietary ?? []);
  const [zip, setZip] = useState(person.zip ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session) {
      setName(session.name ?? "");
      setDiet(session.dietary ?? []);
      setZip(session.zip ?? "");
    }
  }, [session]);

  function toggleDiet(tag: string) {
    setDiet((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Upsert profile into public.profiles
      const { error } = await db.from("profiles").upsert(
        {
          id: custId,
          role: session?.role ?? "customer",
          full_name: name.trim() || "Customer",
          phone: phone.trim() || null,
          dietary_preferences: diet,
        },
        { onConflict: "id" }
      );
      if (error) throw error;

      saveSession({
        ...person,
        name: name.trim() || "Customer",
        dietary: diet,
        ...(zip ? { zip } : {}),
      });

      toast.success("Profile details updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CustomerShell>
      <h1 className="font-serif text-3xl font-semibold">Your Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your personal details &amp; tasting preferences.</p>

      <div className="mt-6 max-w-xl space-y-5">
        {/* User Card */}
        <div className="ht-card p-5 space-y-4">
          <div className="flex items-center gap-4 border-b border-border pb-4">
            <span className="flex size-14 items-center justify-center rounded-full bg-terracotta-soft text-terracotta">
              <User className="size-6" aria-hidden />
            </span>
            <div>
              <p className="font-serif text-lg font-semibold">{person.name}</p>
              <p className="text-sm text-muted-foreground">
                {person.email ?? "customer@hearthandtable.demo"}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <Label htmlFor="prof-name">Full name</Label>
              <Input
                id="prof-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 bg-cream"
              />
            </div>
            <div>
              <Label htmlFor="prof-phone">Phone number (optional)</Label>
              <Input
                id="prof-phone"
                value={phone}
                placeholder="512-555-0100"
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 bg-cream"
              />
            </div>
            <div>
              <Label htmlFor="prof-zip">Default ZIP code</Label>
              <Input
                id="prof-zip"
                value={zip}
                placeholder="78702"
                onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                className="mt-1.5 bg-cream"
              />
            </div>
          </div>
        </div>

        {/* Dietary Preferences Card */}
        <div className="ht-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Dietary preferences</h2>
          <p className="text-xs text-muted-foreground">
            Select dietary tags to highlight matching tasting options.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {DIET_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleDiet(tag)}
                className={cn("ht-chip", diet.includes(tag) && "ht-chip-active")}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="pt-3">
            <Button
              className="rounded-full"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
              Save changes
            </Button>
          </div>
        </div>

        {/* Demo Account Control Card */}
        <div className="ht-card space-y-3 p-5">
          <h2 className="text-sm font-semibold">Demo Account Switcher</h2>
          <p className="text-sm text-muted-foreground">
            Quickly switch between customer and producer personas during your demo.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                saveSession(demoCustomer);
                toast.success("Signed in as Demo Customer.");
              }}
            >
              Use Demo Customer
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                saveSession(demoProducer);
                toast.success("Signed in as Vega Hearth Breads (Producer).");
              }}
            >
              Use Demo Producer
            </Button>
            <Button
              variant="outline"
              className="rounded-full text-destructive border-border"
              onClick={() => {
                clearSession();
                toast.success("Signed out.");
                navigate({ to: "/" });
              }}
            >
              <LogOut className="mr-2 size-4" /> Sign out
            </Button>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
