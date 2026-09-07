import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { ProducerShell } from "@/components/ht/ProducerShell";
import { DietaryTags } from "@/components/ht/badges";
import { CardSkeletonGrid, EmptyState } from "@/components/ht/states";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db, fetchProducerProducts, money, type Product } from "@/lib/data";
import { currentProducerId, useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/producer/products")({
  head: () => ({
    meta: [
      { title: "Your products — Hearth & Table" },
      {
        name: "description",
        content:
          "Add, edit and remove the cottage food items you offer, with tasting prices and dietary tags.",
      },
      { property: "og:title", content: "Your products — Hearth & Table" },
      { property: "og:description", content: "Manage your tasting catalogue." },
    ],
  }),
  component: ProducerProducts,
});

const CATEGORIES = ["Bread", "Pastry", "Dessert", "Jam", "Jelly", "Confection", "Chocolate", "Sauce", "Spice", "Pickle"];
const DIET = ["Gluten-Free", "Vegan", "Nut-Free", "Halal", "Kosher", "Vegetarian"];

type FormState = {
  name: string;
  description: string;
  category: string;
  price: string;
  full_order_price: string;
  image_url: string;
  dietary_tags: string[];
  is_tasting_available: boolean;
};

const EMPTY: FormState = {
  name: "",
  description: "",
  category: "Bread",
  price: "",
  full_order_price: "",
  image_url: "",
  dietary_tags: [],
  is_tasting_available: true,
};

function ProducerProducts() {
  const { session } = useSession();
  const producerId = currentProducerId(session);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const { data, isPending } = useQuery({
    queryKey: ["producer-products", producerId],
    queryFn: () => fetchProducerProducts(producerId),
  });

  const errors = {
    name: form.name.trim().length < 2 ? "Product name is required." : "",
    price: Number(form.price) > 0 ? "" : "Tasting price must be more than $0.",
    full: Number(form.full_order_price) > 0 ? "" : "Full order price must be more than $0.",
  };
  const valid = Object.values(errors).every((e) => !e);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        producer_id: producerId,
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        price: Number(form.price),
        full_order_price: Number(form.full_order_price),
        image_url: form.image_url.trim() || null,
        dietary_tags: form.dietary_tags,
        is_tasting_available: form.is_tasting_available,
      };
      const query = editing
        ? db.from("products").update(payload).eq("id", editing.id)
        : db.from("products").insert(payload);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-products", producerId] });
      toast.success(editing ? "Product updated." : "Product added.");
      setOpen(false);
      setEditing(null);
      setForm(EMPTY);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save the product."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-products", producerId] });
      toast.success("Product removed.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove the product."),
  });

  function startEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description ?? "",
      category: product.category ?? "Bread",
      price: String(product.price),
      full_order_price: String(product.full_order_price),
      image_url: product.image_url ?? "",
      dietary_tags: product.dietary_tags ?? [],
      is_tasting_available: product.is_tasting_available,
    });
    setOpen(true);
  }

  return (
    <ProducerShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            What customers can taste and order full size.
          </p>
        </div>
        <Button
          className="rounded-full"
          onClick={() => {
            setEditing(null);
            setForm(EMPTY);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" /> Add Product
        </Button>
      </div>

      <div className="mt-6">
        {isPending ? (
          <CardSkeletonGrid count={3} />
        ) : (data ?? []).length === 0 ? (
          <EmptyState
            icon={<Package className="size-7" aria-hidden />}
            title="No products yet"
            description="Add your first item to start offering tastings."
            action={
              <Button
                className="mt-1 rounded-full"
                onClick={() => {
                  setEditing(null);
                  setForm(EMPTY);
                  setOpen(true);
                }}
              >
                Add Product
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data ?? []).map((product) => (
              <div key={product.id} className="ht-card overflow-hidden">
                <img
                  src={product.image_url ?? ""}
                  alt={product.name}
                  loading="lazy"
                  className="h-36 w-full bg-cream-deep object-cover"
                />
                <div className="space-y-2 p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="font-serif text-base font-semibold">{product.name}</h2>
                    <span className="text-sm font-medium">{money(product.price)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Full size {money(product.full_order_price)} · {product.category}
                  </p>
                  <DietaryTags tags={product.dietary_tags} />
                  {product.is_tasting_available && (
                    <span className="inline-flex rounded-full bg-terracotta-soft px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
                      Tastings on
                    </span>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => startEdit(product)}
                    >
                      <Pencil className="mr-1.5 size-3.5" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-destructive"
                      onClick={() => remove.mutate(product.id)}
                    >
                      <Trash2 className="mr-1.5 size-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editing ? "Edit product" : "Add product"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="p-name">Name</Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={cn("mt-1.5 bg-cream", errors.name && "border-destructive")}
              />
              {errors.name && <p className="mt-1.5 text-xs text-destructive">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="p-desc">Description</Label>
              <Textarea
                id="p-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1.5 min-h-20 bg-cream"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger className="mt-1.5 bg-cream">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="p-img">Image URL</Label>
                <Input
                  id="p-img"
                  value={form.image_url}
                  placeholder="https://…"
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  className="mt-1.5 bg-cream"
                />
              </div>
              <div>
                <Label htmlFor="p-price">Tasting price ($)</Label>
                <Input
                  id="p-price"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className={cn("mt-1.5 bg-cream", errors.price && "border-destructive")}
                />
                {errors.price && <p className="mt-1.5 text-xs text-destructive">{errors.price}</p>}
              </div>
              <div>
                <Label htmlFor="p-full">Full order price ($)</Label>
                <Input
                  id="p-full"
                  inputMode="decimal"
                  value={form.full_order_price}
                  onChange={(e) => setForm((f) => ({ ...f, full_order_price: e.target.value }))}
                  className={cn("mt-1.5 bg-cream", errors.full && "border-destructive")}
                />
                {errors.full && <p className="mt-1.5 text-xs text-destructive">{errors.full}</p>}
              </div>
            </div>

            <div>
              <Label>Dietary tags</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {DIET.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        dietary_tags: f.dietary_tags.includes(tag)
                          ? f.dietary_tags.filter((t) => t !== tag)
                          : [...f.dietary_tags, tag],
                      }))
                    }
                    className={cn("ht-chip", form.dietary_tags.includes(tag) && "ht-chip-active")}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-cream px-4 py-3">
              <Label htmlFor="p-tasting" className="cursor-pointer">
                Available as tasting
              </Label>
              <Switch
                id="p-tasting"
                checked={form.is_tasting_available}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_tasting_available: v }))}
              />
            </div>

            <Button
              className="w-full rounded-full"
              disabled={!valid || save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editing ? "Save changes" : "Add product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ProducerShell>
  );
}
