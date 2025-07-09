-- supabase/migrations/0001_create_members.sql

-- 1. Table definition
CREATE TABLE public.members (
  email      TEXT       PRIMARY KEY,
  user_id    UUID       UNIQUE
               REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  uni_year   TEXT,
  phone      TEXT,
  role       TEXT       NOT NULL
               CHECK (role IN ('member','editor','admin'))
);

-- 2. Enable RLS
ALTER TABLE public.members
  ENABLE ROW LEVEL SECURITY;

-- 3. Helper functions (SECURITY DEFINER → bypass RLS)
CREATE OR REPLACE FUNCTION public.is_self(uid UUID, mem_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT uid IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.members
       WHERE user_id = uid
         AND email   = mem_email
    );
$$;

CREATE OR REPLACE FUNCTION public.has_role(uid UUID, wanted_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT uid IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.members
       WHERE user_id = uid
         AND role    = wanted_role
    );
$$;

CREATE OR REPLACE FUNCTION public.role_unchanged(uid UUID, mem_email TEXT, new_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT uid IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.members
       WHERE user_id = uid
         AND email   = mem_email
         AND role    = new_role
    );
$$;

-- 4. RLS Policies

-- A) Self can SELECT own record
CREATE POLICY "Self can read own profile"
  ON public.members
  FOR SELECT
  USING ( public.is_self(auth.uid(), email) );

-- B) Self can UPDATE own record (but cannot change role)
CREATE POLICY "Self can update own profile"
  ON public.members
  FOR UPDATE
  USING ( public.is_self(auth.uid(), email) )
  WITH CHECK (
    public.is_self(auth.uid(), email)
    AND public.role_unchanged(auth.uid(), email, role)
  );

-- C) Admins full access
CREATE POLICY "Admins full access to members"
  ON public.members
  FOR ALL
  USING ( public.has_role(auth.uid(), 'admin') )
  WITH CHECK ( public.has_role(auth.uid(), 'admin') );

-- 5. Trigger to link new auth.users → members (email match)
CREATE OR REPLACE FUNCTION public.link_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.members
     SET user_id   = NEW.id,
         joined_at = now()
   WHERE email     = NEW.email;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_confirmed_user
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.link_new_user();
