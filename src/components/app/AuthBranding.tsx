import { Sparkles, Rocket, Layers, Zap } from "lucide-react";

export function AuthBranding() {
  return (
    <div className="relative hidden overflow-hidden bg-foreground p-10 text-background lg:flex lg:flex-col">
      <div className="absolute inset-0 gradient-brand opacity-90" />
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 35%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.25), transparent 40%)",
        }}
      />
      <div className="relative flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 backdrop-blur">
          <Rocket className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight">TaskForge AI</div>
          <div className="text-[11px] uppercase tracking-wider opacity-70">Enterprise Edition</div>
        </div>
      </div>

      <div className="relative mt-auto max-w-md">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight">
          Ship faster with the AI-native project platform built for software teams.
        </h2>
        <p className="mt-4 text-sm leading-relaxed opacity-90">
          One workspace for projects, sprints, tasks, time, and team intelligence — with AI that
          plans, summarizes, and forecasts so engineers can focus on building.
        </p>
        <ul className="mt-8 space-y-3 text-sm">
          <li className="flex items-center gap-3">
            <Sparkles className="h-4 w-4" /> AI sprint planning & risk detection
          </li>
          <li className="flex items-center gap-3">
            <Layers className="h-4 w-4" /> Kanban, list, calendar, timeline & Gantt
          </li>
          <li className="flex items-center gap-3">
            <Zap className="h-4 w-4" /> Real-time collaboration & time tracking
          </li>
        </ul>
      </div>
    </div>
  );
}
