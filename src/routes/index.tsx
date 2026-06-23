import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — SRE Construction Portal" },
      {
        name: "description",
        content:
          "Secure sign in for Sialkot Real Estate construction managers, site engineers, and admins.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("a.khan@sre.pk");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sre_auth", "1");
    }
    setTimeout(() => navigate({ to: "/dashboard" }), 350);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[color:var(--sre-blue)]/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-[color:var(--sre-red)]/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-10 px-5 py-10 lg:grid-cols-2 lg:px-8">
        {/* Left — brand panel */}
        <div className="hidden flex-col justify-between lg:flex">
          <div className="flex items-center gap-3">
            <img src="/sre-logo.png" alt="Sialkot Real Estate" className="h-12 w-auto" />
            <div className="leading-tight">
              <div className="text-sm font-bold uppercase tracking-wider text-[color:var(--sre-red)]">
                Sialkot Real Estate
              </div>
              <div className="text-xs text-muted-foreground">Construction Portal</div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-black leading-tight text-foreground">
              Build smarter.
              <br />
              <span className="text-[color:var(--sre-blue)]">Track every brick.</span>
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              The internal command centre for project ledgers, smart quotations, daily site logs
              and vendor receipts across every active plot in Sialkot.
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { k: "12+", v: "Active plots" },
                { k: "PKR 84M", v: "Tracked spend" },
                { k: "99.8%", v: "Receipt match" },
              ].map((s) => (
                <div key={s.v} className="rounded-xl border border-border bg-card/70 p-3 backdrop-blur">
                  <div className="text-base font-bold text-foreground">{s.k}</div>
                  <div className="text-[11px] text-muted-foreground">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-[color:var(--sre-blue)]" />
            Encrypted session • Role-based access
          </div>
        </div>

        {/* Right — form card */}
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
            <img src="/sre-logo.png" alt="Sialkot Real Estate" className="h-10 w-auto" />
            <div className="text-sm font-bold uppercase tracking-wider text-[color:var(--sre-red)]">
              SRE Portal
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Welcome back</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to access your construction workspace
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-9"
                    placeholder="you@sre.pk"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider">
                    Password
                  </Label>
                  <button
                    type="button"
                    className="text-xs font-medium text-[color:var(--sre-blue)] hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 px-9"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox id="remember" defaultChecked />
                <span>Keep me signed in on this device</span>
              </label>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full bg-[color:var(--sre-blue)] text-base font-semibold text-primary-foreground hover:bg-[color:var(--sre-blue)]/90"
              >
                {loading ? "Signing in…" : "Sign in to Portal"}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Need an account? Contact your site admin at{" "}
              <span className="font-medium text-foreground">it@sre.pk</span>
            </p>
          </div>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Sialkot Real Estate. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}