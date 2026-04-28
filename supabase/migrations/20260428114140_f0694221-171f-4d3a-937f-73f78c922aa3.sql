
-- Feedback learning system: store user corrections to AI classifications
CREATE TABLE public.ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  complaint_id uuid,
  input_text text,
  image_url text,
  predicted_category text NOT NULL,
  predicted_confidence numeric,
  predicted_priority text,
  corrected_category text,
  corrected_priority text,
  was_correct boolean,
  reasoning jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can insert feedback"
  ON public.ai_feedback FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Feedback readable by signed-in users"
  ON public.ai_feedback FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authorities manage feedback"
  ON public.ai_feedback FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'authority'::app_role))
  WITH CHECK (has_role(auth.uid(), 'authority'::app_role));

CREATE INDEX idx_ai_feedback_category ON public.ai_feedback(predicted_category);
CREATE INDEX idx_ai_feedback_created ON public.ai_feedback(created_at DESC);
