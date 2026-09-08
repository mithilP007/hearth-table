import { supabase } from "@/integrations/supabase/client";

/**
 * Loosely typed data access for the Hearth & Table demo tables.
 * Generated types lag behind the schema, so we use a permissive client here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;

export type VerificationStatus = "pending" | "verified" | "needs_attention";
export type TastingMode = "market_pickup" | "home_pickup" | "producer_delivery";
export type BookingStatus = "reserved" | "confirmed" | "ready" | "completed";

export type Producer = {
  id: string;
  profile_id: string | null;
  business_name: string;
  bio: string | null;
  cuisine_categories: string[];
  address: string | null;
  lat: number | null;
  lng: number | null;
  cover_image_url: string | null;
  verification_status: VerificationStatus;
  is_available_for_tastings: boolean;
};

export type Product = {
  id: string;
  producer_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  full_order_price: number;
  is_tasting_available: boolean;
  image_url: string | null;
  dietary_tags: string[];
  producers?: Producer | null;
};

export type Slot = {
  id: string;
  product_id: string;
  date: string;
  start_time: string;
  capacity: number;
  booked_count: number;
  is_available: boolean;
  products?: Product | null;
};

export type Booking = {
  id: string;
  customer_id: string | null;
  slot_id: string;
  booking_ref: string;
  tasting_mode: TastingMode;
  status: BookingStatus;
  qr_token: string | null;
  created_at: string;
  tasting_slots?: (Slot & { products?: (Product & { producers?: Producer | null }) | null }) | null;
  profiles?: { full_name: string | null } | null;
};

const PRODUCER_FIELDS =
  "id, profile_id, business_name, bio, cuisine_categories, address, lat, lng, cover_image_url, verification_status, is_available_for_tastings";

export const TASTING_MODE_LABEL: Record<TastingMode, string> = {
  market_pickup: "Pickup at Market",
  home_pickup: "Home Pickup",
  producer_delivery: "Producer Delivery",
};

export const STATUS_STEPS: BookingStatus[] = ["reserved", "confirmed", "ready", "completed"];

export async function fetchDiscoverProducers(): Promise<Producer[]> {
  const { data, error } = await db
    .from("producers")
    .select(PRODUCER_FIELDS)
    .eq("verification_status", "verified")
    .eq("is_available_for_tastings", true)
    .eq("is_deleted", false)
    .order("business_name");
  if (error) throw error;
  return (data ?? []) as Producer[];
}

export async function fetchProducer(id: string): Promise<Producer> {
  const { data, error } = await db.from("producers").select(PRODUCER_FIELDS).eq("id", id).single();
  if (error) throw error;
  return data as Producer;
}

export async function fetchProducerProducts(producerId: string): Promise<Product[]> {
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("producer_id", producerId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function fetchProduct(id: string): Promise<Product> {
  const { data, error } = await db
    .from("products")
    .select(`*, producers(${PRODUCER_FIELDS})`)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Product;
}

export async function fetchProductSlots(productId: string): Promise<Slot[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await db
    .from("tasting_slots")
    .select("*")
    .eq("product_id", productId)
    .gte("date", today)
    .order("date")
    .order("start_time");
  if (error) throw error;
  return (data ?? []) as Slot[];
}

export async function fetchProducerSlots(producerId: string): Promise<Slot[]> {
  const { data: products, error: pErr } = await db
    .from("products")
    .select("id, name")
    .eq("producer_id", producerId);
  if (pErr) throw pErr;
  const ids = (products ?? []).map((p: { id: string }) => p.id);
  if (!ids.length) return [];
  const { data, error } = await db
    .from("tasting_slots")
    .select("*, products(id, name, producer_id)")
    .in("product_id", ids)
    .gte("date", new Date().toISOString().slice(0, 10))
    .order("date")
    .order("start_time");
  if (error) throw error;
  return (data ?? []) as Slot[];
}

const BOOKING_SELECT = `*, profiles(full_name), tasting_slots(*, products(*, producers(${PRODUCER_FIELDS})))`;

export async function fetchCustomerBookings(customerId: string): Promise<Booking[]> {
  const { data, error } = await db
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Booking[];
}

export async function fetchBooking(id: string): Promise<Booking> {
  const { data, error } = await db.from("bookings").select(BOOKING_SELECT).eq("id", id).single();
  if (error) throw error;
  return data as Booking;
}

export async function fetchProducerBookings(producerId: string): Promise<Booking[]> {
  const { data: products, error: pErr } = await db
    .from("products")
    .select("id")
    .eq("producer_id", producerId);
  if (pErr) throw pErr;
  const productIds = (products ?? []).map((p: { id: string }) => p.id);
  if (!productIds.length) return [];
  const { data: slots, error: sErr } = await db
    .from("tasting_slots")
    .select("id")
    .in("product_id", productIds);
  if (sErr) throw sErr;
  const slotIds = (slots ?? []).map((s: { id: string }) => s.id);
  if (!slotIds.length) return [];
  const { data, error } = await db
    .from("bookings")
    .select(BOOKING_SELECT)
    .in("slot_id", slotIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Booking[];
}

export function makeBookingRef() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `HT-${out}`;
}

export function makeQrToken() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function formatTime(t: string) {
  const parts = t.split(":").map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatDate(d: string, opts?: Intl.DateTimeFormatOptions) {
  const date = new Date(`${d}T00:00:00`);
  return date.toLocaleDateString("en-US", opts ?? { weekday: "short", month: "short", day: "numeric" });
}

export function money(n: number | string | null | undefined) {
  const value = Number(n ?? 0);
  return `$${value.toFixed(2)}`;
}

/** Rough great-circle distance in miles. */
export function distanceMiles(
  a: { lat: number; lng: number },
  b: { lat: number | null; lng: number | null },
) {
  if (b.lat == null || b.lng == null) return null;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(Number(b.lat) - a.lat);
  const dLng = toRad(Number(b.lng) - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(Number(b.lat));
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

/** Austin, TX — default map centre when the customer has not shared location. */
export const DEFAULT_LOCATION = { lat: 30.2672, lng: -97.7431 };
