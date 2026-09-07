import { Suspense, lazy, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Compass, List, Map as MapIcon, Search, X } from "lucide-react";
import { CustomerShell } from "@/components/ht/CustomerShell";
import { VerifiedBadge } from "@/components/ht/badges";
import { CardSkeletonGrid, EmptyState } from "@/components/ht/states";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_LOCATION, distanceMiles, fetchDiscoverProducers, type Producer } from "@/lib/data";
import { cn } from "@/lib/utils";

const ProducerMap = lazy(() => import("@/components/ht/ProducerMap"));

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover verified producers — Hearth & Table" },
      {
        name: "description",
        content:
          "Search verified cottage food producers near you by cuisine, dietary needs and distance, on a map or as a list.",
      },
      { property: "og:title", content: "Discover verified producers — Hearth & Table" },
      {
        property: "og:description",
        content: "Only permit-verified producers taking tastings appear here.",
      },
    ],
  }),
  component: Discover,
});

const DIET_FILTERS = ["Gluten-Free", "Vegan", "Nut-Free", "Halal", "Kosher", "Vegetarian"];
const DISTANCES = [
  { label: "< 5 mi", value: 5 },
  { label: "< 10 mi", value: 10 },
  { label: "< 25 mi", value: 25 },
];

function Discover() {
  const [view, setView] = useState<"list" | "map">("list");
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [diet, setDiet] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [selected, setSelected] = useState<Producer | null>(null);

  const producersQuery = useQuery({
    queryKey: ["discover-producers"],
    queryFn: fetchDiscoverProducers,
  });

  const dietaryQuery = useQuery({
    queryKey: ["discover-dietary"],
    queryFn: async () => {
      const { db } = await import("@/lib/data");
      const { data, error } = await db.from("products").select("producer_id, dietary_tags");
      if (error) throw error;
      const map = new Map<string, Set<string>>();
      (data ?? []).forEach((row: { producer_id: string; dietary_tags: string[] }) => {
        const set = map.get(row.producer_id) ?? new Set<string>();
        (row.dietary_tags ?? []).forEach((t) => set.add(t));
        map.set(row.producer_id, set);
      });
      return map;
    },
  });

  const producers = producersQuery.data ?? [];

  const cuisines = useMemo(
    () => Array.from(new Set(producers.flatMap((p) => p.cuisine_categories ?? []))).sort(),
    [producers],
  );

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    return producers
      .map((p) => ({
        producer: p,
        miles: distanceMiles(DEFAULT_LOCATION, { lat: p.lat, lng: p.lng }),
      }))
      .filter(({ producer, miles }) => {
        if (term && !`${producer.business_name} ${producer.cuisine_categories?.join(" ")}`.toLowerCase().includes(term))
          return false;
        if (cuisine && !(producer.cuisine_categories ?? []).includes(cuisine)) return false;
        if (diet) {
          const tags = dietaryQuery.data?.get(producer.id);
          if (!tags || !tags.has(diet)) return false;
        }
        if (distance != null && (miles == null || miles > distance)) return false;
        return true;
      })
      .sort((a, b) => (a.miles ?? 1e9) - (b.miles ?? 1e9));
  }, [producers, search, cuisine, diet, distance, dietaryQuery.data]);

  const activeFilters = [cuisine, diet, distance != null ? `${distance}` : null].filter(Boolean).length;

  return (
    <CustomerShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Discover producers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verified cottage food kitchens taking tastings right now.
          </p>
        </div>
        <div className="flex rounded-full border border-border bg-card p-1">
          {(["list", "map"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm capitalize transition-colors",
                view === v ? "bg-terracotta text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {v === "list" ? <List className="size-4" /> : <MapIcon className="size-4" />}
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search producers or cuisine"
            className="bg-card pl-10"
            aria-label="Search producers"
          />
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {cuisines.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCuisine(cuisine === c ? null : c)}
              className={cn("ht-chip shrink-0", cuisine === c && "ht-chip-active")}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {DIET_FILTERS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDiet(diet === d ? null : d)}
              className={cn("ht-chip shrink-0", diet === d && "ht-chip-active")}
            >
              {d}
            </button>
          ))}
          {DISTANCES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDistance(distance === d.value ? null : d.value)}
              className={cn("ht-chip shrink-0", distance === d.value && "ht-chip-active")}
            >
              {d.label}
            </button>
          ))}
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={() => {
                setCuisine(null);
                setDiet(null);
                setDistance(null);
              }}
              className="ht-chip shrink-0 text-muted-foreground"
            >
              <X className="size-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        {producersQuery.isPending ? (
          <CardSkeletonGrid />
        ) : results.length === 0 ? (
          <EmptyState
            icon={<Compass className="size-7" aria-hidden />}
            title="No producers match those filters"
            description="Try widening the distance or clearing a dietary filter."
          />
        ) : view === "list" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map(({ producer, miles }) => (
              <ProducerCard key={producer.id} producer={producer} miles={miles} />
            ))}
          </div>
        ) : (
          <div className="relative">
            <div className="h-[60vh] min-h-[360px] overflow-hidden rounded-xl border border-border bg-card">
              <Suspense fallback={<Skeleton className="size-full rounded-none bg-cream-deep" />}>
                <ProducerMap
                  producers={results.map((r) => r.producer)}
                  onSelect={(p) => setSelected(p)}
                />
              </Suspense>
            </div>

            {selected && (
              <div className="ht-card absolute inset-x-3 bottom-3 z-10 p-4 sm:right-auto sm:w-80">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-serif text-lg font-semibold">{selected.business_name}</p>
                    <p className="text-xs text-muted-foreground">{selected.address}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setSelected(null)}
                    className="text-muted-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="mt-2">
                  <VerifiedBadge />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{selected.bio}</p>
                <Button asChild className="mt-3 w-full rounded-full">
                  <Link to="/producer/$id" params={{ id: selected.id }}>
                    View producer
                  </Link>
                </Button>
              </div>
            )}

            <p className="mt-2 text-xs text-muted-foreground">
              Tap a terracotta pin to preview a producer.
            </p>
          </div>
        )}
      </div>
    </CustomerShell>
  );
}

function ProducerCard({ producer, miles }: { producer: Producer; miles: number | null }) {
  return (
    <Link
      to="/producer/$id"
      params={{ id: producer.id }}
      className="ht-card group overflow-hidden transition-shadow hover:shadow-[var(--shadow-lift)]"
    >
      <img
        src={producer.cover_image_url ?? ""}
        alt={`${producer.business_name} kitchen`}
        loading="lazy"
        className="h-40 w-full object-cover"
      />
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-serif text-lg leading-snug font-semibold">{producer.business_name}</h2>
          <VerifiedBadge />
        </div>
        <p className="text-xs text-muted-foreground">
          {(producer.cuisine_categories ?? []).join(" · ")}
        </p>
        <p className="text-xs text-muted-foreground">
          {miles != null ? `${miles.toFixed(1)} mi away` : "Distance unavailable"}
        </p>
      </div>
    </Link>
  );
}
