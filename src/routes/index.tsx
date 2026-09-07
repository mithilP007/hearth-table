import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Flame, ShoppingBasket, ChefHat, BadgeCheck, MapPin, QrCode } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hearth & Table — Taste Before You Buy" },
      {
        name: "description",
        content:
          "Book a small tasting with verified local cottage food producers — home bakers, jam makers and confectioners — before you commit to a full order.",
      },
      { property: "og:title", content: "Hearth & Table — Taste Before You Buy" },
      {
        property: "og:description",
        content:
          "Discover verified cottage food producers near you and reserve a tasting in a couple of taps.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="ht-shell flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-terracotta text-primary-foreground">
            <Flame className="size-4" aria-hidden />
          </span>
          <span className="font-serif text-lg font-semibold">Hearth &amp; Table</span>
        </div>
        <Link
          to="/discover"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Browse producers
        </Link>
      </header>

      <main>
        <section className="ht-shell grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-sage-soft px-3 py-1.5 text-xs font-medium text-sage">
              <BadgeCheck className="size-3.5" aria-hidden /> Every producer permit-checked
            </span>
            <h1 className="mt-5 font-serif text-4xl leading-tight font-semibold sm:text-5xl md:text-6xl">
              Taste Before You Buy
            </h1>
            <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
              Discover verified local cottage food producers — home bakers, jam makers and
              confectioners — and book a small tasting before you order full size.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/customer/signup"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-card)] transition-colors hover:bg-primary/90"
              >
                Start tasting <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                to="/producer/signup"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium transition-colors hover:bg-cream-deep"
              >
                Sell your food
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 text-sm">
              {[
                { icon: MapPin, label: "Producers near you" },
                { icon: QrCode, label: "QR tasting pass" },
                { icon: BadgeCheck, label: "Verified permits" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <Icon className="size-4 text-terracotta" aria-hidden />
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=80"
              alt="Freshly baked cottage loaves cooling on a wooden table"
              className="h-64 w-full rounded-xl object-cover shadow-[var(--shadow-lift)] sm:h-80 md:h-[26rem]"
              loading="eager"
            />
            <div className="ht-card absolute -bottom-6 left-4 hidden max-w-[15rem] p-4 sm:block">
              <p className="font-serif text-sm font-semibold">Vega Hearth Breads</p>
              <p className="mt-1 text-xs text-muted-foreground">
                48-hour sourdough tasting · $4 · Sat 10:00 AM
              </p>
            </div>
          </div>
        </section>

        <section className="ht-shell grid gap-5 pt-10 pb-20 md:grid-cols-2">
          <RoleCard
            to="/customer/signup"
            icon={<ShoppingBasket className="size-5" aria-hidden />}
            title="I'm a Customer"
            body="Find verified producers near you, book a tasting for a couple of dollars, then order full size if you love it."
            cta="Create a customer account"
          />
          <RoleCard
            to="/producer/signup"
            icon={<ChefHat className="size-5" aria-hidden />}
            title="I'm a Producer"
            body="Get your cottage food permit verified, list tasting portions, and turn samplers into repeat orders."
            cta="Start producer verification"
          />
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="ht-shell text-xs text-muted-foreground">
          Hearth &amp; Table — a tasting-first cottage food marketplace concept.
        </div>
      </footer>
    </div>
  );
}

function RoleCard({
  to,
  icon,
  title,
  body,
  cta,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Link
      to={to}
      className="ht-card group flex flex-col gap-3 p-7 transition-shadow hover:shadow-[var(--shadow-lift)]"
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-terracotta-soft text-terracotta">
        {icon}
      </span>
      <h2 className="font-serif text-2xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{body}</p>
      <span className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-terracotta">
        {cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
      </span>
    </Link>
  );
}
