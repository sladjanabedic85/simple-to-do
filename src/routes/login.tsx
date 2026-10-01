import { createFileRoute, redirect } from "@tanstack/react-router";

// /login simply forwards to the main page, which shows the sign-in
// screen when you're signed out (and your tasks when signed in).
export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Clarity" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
