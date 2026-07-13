export type ProjectStatus = "active" | "completed";

export type Project = {
  id: string;
  plot: string;
  size: string;
  phase: string;
  client: string;
  budget: number;
  spent: number;
  dayCurrent: number;
  dayTotal: number;
  status: ProjectStatus;
  startedAt: string;
  completedAt?: string;
};

export const projects: Project[] = [];

export const fmtPKR = (n: number) =>
  new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(n);