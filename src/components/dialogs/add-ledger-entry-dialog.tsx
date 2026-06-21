import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LEDGER_CATEGORIES = [
  "Bricks",
  "Cement",
  "Steel (Serya)",
  "Sand & Crush",
  "Labour",
  "Other",
] as const;

const UNITS = ["Pcs", "Bags", "Tons", "Trolly", "Days", "SqFt"] as const;

export function AddLedgerEntryDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Add Material to Ledger</DialogTitle>
          <DialogDescription>
            Procured, total and variance are calculated automatically from daily entries.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-5 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
        >
          <div className="grid gap-2">
            <Label>Ledger Category</Label>
            <Select defaultValue="Cement">
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {LEDGER_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="item-name">Item Name</Label>
            <Input id="item-name" placeholder="e.g. Tile Bond" required />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="qty">Required Quantity</Label>
              <Input id="qty" type="number" min={0} step="any" placeholder="50" required />
            </div>
            <div className="grid gap-2">
              <Label>Unit</Label>
              <Select defaultValue="Bags">
                <SelectTrigger>
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rate">Estimated Avg Rate (PKR)</Label>
            <Input id="rate" type="number" min={0} step="any" placeholder="1,340" required />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]/90"
            >
              Add to Ledger
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}