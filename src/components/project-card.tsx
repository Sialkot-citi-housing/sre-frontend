import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { fmtPKR, type Project } from "@/lib/projects-data";

export function ProjectCard({ project }: { project: Project }) {
  const budgetPct = project.budget > 0 ? Math.min(100, (project.spent / project.budget) * 100) : 0;
  const timePct = project.dayTotal > 0 ? Math.min(100, (project.dayCurrent / project.dayTotal) * 100) : 0;

  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: project._id || project.id }}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--sre-blue)]/60 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-bold tracking-tight text-foreground">
            {project.plot} <span className="text-muted-foreground">— {project.size}</span>
          </div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{project.client}</div>
        </div>
        <Badge
          variant="outline"
          className={
            project.status === "completed"
              ? "border-transparent bg-secondary text-muted-foreground"
              : "border-transparent bg-[color:var(--sre-blue)]/10 text-[color:var(--sre-blue)] font-medium"
          }
        >
          {project.phase}
        </Badge>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Budget used</span>
            <span className="font-semibold tabular-nums text-foreground">
              {budgetPct.toFixed(1)}%
            </span>
          </div>
          <Progress value={budgetPct} className="mt-1.5 h-1" />
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
          <Progress value={timePct} className="mt-1.5 h-1" />
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

      <div className="mt-5 flex items-center justify-end pt-4 border-t border-border">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-[color:var(--sre-blue)]">
          View details
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}