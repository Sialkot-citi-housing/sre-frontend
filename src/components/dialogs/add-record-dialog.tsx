import { useEffect, useState, type ReactNode } from "react";
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
import type { EditField, EditValues } from "./edit-record-dialog";

export function AddRecordDialog({
  trigger,
  title,
  description,
  fields,
  defaults,
  submitLabel = "Add",
  onSubmit,
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  fields: EditField[] | ((draft: EditValues) => EditField[]);
  defaults: EditValues;
  submitLabel?: string;
  onSubmit: (values: EditValues) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<EditValues>(defaults);

  useEffect(() => {
    if (open) setDraft({ ...defaults });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setField = (k: string, v: string | number) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <form
          className="grid gap-4 py-2 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(draft);
            setOpen(false);
          }}
        >
          {(typeof fields === "function" ? fields(draft) : fields).map((f) => {
            const val = draft[f.key] ?? "";
            const spanFull =
              f.type === "textarea" ? "sm:col-span-2" : "sm:col-span-1";
            return (
              <div key={f.key} className={`grid gap-2 ${spanFull}`}>
                <Label htmlFor={`add-${f.key}`}>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={`add-${f.key}`}
                    rows={f.rows ?? 2}
                    placeholder={f.placeholder}
                    required={f.required}
                    value={String(val)}
                    onChange={(e) => setField(f.key, e.target.value)}
                  />
                ) : f.type === "select" ? (
                  <Select
                    value={String(val)}
                    onValueChange={(v) => setField(f.key, v)}
                  >
                    <SelectTrigger id={`add-${f.key}`}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={`add-${f.key}`}
                    type={f.type}
                    placeholder={f.placeholder}
                    required={f.required}
                    value={String(val)}
                    onChange={(e) =>
                      setField(
                        f.key,
                        f.type === "number"
                          ? e.target.value === ""
                            ? ""
                            : Number(e.target.value)
                          : e.target.value,
                      )
                    }
                  />
                )}
              </div>
            );
          })}

          <DialogFooter className="gap-2 pt-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]/90"
            >
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}