import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export function AuthPanel() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) toast.error(error.message);
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSentTo(email);
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (res?.error) toast.error("Google sign-in failed");
  };

  const field =
    "w-full rounded-2xl border border-input bg-card/70 px-4 py-3.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/15";

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 font-sans text-foreground">
      <div aria-hidden="true" className="pointer-events-none absolute -top-32 -left-16 size-[420px] rounded-full bg-card/70 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute top-24 -right-20 size-[380px] rounded-full bg-primary/25 blur-3xl" />
      <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card/55 p-6 shadow-panel backdrop-blur-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-card/50 shadow-chip">
            <span className="block size-4 rounded-[5px] bg-primary" />
          </div>
          <div>
            <p className="text-base font-extrabold leading-none tracking-tight">Clarity</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {sentTo
                ? "One more step"
                : mode === "signin"
                  ? "Sign in to see your tasks"
                  : "Create your account"}
            </p>
          </div>
        </div>

        {sentTo ? (
          <div className="space-y-4 text-center">
            <h1 className="text-xl font-extrabold tracking-tight">Check your email</h1>
            <p className="text-sm font-medium text-muted-foreground">
              We sent a confirmation link to{" "}
              <span className="font-bold text-foreground">{sentTo}</span>. Click it to
              activate your account, then sign in to see your tasks.
            </p>
            <button
              type="button"
              onClick={() => {
                setSentTo(null);
                setMode("signin");
                setPassword("");
              }}
              className="w-full rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-button transition hover:bg-primary/90"
            >
              I've confirmed — sign in
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={google}
              className="mb-4 w-full rounded-2xl border border-input bg-card/80 px-4 py-3 text-sm font-bold transition hover:bg-card"
            >
              Continue with Google
            </button>
            <form onSubmit={submit} className="space-y-3">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" className={field} />
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" aria-label="Password" className={field} />
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-button transition hover:bg-primary/90 disabled:opacity-60"
              >
                {mode === "signin" ? "Sign in" : "Sign up"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-4 w-full text-center text-xs font-semibold text-muted-foreground hover:text-primary"
            >
              {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
