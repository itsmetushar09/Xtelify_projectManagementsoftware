import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  brief: z.string().min(1).max(4000),
  tool: z.string(),
});

const toolPrompts: Record<string, string> = {
  tasks:
    "You are a senior project manager. Convert the brief into a clean numbered list of tasks. For each, include: title, type (epic/story/bug/task), priority (low/medium/high/urgent), and estimated story points (1-13). Format clearly.",
  planner:
    "You are an agile sprint planner. Given the brief, propose a sprint allocation: goal, recommended duration, suggested tasks with story points, and capacity assumptions.",
  risk:
    "You are a project risk analyst. Given the brief, identify risks, delayed work, overloaded people, and recommend mitigations.",
  summary:
    "You are a chief of staff. Write a concise weekly progress summary from the brief — wins, blockers, what's next.",
};

export const generateTasksFromBrief = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    //const key = process.env.API_KEY;
    if (!key) throw new Error("AI is not configured");
    const system = toolPrompts[data.tool] ?? toolPrompts.tasks;

    const res = await fetch("https://ai.gateway.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: data.brief },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Rate limited. Please retry shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
    if (!res.ok) throw new Error(`AI error (${res.status})`);

    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content ?? "(no response)";
    return { text };
  });
