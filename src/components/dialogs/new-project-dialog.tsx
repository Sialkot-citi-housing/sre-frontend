import { useState, type ReactNode } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PHASES = ["Foundation", "Grey Structure", "Finishing", "Handover"] as const;

export function NewProjectDialog({ trigger }: { trigger: ReactNode }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [plot, setPlot] = useState("");
  const [size, setSize] = useState("");
  const [client, setClient] = useState("");
  const [phase, setPhase] = useState("Foundation");
  const [advance, setAdvance] = useState("");

  const { mutate: createProject, isPending } = useMutation({
    mutationFn: async () => {
      // Create the project
      const projectData = {
        plot,
        size: size || "N/A", // size was missing in UI
        client,
        phase,
        startedAt: date ? format(date, "dd MMM yyyy") : format(new Date(), "dd MMM yyyy"),
        budget: 0,
      };
      const project = await api.createProject(projectData);

      // If there's an advance payment, record it
      if (advance && Number(advance) > 0) {
        await api.addCustomerPayment({
          project: project._id,
          date: projectData.startedAt,
          amount: Number(advance),
          method: "Bank Transfer", // default
          note: "Booking / start advance",
        });
      }
      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created successfully!");
      setOpen(false);
      // Reset form
      setPlot("");
      setSize("");
      setClient("");
      setAdvance("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create project");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plot || !client) return;
    createProject();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Create New Project Workspace</DialogTitle>
          <DialogDescription>
            Spin up a new plot ledger. You can add materials and entries right after.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5 py-2" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="plot">Plot / Project Title</Label>
              <Input id="plot" value={plot} onChange={(e) => setPlot(e.target.value)} placeholder="Plot 142" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="size">Size</Label>
              <Input id="size" value={size} onChange={(e) => setSize(e.target.value)} placeholder="10 Marla" required />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="client">Client Name</Label>
            <Input id="client" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Mr. Imran Sheikh" required />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Current Phase</Label>
              <Select value={phase} onValueChange={setPhase}>
                <SelectTrigger>
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  {PHASES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Start Date</Label>
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
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="advance">Advance Received from Client (PKR)</Label>
              <Input id="advance" value={advance} onChange={(e) => setAdvance(e.target.value)} type="number" min={0} placeholder="3000000" />
              <p className="text-xs text-muted-foreground">
                Amount received at project start.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}