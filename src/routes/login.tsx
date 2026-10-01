import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthPanel } from "@/components/AuthPanel";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign up or sign in — Clarity" },
      {
        name: "description",
        content: "Create your Clarity account or sign in to sync your to-do list across devices.",
      },
      { property: "og:title", content: "Sign up or sign in — Clarity" },
      {
        property: "og:description",
        content: "Create your Clarity account or sign in to sync your to-do list across devices.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  return <AuthPanel />;
}
