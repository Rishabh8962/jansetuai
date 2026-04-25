-- =========================================
-- Roles enum + user_roles table (security)
-- =========================================
CREATE TYPE public.app_role AS ENUM ('citizen', 'worker', 'authority');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security-definer role check (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authorities can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'authority'));

CREATE POLICY "Authorities can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'authority'))
  WITH CHECK (public.has_role(auth.uid(), 'authority'));

-- =========================================
-- Profiles
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  ward TEXT,
  phone TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  badges TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles readable by signed-in users"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =========================================
-- Departments
-- =========================================
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  head TEXT,
  contact TEXT,
  trust_score INTEGER NOT NULL DEFAULT 80,
  avg_resolution_time NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Departments readable by signed-in users"
  ON public.departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authorities manage departments"
  ON public.departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'authority'))
  WITH CHECK (public.has_role(auth.uid(), 'authority'));

-- =========================================
-- Workers
-- =========================================
CREATE TABLE public.workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','busy','offline')),
  active_tasks INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC NOT NULL DEFAULT 4.5,
  phone TEXT,
  ward TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers readable by signed-in users"
  ON public.workers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Worker self-update"
  ON public.workers FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authorities manage workers"
  ON public.workers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'authority'))
  WITH CHECK (public.has_role(auth.uid(), 'authority'));

-- =========================================
-- Complaints
-- =========================================
CREATE TYPE public.complaint_status AS ENUM (
  'submitted','assigned','in_progress','under_review','rework_required','completed'
);

CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id TEXT UNIQUE,
  citizen_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  citizen_name TEXT,
  category TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  lat NUMERIC,
  lng NUMERIC,
  ward TEXT,
  status public.complaint_status NOT NULL DEFAULT 'submitted',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  department TEXT,
  ai_confidence NUMERIC,
  ai_severity TEXT,
  ai_detected_category TEXT,
  ai_verification JSONB,
  worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  assigned_worker TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_time_hours NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_citizen ON public.complaints(citizen_id);
CREATE INDEX idx_complaints_worker ON public.complaints(worker_id);
CREATE INDEX idx_complaints_created ON public.complaints(created_at DESC);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Citizens read all (transparency), but only insert their own.
CREATE POLICY "Complaints readable by signed-in users"
  ON public.complaints FOR SELECT TO authenticated USING (true);

CREATE POLICY "Citizens insert own complaints"
  ON public.complaints FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = citizen_id);

CREATE POLICY "Workers update assigned complaints"
  ON public.complaints FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'worker')
    AND worker_id IN (SELECT id FROM public.workers WHERE user_id = auth.uid())
  );

CREATE POLICY "Authorities manage complaints"
  ON public.complaints FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'authority'))
  WITH CHECK (public.has_role(auth.uid(), 'authority'));

-- =========================================
-- Complaint events (timeline)
-- =========================================
CREATE TABLE public.complaint_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message TEXT,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_complaint ON public.complaint_events(complaint_id, created_at);
ALTER TABLE public.complaint_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events readable by signed-in users"
  ON public.complaint_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Workers add events for their tasks"
  ON public.complaint_events FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'worker')
    OR public.has_role(auth.uid(), 'authority')
    OR auth.uid() = actor_id
  );

CREATE POLICY "Authorities manage events"
  ON public.complaint_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'authority'))
  WITH CHECK (public.has_role(auth.uid(), 'authority'));

-- =========================================
-- Notifications
-- =========================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  audience TEXT NOT NULL CHECK (audience IN ('citizen','worker','authority')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifications_audience ON public.notifications(audience, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipients read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (
    recipient_id = auth.uid()
    OR (audience = 'authority' AND public.has_role(auth.uid(), 'authority'))
    OR (audience = 'worker' AND public.has_role(auth.uid(), 'worker') AND recipient_id IS NULL)
  );

CREATE POLICY "Recipients update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "System inserts notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- =========================================
-- Reviews (repair submissions)
-- =========================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  worker_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  repair_image_url TEXT,
  worker_notes TEXT,
  ai_verification JSONB,
  reviewed BOOLEAN NOT NULL DEFAULT false,
  approved BOOLEAN,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
CREATE INDEX idx_reviews_complaint ON public.reviews(complaint_id);
CREATE INDEX idx_reviews_pending ON public.reviews(reviewed, completed_at DESC);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews readable by signed-in users"
  ON public.reviews FOR SELECT TO authenticated USING (true);

CREATE POLICY "Workers submit own reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'worker') AND worker_user_id = auth.uid()
  );

CREATE POLICY "Authorities manage reviews"
  ON public.reviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'authority'))
  WITH CHECK (public.has_role(auth.uid(), 'authority'));

-- =========================================
-- Updated-at trigger
-- =========================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_complaints_updated BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================
-- Auto-create profile + citizen role on signup
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'citizen')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- Realtime
-- =========================================
ALTER TABLE public.complaints REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.reviews REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;