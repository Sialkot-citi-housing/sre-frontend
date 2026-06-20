import { createFileRoute } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/receipts")({
  component: Receipts,
});

function Receipts() {
  return (
    <AppShell title="Vendor Receipts" subtitle="Centralised proof of procurement for every project">
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--sre-blue)]/10">
          <Receipt className="h-6 w-6 text-[color:var(--sre-blue)]" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-foreground">No receipts uploaded yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Snap or upload vendor receipts to attach them to material ledger entries.
        </p>
        <Button className="mt-5 bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]/90">
          Upload receipt
        </Button>
      </div>
    </AppShell>
  );
}