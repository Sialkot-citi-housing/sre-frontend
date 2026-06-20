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

export const projects: Project[] = [
  {
    id: "plot-142",
    plot: "Plot 142",
    size: "10 Marla",
    phase: "Grey Structure",
    client: "Mr. Imran Sheikh",
    budget: 4220000,
    spent: 4032900,
    dayCurrent: 64,
    dayTotal: 110,
    status: "active",
    startedAt: "14 Mar 2026",
  },
  {
    id: "plot-27",
    plot: "Plot 27",
    size: "5 Marla",
    phase: "Finishing",
    client: "Mrs. Sana Tariq",
    budget: 2680000,
    spent: 1908500,
    dayCurrent: 82,
    dayTotal: 140,
    status: "active",
    startedAt: "02 Feb 2026",
  },
  {
    id: "plot-88",
    plot: "Plot 88",
    size: "1 Kanal",
    phase: "Foundation",
    client: "Sheikh Group",
    budget: 14250000,
    spent: 2845000,
    dayCurrent: 18,
    dayTotal: 220,
    status: "active",
    startedAt: "29 May 2026",
  },
  {
    id: "plot-204",
    plot: "Plot 204",
    size: "7 Marla",
    phase: "Grey Structure",
    client: "Mr. Faisal Awan",
    budget: 3150000,
    spent: 2620000,
    dayCurrent: 55,
    dayTotal: 120,
    status: "active",
    startedAt: "20 Apr 2026",
  },
  {
    id: "plot-71",
    plot: "Plot 71",
    size: "10 Marla",
    phase: "Handover",
    client: "Mr. Adeel Raza",
    budget: 4180000,
    spent: 4095200,
    dayCurrent: 132,
    dayTotal: 132,
    status: "completed",
    startedAt: "10 Sep 2025",
    completedAt: "20 Jan 2026",
  },
  {
    id: "plot-19",
    plot: "Plot 19",
    size: "5 Marla",
    phase: "Handover",
    client: "Mr. Bilal Hussain",
    budget: 2510000,
    spent: 2487000,
    dayCurrent: 118,
    dayTotal: 118,
    status: "completed",
    startedAt: "01 Jun 2025",
    completedAt: "27 Sep 2025",
  },
];

export const fmtPKR = (n: number) =>
  new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(n);