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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CONTRACTOR_ROLES = [
  "Thekadar",
  "Plumber",
  "Electrician",
  "Designer (Painter)",
  "Ceiling / Palling",
  "Other",
] as const;

const STATUSES = ["Active", "On hold", "Completed"] as const;

export function AddContractorDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add Contractor</DialogTitle>
          <DialogDescription>
            Assign a trade contractor to this project — payments will track against the agreed amount.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-5 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Role / Trade</Label>
              <Select defaultValue="Thekadar">
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACTOR_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select defaultValue="Active">
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="c-name">Contractor Name</Label>
              <Input id="c-name" placeholder="e.g. Yousaf Bhatti" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-phone">Contact Number</Label>
              <Input id="c-phone" type="tel" placeholder="0300-1234567" required />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="c-agreed">Agreed Amount (PKR)</Label>
              <Input id="c-agreed" type="number" min={0} step="any" placeholder="1,250,000" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-advance">Advance Paid (PKR)</Label>
              <Input id="c-advance" type="number" min={0} step="any" placeholder="0" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="c-scope">Scope of Work (optional)</Label>
            <Textarea id="c-scope" rows={3} placeholder="e.g. Full grey structure — ground + 1st floor" />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]/90"
            >
              Add Contractor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}