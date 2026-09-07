import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CustomerShell } from "@/components/ht/CustomerShell";
import { DietaryTags, VerifiedBadge } from "@/components/ht/badges";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProduct, money } from "@/lib/data";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product detail — Hearth & Table" },
      {
        name: "description",
        content:
          "See a cottage food product's ingredients, dietary tags and tasting price before ordering full size.",
      },
      { property: "og:title", content: "Product detail — Hearth & Table" },
      { property: "og:description", content: "Book a tasting portion or order the full size." },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const { data: product, isPending } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
  });

  if (isPending || !product) {
    return (
      <CustomerShell>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-72 w-full rounded-xl bg-cream-deep" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-2/3 bg-cream-deep" />
            <Skeleton className="h-4 w-full bg-cream-deep" />
            <Skeleton className="h-4 w-5/6 bg-cream-deep" />
          </div>
        </div>
      </CustomerShell>
    );
  }

  const producer = product.producers;
  const gallery = [product.image_url, producer?.cover_image_url].filter(Boolean) as string[];

  return (
    <CustomerShell>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <img
            src={gallery[0] ?? ""}
            alt={product.name}
            className="h-72 w-full rounded-xl object-cover sm:h-96"
          />
          {gallery.length > 1 && (
            <div className="flex gap-3">
              {gallery.map((src) => (
                <img
                  key={src}
                  src={src}
                  alt={`${product.name} detail`}
                  loading="lazy"
                  className="size-20 rounded-lg border border-border object-cover"
                />
              ))}
            </div>
          )}
        </div>

        <div>
          {producer && (
            <Link
              to="/producer/$id"
              params={{ id: producer.id }}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {producer.business_name}
              {producer.verification_status === "verified" && <VerifiedBadge />}
            </Link>
          )}
          <h1 className="mt-2 font-serif text-3xl font-semibold">{product.name}</h1>
          <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
            {product.category}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          <div className="mt-4">
            <DietaryTags tags={product.dietary_tags} />
          </div>

          <div className="ht-card mt-6 space-y-3 p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Tasting portion</span>
              <span className="font-serif text-2xl font-semibold">{money(product.price)}</span>
            </div>
            {product.is_tasting_available ? (
              <Button asChild className="w-full rounded-full">
                <Link to="/booking/$productId" params={{ productId: product.id }}>
                  Book a Tasting
                </Link>
              </Button>
            ) : (
              <Button disabled className="w-full rounded-full">
                Tastings not offered for this item
              </Button>
            )}
            <Button variant="outline" className="w-full rounded-full">
              Order Full Size — {money(product.full_order_price)}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Full orders are a concept preview in this demo.
            </p>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
