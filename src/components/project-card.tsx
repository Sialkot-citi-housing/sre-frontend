import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { fmtPKR, type Project } from "@/lib/projects-data";

export function ProjectCard({ project }: { project: Project }) {
  const budgetPct = Math.min(100, (project.spent / project.budget) * 100);
  const timePct = Math.min(100, (project.dayCurrent / project.dayTotal) * 100);

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-[color:var(--sre-blue)]/30 hover:shadow-[0_8px_24px_-12px_rgba(25,88,185,0.25)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-bold tracking-tight text-foreground">
            {project.plot} <span className="text-muted-foreground">— {project.size}</span>
          </div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{project.client}</div>
        </div>
        <Badge
          className={
            project.status === "completed"
              ? "bg-secondary text-foreground hover:bg-secondary"
              : "bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]"
          }
        >
          {project.phase}
        </Badge>
      </div>

      {/* Body */}
      <div className="mt-5 space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Budget used</span>
            <span className="font-semibold tabular-nums text-foreground">
              {budgetPct.toFixed(1)}%
            </span>
          </div>
          <Progress value={budgetPct} className="mt-1.5 h-1.5" />
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" />
            <span>
              Spent <span className="font-semibold text-foreground">PKR {fmtPKR(project.spent)}</span> of{" "}
              PKR {fmtPKR(project.budget)}
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Timeline</span>
            <span className="font-semibold tabular-nums text-foreground">
              Day {project.dayCurrent}/{project.dayTotal}
            </span>
          </div>
          <Progress value={timePct} className="mt-1.5 h-1.5" />
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>
              {project.status === "completed"
                ? `Completed ${project.completedAt}`
                : `Started ${project.startedAt}`}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-border">
        <Button
          asChild
          className="w-full justify-between bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]/90"
        >
          <Link to="/projects/$projectId" params={{ projectId: project.id }}>
            View &amp; Manage Ledger
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}