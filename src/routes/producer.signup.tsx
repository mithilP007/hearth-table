import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Flame, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/data";
import { saveSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/producer/signup")({
  head: () => ({
    meta: [
      { title: "Sell your cottage food — Hearth & Table" },
      {
        name: "description",
        content:
          "Create a producer account on Hearth & Table: your business details, then permit verification.",
      },
      { property: "og:title", content: "Sell your cottage food — Hearth & Table" },
      {
        property: "og:description",
        content: "List tasting portions and turn samplers into repeat orders.",
      },
    ],
  }),
  component: ProducerSignup,
});

function ProducerSignup() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    business: "",
    email: "",
    password: "",
    phone: "",
    bio: "",
  });

  const errors = {
    business: form.business.trim().length < 2 ? "Tell us your business name." : "",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? "" : "Enter a valid email address.",
    password: form.password.length < 6 ? "Use at least 6 characters." : "",
    phone: form.phone.replace(/\D/g, "").length < 10 ? "Enter a 10-digit phone number." : "",
    bio: form.bio.trim().length < 20 ? "Give customers at least a sentence or two (20+ characters)." : "",
  };
  const valid = Object.values(errors).every((e) => !e);

  async function submit() {
    setSaving(true);
    try {
      const { data: profile, error: profileError } = await db
        .from("profiles")
        .insert({ role: "producer", full_name: form.business.trim(), phone: form.phone })
        .select("id")
        .single();
      if (profileError) throw profileError;

      const { data: producer, error: producerError } = await db
        .from("producers")
        .insert({
          profile_id: profile.id,
          business_name: form.business.trim(),
          bio: form.bio.trim(),
          verification_status: "pending",
          is_available_for_tastings: true,
          cuisine_categories: [],
        })
        .select("id")
        .single();
      if (producerError) throw producerError;

      saveSession({
        role: "producer",
        profileId: profile.id,
        producerId: producer.id,
        name: form.business.trim(),
        email: form.email.trim(),
      });
      toast.success("Account created — let's verify your permits.");
      navigate({ to: "/producer/verify" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create your producer account.");
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
        <div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-terracotta px-3 py-1 font-medium text-primary-foreground">
            Account
          </span>
          <span className="h-px flex-1 bg-border" />
          <span className="rounded-full border border-border px-3 py-1">Documents</span>
          <span className="h-px flex-1 bg-border" />
          <span className="rounded-full border border-border px-3 py-1">Under Review</span>
        </div>

        <div className="ht-card space-y-4 p-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold">Create your producer account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This is a demo — nothing is emailed or charged.
            </p>
          </div>

          <TextField
            id="business"
            label="Business name"
            value={form.business}
            error={touched["business"] ? errors.business : ""}
            onBlur={() => setTouched((t) => ({ ...t, business: true }))}
            onChange={(v) => setForm((f) => ({ ...f, business: v }))}
            placeholder="Vega Hearth Breads"
          />
          <TextField
            id="email"
            label="Email"
            type="email"
            value={form.email}
            error={touched["email"] ? errors.email : ""}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            placeholder="you@kitchen.com"
          />
          <TextField
            id="password"
            label="Password"
            type="password"
            value={form.password}
            error={touched["password"] ? errors.password : ""}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            onChange={(v) => setForm((f) => ({ ...f, password: v }))}
            placeholder="At least 6 characters"
          />
          <TextField
            id="phone"
            label="Phone"
            value={form.phone}
            error={touched["phone"] ? errors.phone : ""}
            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="512-555-0100"
          />
          <div>
            <Label htmlFor="bio" className="text-sm">
              Short bio
            </Label>
            <Textarea
              id="bio"
              value={form.bio}
              onBlur={() => setTouched((t) => ({ ...t, bio: true }))}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="What you make, where you make it, and what makes it worth tasting."
              className={cn("mt-1.5 min-h-24 bg-cream", touched["bio"] && errors.bio && "border-destructive")}
            />
            {touched["bio"] && errors.bio && (
              <p className="mt-1.5 text-xs text-destructive">{errors.bio}</p>
            )}
          </div>

          <Button className="w-full rounded-full" disabled={!valid || saving} onClick={submit}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Continue to verification
          </Button>
        </div>
      </main>
    </div>
  );
}

function TextField({
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
