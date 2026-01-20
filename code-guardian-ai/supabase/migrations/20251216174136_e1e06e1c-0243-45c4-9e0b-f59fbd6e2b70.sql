-- Create suppression rules table
CREATE TABLE public.suppression_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  issue_type text NOT NULL,
  issue_title text,
  scope text NOT NULL DEFAULT 'global' CHECK (scope IN ('file', 'repo', 'global')),
  file_path text,
  reason text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.suppression_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own suppressions" ON public.suppression_rules
  FOR ALL USING (auth.uid() = user_id);

-- Create security policies table (user-defined severity rules)
CREATE TABLE public.security_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name text NOT NULL DEFAULT 'Default Policy',
  max_critical INTEGER NOT NULL DEFAULT 0,
  max_high INTEGER NOT NULL DEFAULT 0,
  max_medium INTEGER NOT NULL DEFAULT 5,
  max_low INTEGER,
  ignore_paths text[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.security_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own policies" ON public.security_policies
  FOR ALL USING (auth.uid() = user_id);

-- Create scan baseline table
CREATE TABLE public.scan_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name text NOT NULL DEFAULT 'Default Baseline',
  baseline_scan_id UUID REFERENCES public.scan_history(id) ON DELETE SET NULL,
  issue_hashes text[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.scan_baselines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own baselines" ON public.scan_baselines
  FOR ALL USING (auth.uid() = user_id);

-- Create shared report links table
CREATE TABLE public.shared_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  scan_id UUID REFERENCES public.scan_history(id) ON DELETE CASCADE NOT NULL,
  share_token text NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own shared reports" ON public.shared_reports
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view shared reports by token" ON public.shared_reports
  FOR SELECT USING (true);

-- Add vulnerability hash and OWASP mapping to scan_history issues
-- Add columns for diff tracking
ALTER TABLE public.scan_history 
  ADD COLUMN IF NOT EXISTS vulnerability_hashes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS previous_scan_id UUID REFERENCES public.scan_history(id),
  ADD COLUMN IF NOT EXISTS new_issues_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_issues_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS policy_passed BOOLEAN,
  ADD COLUMN IF NOT EXISTS policy_id UUID REFERENCES public.security_policies(id);

-- Create trigger for security_policies updated_at
CREATE TRIGGER update_security_policies_updated_at
  BEFORE UPDATE ON public.security_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();