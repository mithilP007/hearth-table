import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { LogOut, User } from "lucide-react";
import { CustomerShell } from "@/components/ht/CustomerShell";
import { Button } from "@/components/ui/button";
import { clearSession, demoCustomer, saveSession, useSession } from "@/lib/session";

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

function ProfilePage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const person = session ?? demoCustomer;

  return (
    <CustomerShell>
      <h1 className="font-serif text-3xl font-semibold">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">Demo account details.</p>

      <div className="mt-6 max-w-xl space-y-4">
        <div className="ht-card flex items-center gap-4 p-5">
          <span className="flex size-14 items-center justify-center rounded-full bg-cream text-terracotta">
            <User className="size-6" aria-hidden />
          </span>
          <div>
            <p className="font-serif text-lg font-semibold">{person.name}</p>
            <p className="text-sm text-muted-foreground">
              {person.email ?? "customer@hearthandtable.demo"}
            </p>
          </div>
        </div>

        <div className="ht-card p-5">
          <h2 className="text-sm font-semibold">Dietary preferences</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(person.dietary?.length ? person.dietary : ["No preferences set"]).map((tag) => (
              <span key={tag} className="ht-chip cursor-default">
                {tag}
              </span>
            ))}
          </div>
          {person.zip && (
            <p className="mt-4 text-sm text-muted-foreground">Searching near ZIP {person.zip}</p>
          )}
        </div>

        <div className="ht-card space-y-3 p-5">
          <h2 className="text-sm font-semibold">Demo sign-in</h2>
          <p className="text-sm text-muted-foreground">
            Switch between the sample customer and producer accounts at any time.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                saveSession(demoCustomer);
                toast.success("Signed in as the demo customer.");
              }}
            >
              Use demo customer
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
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
