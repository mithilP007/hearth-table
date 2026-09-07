import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { MapPin, Flame, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/data";
import { saveSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/customer/signup")({
  head: () => ({
    meta: [
      { title: "Create your tasting account — Hearth & Table" },
      {
        name: "description",
        content:
          "Set up a Hearth & Table customer account: your details, dietary preferences and location for nearby verified producers.",
      },
      { property: "og:title", content: "Create your tasting account — Hearth & Table" },
      {
        property: "og:description",
        content: "Three quick steps and you can book your first cottage food tasting.",
      },
    ],
  }),
  component: CustomerSignup,
});

const DIET = ["Gluten-Free", "Vegan", "Nut-Free", "Halal", "Kosher", "Vegetarian"];

function CustomerSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [diet, setDiet] = useState<string[]>([]);
  const [zip, setZip] = useState("");
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const errors = {
    name: form.name.trim().length < 2 ? "Please enter your full name." : "",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? "" : "Enter a valid email address.",
    password: form.password.length < 6 ? "Use at least 6 characters." : "",
  };
  const step1Valid = !errors.name && !errors.email && !errors.password;
  const step3Valid = !!coords || /^\d{5}$/.test(zip);

  function toggleDiet(tag: string) {
    setDiet((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function askLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Your browser can't share location — enter a ZIP code instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("Location shared — we'll show producers near you.");
      },
      () => {
        setLocating(false);
        toast.error("Location blocked. Pop in a ZIP code instead.");
      },
    );
  }

  async function finish() {
    setSaving(true);
    try {
      const { data, error } = await db
        .from("profiles")
        .insert({
          role: "customer",
          full_name: form.name.trim(),
          dietary_preferences: diet,
        })
        .select("id")
        .single();
      if (error) throw error;
      saveSession({
        role: "customer",
        profileId: data.id,
        name: form.name.trim(),
        email: form.email.trim(),
        dietary: diet,
        ...(zip ? { zip } : {}),
      });
      toast.success("Welcome to Hearth & Table!");
      navigate({ to: "/discover" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create your account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="ht-shell flex h-16 items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-terracotta text-primary-foreground">
            <Flame className="size-4" aria-hidden />
          </span>
          <span className="font-serif text-lg font-semibold">Hearth &amp; Table</span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 pb-16">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  n <= step ? "bg-terracotta" : "bg-cream-deep",
                )}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Step {step} of 3</p>
        </div>

        <div className="ht-card p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h1 className="font-serif text-2xl font-semibold">Create your account</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  This demo doesn't send emails — anything valid works.
                </p>
              </div>
              <Field
                id="name"
                label="Full name"
                value={form.name}
                error={touched["name"] ? errors.name : ""}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Jordan Reyes"
              />
              <Field
                id="email"
                label="Email"
                type="email"
                value={form.email}
                error={touched["email"] ? errors.email : ""}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                placeholder="you@example.com"
              />
              <Field
                id="password"
                label="Password"
                type="password"
                value={form.password}
                error={touched["password"] ? errors.password : ""}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                onChange={(v) => setForm((f) => ({ ...f, password: v }))}
                placeholder="At least 6 characters"
              />
              <Button
                className="w-full rounded-full"
                disabled={!step1Valid}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>
              <Button
                variant="outline"
                className="w-full rounded-full"
                onClick={() => {
                  setForm({
                    name: "Jordan Reyes",
                    email: "jordan@example.com",
                    password: "demo1234",
                  });
                  setStep(2);
                  toast.success("Demo account filled in.");
                }}
              >
                Continue with Google (demo)
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h1 className="font-serif text-2xl font-semibold">Any dietary preferences?</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  We'll highlight matching tastings. Skip if you eat everything.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {DIET.map((tag) => (
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
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="flex-1 rounded-full" onClick={() => setStep(3)}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex size-11 items-center justify-center rounded-full bg-terracotta-soft text-terracotta">
                <MapPin className="size-5" aria-hidden />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-semibold">Where should we look?</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  We use your location to find verified producers near you. Nothing is shared with
                  them until you book.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-full"
                onClick={askLocation}
                disabled={locating}
              >
                {locating && <Loader2 className="mr-2 size-4 animate-spin" />}
                {coords ? "Location shared ✓" : "Use my current location"}
              </Button>
              <div>
                <Label htmlFor="zip" className="text-sm">
                  Or enter a ZIP code
                </Label>
                <Input
                  id="zip"
                  inputMode="numeric"
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder="78702"
                  className="mt-1.5 bg-cream"
                />
                {zip && !/^\d{5}$/.test(zip) && (
                  <p className="mt-1.5 text-xs text-destructive">Enter a 5-digit ZIP code.</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  className="flex-1 rounded-full"
                  disabled={!step3Valid || saving}
                  onClick={finish}
                >
                  {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Finish
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={cn("mt-1.5 bg-cream", error && "border-destructive")}
      />
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
