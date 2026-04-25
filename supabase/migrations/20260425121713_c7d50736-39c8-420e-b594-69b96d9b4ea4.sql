-- 1. Set search_path on the timestamp trigger function
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- 2. Replace the permissive notifications insert policy
DROP POLICY IF EXISTS "System inserts notifications" ON public.notifications;

CREATE POLICY "Users can self-notify or authorities broadcast"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    recipient_id = auth.uid()
    OR public.has_role(auth.uid(), 'authority')
    OR public.has_role(auth.uid(), 'worker')
  );