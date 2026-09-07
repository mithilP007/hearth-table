import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Package } from "lucide-react";
import { CustomerShell } from "@/components/ht/CustomerShell";
import { DietaryTags, VerifiedBadge, VerificationBadge } from "@/components/ht/badges";
import { CardSkeletonGrid, EmptyState } from "@/components/ht/states";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProducer, fetchProducerProducts, money } from "@/lib/data";

export const Route = createFileRoute("/producer/$id")({
  head: () => ({
    meta: [
      { title: "Producer profile — Hearth & Table" },
      {
        name: "description",
        content:
          "Meet a verified cottage food producer: their story, address and the products you can book a tasting for.",
      },
      { property: "og:title", content: "Producer profile — Hearth & Table" },
      { property: "og:description", content: "Verified cottage food kitchen on Hearth & Table." },
    ],
  }),
  component: ProducerProfile,
});

function ProducerProfile() {
  const { id } = Route.useParams();
  const producerQuery = useQuery({ queryKey: ["producer", id], queryFn: () => fetchProducer(id) });
  const productsQuery = useQuery({
    queryKey: ["producer-products", id],
    queryFn: () => fetchProducerProducts(id),
  });

  const producer = producerQuery.data;

  return (
    <CustomerShell>
      {producerQuery.isPending || !producer ? (
        <div className="space-y-4">
          <Skeleton className="h-56 w-full rounded-xl bg-cream-deep" />
          <Skeleton className="h-6 w-64 bg-cream-deep" />
          <Skeleton className="h-4 w-80 bg-cream-deep" />
        </div>
      ) : (
        <>
          <img
            src={producer.cover_image_url ?? ""}
            alt={`${producer.business_name} cover`}
            className="h-56 w-full rounded-xl object-cover sm:h-72"
          />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-semibold">{producer.business_name}</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {(producer.cuisine_categories ?? []).join(" · ")}
              </p>
            </div>
            {producer.verification_status === "verified" ? (
              <div>
                <VerifiedBadge size="lg" label="Verified Cottage Food Producer" />
                <p className="mt-1.5 text-xs text-muted-foreground">Registration verified</p>
              </div>
            ) : (
              <VerificationBadge status={producer.verification_status} />
            )}
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {producer.bio}
          </p>
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 text-terracotta" aria-hidden /> {producer.address}
          </p>
        </>
      )}

      <h2 className="mt-10 font-serif text-2xl font-semibold">Catalogue</h2>
      <div className="mt-4">
        {productsQuery.isPending ? (
          <CardSkeletonGrid count={3} />
        ) : (productsQuery.data ?? []).length === 0 ? (
          <EmptyState
            icon={<Package className="size-7" aria-hidden />}
            title="No products listed yet"
            description="This producer hasn't published their catalogue."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(productsQuery.data ?? []).map((product) => (
              <Link
                key={product.id}
                to="/product/$id"
                params={{ id: product.id }}
                className="ht-card overflow-hidden transition-shadow hover:shadow-[var(--shadow-lift)]"
              >
                <img
                  src={product.image_url ?? ""}
                  alt={product.name}
                  loading="lazy"
                  className="h-40 w-full object-cover"
                />
                <div className="space-y-2 p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-serif text-base font-semibold">{product.name}</h3>
                    <span className="text-sm font-medium">{money(product.price)}</span>
                  </div>
                  <DietaryTags tags={product.dietary_tags} />
                  {product.is_tasting_available && (
                    <span className="inline-flex rounded-full bg-terracotta px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                      Book a Tasting
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
