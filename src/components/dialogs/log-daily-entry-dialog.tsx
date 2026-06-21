import { useRef, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { CalendarIcon, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  "Material Received",
  "Labour Logged",
  "Payment",
  "Site Note",
] as const;

export function LogDailyEntryDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle>Add Daily Site Log</DialogTitle>
          <DialogDescription>
            Capture a new material, labour, payment or note for today's activity.
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
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label>Category</Label>
              <Select defaultValue="Material Received">
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
          </div>

          <div className="grid gap-2">
            <Label htmlFor="details">Item Details</Label>
            <Textarea
              id="details"
              rows={3}
              placeholder="e.g. 50 bags Lucky Cement (OPC)"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="vendor">Vendor / Thekedar</Label>
            <Input id="vendor" placeholder="e.g. Bilal Traders" list="vendor-suggestions" />
            <datalist id="vendor-suggestions">
              <option value="Bilal Traders" />
              <option value="Ittefaq Steel" />
              <option value="Chenab Suppliers" />
              <option value="Sialkot Brick Kiln" />
              <option value="Thekedar Yousaf" />
              <option value="Thekedar Imran" />
            </datalist>
          </div>

          <div className="grid gap-2">
            <Label>Attach Receipt</Label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
                dragOver
                  ? "border-[color:var(--sre-blue)] bg-[color:var(--sre-blue)]/5"
                  : "border-border bg-secondary/40 hover:bg-secondary",
              )}
            >
              <UploadCloud className="h-5 w-5 text-muted-foreground" />
              {file ? (
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="truncate max-w-[280px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="rounded p-0.5 text-muted-foreground hover:bg-accent"
                    aria-label="Remove file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground">
                    Drag &amp; drop receipt, or{" "}
                    <span className="text-[color:var(--sre-blue)]">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG or PDF up to 10MB</p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
            Added By: <span className="font-medium text-foreground">A. Khan</span> (auto)
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]/90"
            >
              Save Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}