import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { projects } from "@/lib/projects-data";
import { NewProjectDialog } from "@/components/dialogs/new-project-dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Project Ledgers — SRE Construction Portal" },
      {
        name: "description",
        content:
          "Internal portfolio of active and completed construction projects for Sialkot Real Estate.",
      },
    ],
  }),
  component: ProjectsPortfolio,
});

function ProjectsPortfolio() {
  const active = projects.filter((p) => p.status === "active");
  const completed = projects.filter((p) => p.status === "completed");

  return (
    <AppShell
      title="Projects Portfolio"
      subtitle="Track every active build and review completed handovers"
    >
      <Tabs defaultValue="active" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="active" className="data-[state=active]:bg-[color:var(--sre-blue)] data-[state=active]:text-primary-foreground">
              Active Projects
              <span className="ml-2 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-semibold">
                {active.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-[color:var(--sre-blue)] data-[state=active]:text-primary-foreground">
              Completed History
              <span className="ml-2 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-semibold">
                {completed.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <NewProjectDialog
            trigger={
              <Button className="gap-1.5 bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]/90">
                <Plus className="h-4 w-4" /> New Project
              </Button>
            }
          />
        </div>

        <TabsContent value="active" className="mt-0">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {completed.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}