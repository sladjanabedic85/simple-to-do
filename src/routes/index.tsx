import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import type { Tables } from "@/integrations/supabase/types";

type Task = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  completedAt: number | null;
};

const MAX_TASK_LENGTH = 200;

const fromRow = (r: Tables<"tasks">): Task => ({
  id: r.id,
  text: r.text,
  completed: r.completed,
  createdAt: new Date(r.created_at).getTime(),
  completedAt: r.completed_at ? new Date(r.completed_at).getTime() : null,
});

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clarity — Your day, in one tidy column" },
      {
        name: "description",
        content:
          "A calm, modern to-do list. Add tasks, check them off, and keep a tidy record of what's done.",
      },
      { property: "og:title", content: "Clarity — Your day, in one tidy column" },
      {
        property: "og:description",
        content:
          "A calm, modern to-do list. Add tasks, check them off, and keep a tidy record of what's done.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draft, setDraft] = useState("");
  const [greeting, setGreeting] = useState("Welcome back");
  const [dateLine, setDateLine] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    const now = new Date();
    const hour = now.getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
    setDateLine(now.toLocaleDateString([], { weekday: "long" }) + ", " + now.getDate());
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      return undefined;
    }
    supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          toast.error("Couldn't load your tasks");
          return;
        }
        setTasks((data ?? []).map(fromRow));
      });
    return undefined;
  }, [user]);

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const addTask = async () => {
    const text = draft.trim().slice(0, MAX_TASK_LENGTH);
    if (!text) return;
    setDraft("");
    const { data, error } = await supabase.from("tasks").insert({ text }).select().single();
    if (error || !data) {
      toast.error("Couldn't save the task");
      return;
    }
    setTasks((prev) => [fromRow(data), ...prev]);
  };

  const toggleTask = async (id: string) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    const completed = !t.completed;
    const completedAt = completed ? Date.now() : null;
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, completed, completedAt } : x)));
    const { error } = await supabase
      .from("tasks")
      .update({ completed, completed_at: completedAt ? new Date(completedAt).toISOString() : null })
      .eq("id", id);
    if (error) {
      toast.error("Couldn't update the task");
      setTasks((prev) => prev.map((x) => (x.id === id ? t : x)));
    }
  };

  const deleteTask = async (id: string) => {
    const prevTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete the task");
      setTasks(prevTasks);
    }
  };

  const name = (user?.user_metadata?.['full_name'] as string | undefined)?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "";
  const initials = (name || "?").slice(0, 2).toUpperCase();

  if (!authReady) return <div className="min-h-screen" />;
  if (!user) return <AuthPanel />;

  return (
    <div className="relative min-h-screen overflow-hidden font-sans text-foreground">
      {/* Ambient glass glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-16 size-[420px] rounded-full bg-card/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-24 -right-20 size-[380px] rounded-full bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/3 size-[360px] rounded-full bg-success/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-card/50 shadow-chip backdrop-blur-xl">
              <span className="block size-4 rounded-[5px] bg-primary" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-none tracking-tight">Clarity</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">Plan the bright way</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {dateLine && (
              <div className="hidden text-right sm:block">
                <p className="text-xs font-semibold text-foreground/60">{dateLine}</p>
                <p className="text-[11px] font-medium text-muted-foreground">
                  {new Date().toLocaleDateString([], { month: "long", year: "numeric" })}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              title="Sign out"
              aria-label="Sign out"
              className="grid size-11 place-items-center rounded-2xl bg-card/50 text-sm font-bold text-primary shadow-chip backdrop-blur-xl transition hover:bg-card/80"
            >
              {initials}
            </button>
          </div>
        </header>

        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{greeting}{name ? `, ${name}` : ""}</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {activeTasks.length === 0 ? (
              <>All caught up — enjoy the calm.</>
            ) : (
              <>
                You have <span className="font-bold text-primary">{activeTasks.length}</span>{" "}
                {activeTasks.length === 1 ? "task" : "tasks"} to focus on today.
              </>
            )}
          </p>
        </div>

        {/* Add task */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTask();
          }}
          className="mb-6 flex flex-col gap-3 rounded-3xl border border-border bg-card/55 p-4 shadow-panel backdrop-blur-2xl sm:flex-row sm:items-center"
        >
          <input
            type="text"
            value={draft}
            maxLength={MAX_TASK_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a new task…"
            aria-label="New task"
            className="w-full flex-1 rounded-2xl border border-input bg-card/70 px-4 py-3.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/15"
          />
          <button
            type="submit"
            className="shrink-0 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-button transition hover:bg-primary/90 active:scale-[0.98]"
          >
            + Add task
          </button>
        </form>

        {/* Active tasks */}
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Today
            </h2>
            <span className="rounded-full bg-card/60 px-2.5 py-1 text-[11px] font-bold text-primary backdrop-blur-md">
              {activeTasks.length} active
            </span>
          </div>

          {activeTasks.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card/40 p-6 text-center text-sm font-medium text-muted-foreground backdrop-blur-xl">
              Nothing pending — add a task above to get started.
            </div>
          ) : (
            <ul className="space-y-3">
              {activeTasks.map((task) => (
                <li
                  key={task.id}
                  className="animate-task-in group flex items-center gap-4 rounded-2xl border border-border bg-card/55 p-4 shadow-float backdrop-blur-2xl transition hover:bg-card/75"
                >
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    aria-label={`Mark "${task.text}" complete`}
                    className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-primary/50 bg-card/70 transition hover:border-primary hover:bg-primary/10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{task.text}</p>
                    <p className="truncate text-xs font-medium text-muted-foreground">
                      Added {formatTime(task.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    aria-label={`Delete "${task.text}"`}
                    className="shrink-0 text-lg font-bold text-foreground/25 transition hover:text-destructive"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Completed tasks */}
        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Completed
            </h2>
            <span className="rounded-full bg-card/60 px-2.5 py-1 text-[11px] font-bold text-success backdrop-blur-md">
              {completedTasks.length} done
            </span>
          </div>

          {completedTasks.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card/30 p-6 text-center text-sm font-medium text-muted-foreground backdrop-blur-xl">
              Check off a task and it lands here.
            </div>
          ) : (
            <ul className="space-y-3">
              {completedTasks.map((task) => (
                <li
                  key={task.id}
                  className="animate-task-in flex items-center gap-4 rounded-2xl border border-border bg-card/40 p-4 backdrop-blur-xl"
                >
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    aria-label={`Restore "${task.text}" to active`}
                    className="grid size-6 shrink-0 place-items-center rounded-full bg-success text-[11px] font-bold text-success-foreground transition hover:brightness-110"
                  >
                    ✓
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground/50 line-through decoration-foreground/30">
                      {task.text}
                    </p>
                    <p className="truncate text-xs font-medium text-muted-foreground/70">
                      Completed {task.completedAt ? formatTime(task.completedAt) : "earlier"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    aria-label={`Delete "${task.text}"`}
                    className="shrink-0 text-lg font-bold text-foreground/20 transition hover:text-destructive"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function AuthPanel() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin },
          });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (mode === "signup") toast.success("Check your email to confirm your account");
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
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
              {mode === "signin" ? "Sign in to see your tasks" : "Create your account"}
            </p>
          </div>
        </div>
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
      </div>
    </div>
  );
}
