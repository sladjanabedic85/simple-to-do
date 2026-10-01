CREATE TABLE public.tasks (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL DEFAULT auth.uid(), text TEXT NOT NULL, completed BOOLEAN NOT NULL DEFAULT false, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON public.tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX tasks_user_idx ON public.tasks(user_id, created_at DESC);