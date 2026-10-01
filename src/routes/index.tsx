import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type Task = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  completedAt: number | null;
};

const STORAGE_KEY = "clarity.tasks.v1";
const MAX_TASK_LENGTH = 200;

const seedTasks = (): Task[] => [
  {
    id: "seed-1",
    text: "Finalize Q2 launch checklist",
    completed: false,
    createdAt: Date.now() - 1000 * 60 * 90,
    completedAt: null,
  },
  {
    id: "seed-2",
    text: "Review onboarding flow copy",
    completed: false,
    createdAt: Date.now() - 1000 * 60 * 60,
    completedAt: null,
  },
  {
    id: "seed-3",
    text: "Book flights for the Lisbon offsite",
    completed: false,
    createdAt: Date.now() - 1000 * 60 * 30,
    completedAt: null,
  },
  {
    id: "seed-4",
    text: "Send invoice to Northwind Studio",
    completed: true,
    createdAt: Date.now() - 1000 * 60 * 300,
    completedAt: Date.now() - 1000 * 60 * 120,
  },
  {
    id: "seed-5",
    text: "Update team standup notes",
    completed: true,
    createdAt: Date.now() - 1000 * 60 * 400,
    completedAt: Date.now() - 1000 * 60 * 260,
  },
];

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draft, setDraft] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [greeting, setGreeting] = useState("Welcome back");
  const [dateLine, setDateLine] = useState("");

  // Load persisted tasks after mount (keeps SSR output stable).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Task[];
        if (Array.isArray(parsed)) {
          setTasks(
            parsed.filter(
              (t) =>
                typeof t?.id === "string" &&
                typeof t?.text === "string" &&
                typeof t?.completed === "boolean",
            ),
          );
        }
      } else {
        setTasks(seedTasks());
      }
    } catch {
      setTasks(seedTasks());
    }
    setHydrated(true);

    const now = new Date();
    const hour = now.getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
    setDateLine(
      now.toLocaleDateString([], { weekday: "long" }) +
        ", " +
        now.getDate(),
    );
  }, []);

  // Persist on every change.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Storage unavailable — the app still works for the session.
    }
  }, [tasks, hydrated]);

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const addTask = () => {
    const text = draft.trim().slice(0, MAX_TASK_LENGTH);
    if (!text) return;
    setTasks((prev) => [
      { id: crypto.randomUUID(), text, completed: false, createdAt: Date.now(), completedAt: null },
      ...prev,
    ]);
    setDraft("");
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : null }
          : t,
      ),
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

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
            <div className="grid size-11 place-items-center rounded-2xl bg-card/50 text-sm font-bold text-primary shadow-chip backdrop-blur-xl">
              AK
            </div>
          </div>
        </header>

        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{greeting}, Ava</h1>
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
