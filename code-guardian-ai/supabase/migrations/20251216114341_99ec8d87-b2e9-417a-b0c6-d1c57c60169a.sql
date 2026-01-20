-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create enum for scan severity
CREATE TYPE public.scan_severity AS ENUM ('critical', 'high', 'medium', 'low');

-- Create enum for issue type
CREATE TYPE public.issue_type AS ENUM ('vulnerability', 'bug', 'code_smell', 'performance');

-- Create enum for explanation level
CREATE TYPE public.explanation_level AS ENUM ('junior', 'senior', 'lead');

-- Create enum for subscription tier
CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'team', 'enterprise');

-- User roles table (security best practice - separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Profiles table for user settings
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  explanation_level explanation_level NOT NULL DEFAULT 'senior',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scan history table
CREATE TABLE public.scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code_hash TEXT NOT NULL,
  language TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  summary TEXT,
  issues_count INTEGER NOT NULL DEFAULT 0,
  critical_count INTEGER NOT NULL DEFAULT 0,
  high_count INTEGER NOT NULL DEFAULT 0,
  medium_count INTEGER NOT NULL DEFAULT 0,
  low_count INTEGER NOT NULL DEFAULT 0,
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  fixed_code TEXT,
  static_checks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- False positive feedback table
CREATE TABLE public.scan_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scan_id UUID REFERENCES public.scan_history(id) ON DELETE CASCADE NOT NULL,
  issue_title TEXT NOT NULL,
  issue_type issue_type NOT NULL,
  is_false_positive BOOLEAN NOT NULL DEFAULT false,
  feedback_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Usage tracking for pricing tiers
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  scans_this_month INTEGER NOT NULL DEFAULT 0,
  scans_limit INTEGER NOT NULL DEFAULT 10,
  billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT date_trunc('month', now()),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- GitHub integrations table
CREATE TABLE public.github_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  installation_id TEXT NOT NULL,
  access_token TEXT,
  repository_full_name TEXT NOT NULL,
  webhook_secret TEXT,
  block_on_critical BOOLEAN NOT NULL DEFAULT true,
  block_threshold INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, repository_full_name)
);

-- API keys table
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for scan_history
CREATE POLICY "Users can view their own scans"
ON public.scan_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scans"
ON public.scan_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scans"
ON public.scan_history FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for scan_feedback
CREATE POLICY "Users can view their own feedback"
ON public.scan_feedback FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
ON public.scan_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
ON public.scan_feedback FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view their own usage"
ON public.usage_tracking FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
ON public.usage_tracking FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
ON public.usage_tracking FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for github_integrations
CREATE POLICY "Users can view their own integrations"
ON public.github_integrations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own integrations"
ON public.github_integrations FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for api_keys
CREATE POLICY "Users can view their own API keys"
ON public.api_keys FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own API keys"
ON public.api_keys FOR ALL
USING (auth.uid() = user_id);

-- Function to auto-create profile and usage tracking on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.usage_tracking (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_github_integrations_updated_at
  BEFORE UPDATE ON public.github_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_scan_history_user_id ON public.scan_history(user_id);
CREATE INDEX idx_scan_history_created_at ON public.scan_history(created_at DESC);
CREATE INDEX idx_scan_feedback_scan_id ON public.scan_feedback(scan_id);
CREATE INDEX idx_usage_tracking_user_id ON public.usage_tracking(user_id);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);