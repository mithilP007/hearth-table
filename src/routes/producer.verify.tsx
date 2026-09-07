import { useState, type DragEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/data";
import { currentProducerId, useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/producer/verify")({
  head: () => ({
    meta: [
      { title: "Verify your kitchen — Hearth & Table" },
      {
        name: "description",
        content:
          "Upload your state cottage food permit, food handler card and business ID so customers can see a verified badge.",
      },
      { property: "og:title", content: "Verify your kitchen — Hearth & Table" },
      { property: "og:description", content: "Verification usually takes two business days." },
    ],
  }),
  component: ProducerVerify,
});

const DOCS = [
  { type: "cottage_food_permit", label: "State Cottage Food Permit", required: true },
  { type: "food_handler_card", label: "Food Handler Card", required: true },
  { type: "business_id", label: "Business ID", required: false },
] as const;

function ProducerVerify() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [files, setFiles] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const requiredDone = DOCS.filter((d) => d.required).every((d) => files[d.type]);

  function accept(type: string, name: string) {
    setFiles((f) => ({ ...f, [type]: name }));
    toast.success(`${name} attached.`);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>, type: string) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) accept(type, file.name);
  }

  async function submit() {
    setSaving(true);
    try {
      const producerId = currentProducerId(session);
      const rows = Object.entries(files).map(([document_type, file_url]) => ({
        producer_id: producerId,
        document_type,
        file_url,
      }));
      if (rows.length) {
        const { error } = await db.from("verification_documents").insert(rows);
        if (error) throw error;
      }
      const { error: updateError } = await db
        .from("producers")
        .update({ verification_status: "pending" })
        .eq("id", producerId);
      if (updateError) throw updateError;
      setSubmitted(true);
      toast.success("Documents submitted for review.");
      setTimeout(() => navigate({ to: "/producer/dashboard" }), 1600);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit your documents.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-3 py-1 font-medium text-sage">
            <Check className="size-3" /> Account
          </span>
          <span className="h-px flex-1 bg-border" />
          <span
            className={cn(
              "rounded-full px-3 py-1 font-medium",
              submitted
                ? "bg-sage-soft text-sage"
                : "bg-terracotta text-primary-foreground",
            )}
          >
            Documents
          </span>
          <span className="h-px flex-1 bg-border" />
          <span
            className={cn(
              "rounded-full px-3 py-1",
              submitted ? "bg-amber-soft font-medium text-amber" : "border border-border",
            )}
          >
            Under Review
          </span>
        </div>

        <h1 className="font-serif text-3xl font-semibold">Verify your kitchen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customers only see producers whose paperwork checks out. Drag files in or browse.
        </p>

        {submitted ? (
          <div className="ht-card mt-6 border-l-4 border-l-amber p-6">
            <p className="font-serif text-xl font-semibold text-amber">Under Review</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Usually within 2 business days. We'll take you to your dashboard now.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-4">
              {DOCS.map((doc) => (
                <label
                  key={doc.type}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, doc.type)}
                  className={cn(
                    "ht-card flex cursor-pointer items-center gap-4 border-dashed p-5 transition-colors",
                    files[doc.type] ? "border-sage bg-sage-soft/40" : "hover:bg-cream-deep",
                  )}
                >
                  <span className="flex size-11 items-center justify-center rounded-full bg-cream text-terracotta">
                    {files[doc.type] ? <Check className="size-5 text-sage" /> : <FileUp className="size-5" />}
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium">
                      {doc.label}
                      {!doc.required && (
                        <span className="ml-2 text-xs text-muted-foreground">optional</span>
                      )}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {files[doc.type] ?? "Drag and drop a PDF or photo, or click to browse"}
                    </span>
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) accept(doc.type, file.name);
                    }}
                  />
                </label>
              ))}
            </div>

            <Button
              className="mt-6 w-full rounded-full"
              disabled={!requiredDone || saving}
              onClick={submit}
            >
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Submit for review
            </Button>
            {!requiredDone && (
              <p className="mt-2 text-center text-xs text-destructive">
                Attach your permit and food handler card to submit.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
