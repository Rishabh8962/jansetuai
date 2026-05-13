
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  issue_id TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  admin_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated citizens) can submit feedback
CREATE POLICY "Anyone can submit feedback"
  ON public.feedback
  FOR INSERT
  WITH CHECK (true);

-- Authorities can view + manage all feedback
CREATE POLICY "Authorities view all feedback"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'authority'::app_role));

CREATE POLICY "Authorities update feedback"
  ON public.feedback
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'authority'::app_role));

-- Users can view their own feedback
CREATE POLICY "Users view own feedback"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER feedback_touch_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_feedback_created_at ON public.feedback (created_at DESC);
CREATE INDEX idx_feedback_status ON public.feedback (status);
