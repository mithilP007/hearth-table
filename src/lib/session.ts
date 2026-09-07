/**
 * Demo session store. This POC uses a mock sign-in (no real credentials):
 * the chosen role + profile id is kept in localStorage so every page can
 * behave like a signed-in customer or producer.
 */
import { useEffect, useState } from "react";

export type Role = "customer" | "producer";

export type DemoSession = {
  role: Role;
  profileId: string;
  name: string;
  email?: string;
  producerId?: string;
  dietary?: string[];
  zip?: string;
};

const KEY = "ht.session";

/** Seeded demo rows so the mock login always has real data behind it. */
export const DEMO_CUSTOMER_ID = "11111111-1111-4111-8111-111111111101";
export const DEMO_PRODUCER_PROFILE_ID = "11111111-1111-4111-8111-111111111102";
export const DEMO_PRODUCER_ID = "22222222-2222-4222-8222-222222222201";

export const demoCustomer: DemoSession = {
  role: "customer",
  profileId: DEMO_CUSTOMER_ID,
  name: "Demo Customer",
  email: "customer@hearthandtable.demo",
  dietary: ["Gluten-Free", "Vegetarian"],
  zip: "78702",
};

export const demoProducer: DemoSession = {
  role: "producer",
  profileId: DEMO_PRODUCER_PROFILE_ID,
  producerId: DEMO_PRODUCER_ID,
  name: "Vega Hearth Breads",
  email: "marisol@vegahearth.demo",
};

export function readSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DemoSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: DemoSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("ht-session"));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("ht-session"));
}

/** Reads the session after hydration so SSR and client markup agree. */
export function useSession() {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSession(readSession());
    sync();
    setReady(true);
    window.addEventListener("ht-session", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ht-session", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { session, ready };
}

/** Customer identity used for reads/writes; falls back to the seeded demo customer. */
export function currentCustomerId(session: DemoSession | null) {
  return session?.role === "customer" && session.profileId ? session.profileId : DEMO_CUSTOMER_ID;
}

export function currentProducerId(session: DemoSession | null) {
  return session?.producerId ?? DEMO_PRODUCER_ID;
}
