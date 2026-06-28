import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Rocket } from "lucide-react";
import { AuthBranding } from "@/components/app/AuthBranding";

export const Route = createFileRoute("/auth/signup")({
  ssr: false,
  component: SignupPage,
});

const schema = z.object({
  fullName: z.string().min(2, "Enter your name").max(80),
  email: z.string().email(),
  password: z.string().min(8, "Min 8 characters"),
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parse = schema.safeParse({ fullName, email, password });
    if (!parse.success) {
      toast.error(parse.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Welcome to TaskForge AI!");
      navigate({ to: "/onboarding" });
    } else {
      toast.success("Check your email to confirm your account.");
      navigate({ to: "/auth/login" });
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBranding />
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="grid h-8 w-8 place-items-center rounded-lg gradient-brand text-primary-foreground">
              <Rocket className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold">TaskForge AI</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start managing your team's work in minutes.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth/login" className="font-medium text-foreground hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
