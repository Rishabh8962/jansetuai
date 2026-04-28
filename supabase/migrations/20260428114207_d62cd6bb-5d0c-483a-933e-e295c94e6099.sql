
DROP POLICY IF EXISTS "Anyone authenticated can insert feedback" ON public.ai_feedback;

CREATE POLICY "Users insert own feedback"
  ON public.ai_feedback FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
