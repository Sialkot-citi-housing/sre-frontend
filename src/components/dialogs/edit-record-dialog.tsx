import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

export type EditField =
  | { key: string; label: string; type: "text" | "number" | "tel" | "date"; placeholder?: string; required?: boolean }
  | { key: string; label: string; type: "textarea"; placeholder?: string; rows?: number; required?: boolean }
  | { key: string; label: string; type: "select"; options: readonly string[]; required?: boolean; onChange?: (val: string, setField: (k: string, v: string | number) => void) => void };

export type EditValues = Record<string, string | number>;

export function EditRecordDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  values,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  fields: EditField[] | ((draft: EditValues) => EditField[]);
  values: EditValues | null;
  onSave: (next: EditValues) => void;
}) {
  const [draft, setDraft] = useState<EditValues>({});

  useEffect(() => {
    if (open && values) setDraft({ ...values });
  }, [open, values]);

  const setField = (k: string, v: string | number) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <form
          className="grid gap-4 py-2 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(draft);
            onOpenChange(false);
          }}
        >
          {(typeof fields === "function" ? fields(draft) : fields).map((f) => {
            const val = draft[f.key] ?? "";
            const spanFull =
              f.type === "textarea" ? "sm:col-span-2" : "sm:col-span-1";
            return (
              <div key={f.key} className={`grid gap-2 ${spanFull}`}>
                <Label htmlFor={`edit-${f.key}`}>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={`edit-${f.key}`}
                    rows={f.rows ?? 2}
                    placeholder={f.placeholder}
                    required={f.required}
                    value={String(val)}
                    onChange={(e) => setField(f.key, e.target.value)}
                  />
                ) : f.type === "select" ? (
                  <Select
                    value={String(val)}
                    onValueChange={(v) => {
                      setField(f.key, v);
                      f.onChange?.(v, setField);
                    }}
                  >
                    <SelectTrigger id={`edit-${f.key}`}>
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
                    id={`edit-${f.key}`}
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
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]/90"
            >
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}