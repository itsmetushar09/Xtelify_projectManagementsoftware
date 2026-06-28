
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM (
  'super_admin','org_admin','project_manager','team_lead','developer','qa','client','guest'
);
CREATE TYPE public.project_status AS ENUM ('planning','active','on_hold','completed','archived');
CREATE TYPE public.project_priority AS ENUM ('low','medium','high','critical');
CREATE TYPE public.sprint_status AS ENUM ('planned','active','completed');
CREATE TYPE public.task_type AS ENUM ('epic','story','bug','task','subtask');
CREATE TYPE public.task_status AS ENUM ('backlog','todo','in_progress','code_review','qa_testing','done');
CREATE TYPE public.task_priority AS ENUM ('low','medium','high','urgent');

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  designation TEXT,
  department TEXT,
  skills TEXT[],
  experience_years INTEGER,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at helper
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- ORGANIZATIONS
-- =========================================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- ORGANIZATION MEMBERS
-- =========================================================
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'developer',
  invited_email TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Security definer helpers (avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_org_member(_user UUID, _org UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE user_id=_user AND organization_id=_org);
$$;
CREATE OR REPLACE FUNCTION public.has_org_role(_user UUID, _org UUID, _roles public.app_role[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE user_id=_user AND organization_id=_org AND role = ANY(_roles));
$$;
CREATE OR REPLACE FUNCTION public.is_org_owner(_user UUID, _org UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organizations WHERE id=_org AND owner_id=_user);
$$;

-- Org policies
CREATE POLICY "Members view their orgs" ON public.organizations FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR public.is_org_member(auth.uid(), id));
CREATE POLICY "Authenticated can create orgs" ON public.organizations FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update org" ON public.organizations FOR UPDATE TO authenticated
USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners delete org" ON public.organizations FOR DELETE TO authenticated
USING (owner_id = auth.uid());

-- Org member policies
CREATE POLICY "Members view org members" ON public.organization_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Owner/admin manage members" ON public.organization_members FOR ALL TO authenticated
USING (
  public.is_org_owner(auth.uid(), organization_id)
  OR public.has_org_role(auth.uid(), organization_id, ARRAY['super_admin','org_admin']::public.app_role[])
  OR user_id = auth.uid()
)
WITH CHECK (
  public.is_org_owner(auth.uid(), organization_id)
  OR public.has_org_role(auth.uid(), organization_id, ARRAY['super_admin','org_admin']::public.app_role[])
  OR user_id = auth.uid()
);

-- Auto-add owner as super_admin member
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'super_admin')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_org_created AFTER INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();

CREATE TRIGGER orgs_updated_at BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- PROJECTS
-- =========================================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  description TEXT,
  status public.project_status NOT NULL DEFAULT 'planning',
  priority public.project_priority NOT NULL DEFAULT 'medium',
  budget NUMERIC(14,2),
  start_date DATE,
  end_date DATE,
  client_name TEXT,
  color TEXT DEFAULT '#4F46E5',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view projects" ON public.projects FOR SELECT TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Admins/PMs manage projects" ON public.projects FOR ALL TO authenticated
USING (public.has_org_role(auth.uid(), organization_id, ARRAY['super_admin','org_admin','project_manager']::public.app_role[]))
WITH CHECK (public.has_org_role(auth.uid(), organization_id, ARRAY['super_admin','org_admin','project_manager']::public.app_role[]));

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- PROJECT MEMBERS (optional finer-grained)
-- =========================================================
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;
GRANT ALL ON public.project_members TO service_role;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view project members" ON public.project_members FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id=project_id AND public.is_org_member(auth.uid(), p.organization_id)));
CREATE POLICY "Org admins manage project members" ON public.project_members FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id=project_id AND public.has_org_role(auth.uid(), p.organization_id, ARRAY['super_admin','org_admin','project_manager']::public.app_role[])))
WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id=project_id AND public.has_org_role(auth.uid(), p.organization_id, ARRAY['super_admin','org_admin','project_manager']::public.app_role[])));

-- =========================================================
-- SPRINTS
-- =========================================================
CREATE TABLE public.sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  status public.sprint_status NOT NULL DEFAULT 'planned',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sprints TO authenticated;
GRANT ALL ON public.sprints TO service_role;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view sprints" ON public.sprints FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id=project_id AND public.is_org_member(auth.uid(), p.organization_id)));
CREATE POLICY "Org admins/PMs manage sprints" ON public.sprints FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id=project_id AND public.has_org_role(auth.uid(), p.organization_id, ARRAY['super_admin','org_admin','project_manager','team_lead']::public.app_role[])))
WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id=project_id AND public.has_org_role(auth.uid(), p.organization_id, ARRAY['super_admin','org_admin','project_manager','team_lead']::public.app_role[])));
CREATE TRIGGER sprints_updated_at BEFORE UPDATE ON public.sprints
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- TASKS
-- =========================================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  type public.task_type NOT NULL DEFAULT 'task',
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'backlog',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES auth.users(id),
  reporter_id UUID REFERENCES auth.users(id),
  due_date DATE,
  story_points INTEGER,
  labels TEXT[],
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view tasks" ON public.tasks FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id=project_id AND public.is_org_member(auth.uid(), p.organization_id)));
CREATE POLICY "Org members manage tasks" ON public.tasks FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id=project_id AND public.is_org_member(auth.uid(), p.organization_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id=project_id AND public.is_org_member(auth.uid(), p.organization_id)));
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_sprint ON public.tasks(sprint_id);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);

-- =========================================================
-- TASK COMMENTS
-- =========================================================
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_comments TO authenticated;
GRANT ALL ON public.task_comments TO service_role;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view comments" ON public.task_comments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.tasks t JOIN public.projects p ON p.id=t.project_id WHERE t.id=task_id AND public.is_org_member(auth.uid(), p.organization_id)));
CREATE POLICY "Members create comments" ON public.task_comments FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.tasks t JOIN public.projects p ON p.id=t.project_id WHERE t.id=task_id AND public.is_org_member(auth.uid(), p.organization_id)));
CREATE POLICY "Authors update/delete own comments" ON public.task_comments FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors delete own comments" ON public.task_comments FOR DELETE TO authenticated USING (author_id = auth.uid());

-- =========================================================
-- CHECKLIST ITEMS
-- =========================================================
CREATE TABLE public.task_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_checklist_items TO authenticated;
GRANT ALL ON public.task_checklist_items TO service_role;
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage checklist" ON public.task_checklist_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.tasks t JOIN public.projects p ON p.id=t.project_id WHERE t.id=task_id AND public.is_org_member(auth.uid(), p.organization_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.tasks t JOIN public.projects p ON p.id=t.project_id WHERE t.id=task_id AND public.is_org_member(auth.uid(), p.organization_id)));

-- =========================================================
-- TIME ENTRIES
-- =========================================================
CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_entries TO authenticated;
GRANT ALL ON public.time_entries TO service_role;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own time" ON public.time_entries FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Org admins view org time" ON public.time_entries FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id=project_id AND public.has_org_role(auth.uid(), p.organization_id, ARRAY['super_admin','org_admin','project_manager']::public.app_role[])));

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =========================================================
-- ACTIVITY LOGS
-- =========================================================
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view activity" ON public.activity_logs FOR SELECT TO authenticated
USING (organization_id IS NULL OR public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members write activity" ON public.activity_logs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
