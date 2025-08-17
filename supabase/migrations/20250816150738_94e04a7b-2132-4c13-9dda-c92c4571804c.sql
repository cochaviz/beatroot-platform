-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'instructor');

-- Create enum for module content types
CREATE TYPE content_type AS ENUM ('text', 'markdown', 'external_link', 'attachment');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create phases table
CREATE TABLE public.phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  phase_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sections table
CREATE TABLE public.sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID NOT NULL REFERENCES public.phases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  section_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create modules table
CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  content_type content_type NOT NULL DEFAULT 'markdown',
  external_url TEXT,
  module_order INTEGER NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create module_progress table
CREATE TABLE public.module_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Instructors can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'instructor'
  )
);

-- RLS Policies for phases
CREATE POLICY "Anyone can view published phases" 
ON public.phases FOR SELECT 
USING (true);

CREATE POLICY "Instructors can manage phases" 
ON public.phases FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'instructor'
  )
);

-- RLS Policies for sections
CREATE POLICY "Anyone can view sections" 
ON public.sections FOR SELECT 
USING (true);

CREATE POLICY "Instructors can manage sections" 
ON public.sections FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'instructor'
  )
);

-- RLS Policies for modules
CREATE POLICY "Anyone can view published modules" 
ON public.modules FOR SELECT 
USING (is_published = true OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'instructor'
  )
);

CREATE POLICY "Instructors can manage modules" 
ON public.modules FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'instructor'
  )
);

-- RLS Policies for module_progress
CREATE POLICY "Users can view their own progress" 
ON public.module_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progress" 
ON public.module_progress FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Instructors can view all progress" 
ON public.module_progress FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'instructor'
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_phases_updated_at
  BEFORE UPDATE ON public.phases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_module_progress_updated_at
  BEFORE UPDATE ON public.module_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data
INSERT INTO public.phases (title, description, phase_order) VALUES
('Foundation', 'Build a solid foundation in cybersecurity principles, ethical hacking techniques, and the tools of the trade.', 1),
('Real-World Practice', 'Put your skills to the test with real client work and comprehensive penetration testing scenarios.', 2);

INSERT INTO public.sections (phase_id, title, description, section_order) VALUES
((SELECT id FROM public.phases WHERE title = 'Foundation'), 'Web Application Security', 'Learn about common web vulnerabilities and exploitation techniques', 1),
((SELECT id FROM public.phases WHERE title = 'Foundation'), 'Network Security', 'Understanding network protocols and security assessment', 2),
((SELECT id FROM public.phases WHERE title = 'Real-World Practice'), 'Client Projects', 'Work on real penetration testing assignments', 1),
((SELECT id FROM public.phases WHERE title = 'Real-World Practice'), 'Reporting & Communication', 'Professional reporting and client communication skills', 2);

INSERT INTO public.modules (section_id, title, description, content, module_order, deadline, is_published) VALUES
((SELECT id FROM public.sections WHERE title = 'Web Application Security'), 'SQL Injection Fundamentals', 'Understanding and exploiting SQL injection vulnerabilities', '# SQL Injection Fundamentals

## What is SQL Injection?

SQL injection is a code injection technique that might destroy your database. SQL injection is one of the most common web hacking techniques.

## Types of SQL Injection

1. **Classic SQL Injection**
2. **Blind SQL Injection** 
3. **Time-based SQL Injection**

## Practice Labs

Complete the following exercises in our lab environment...', 1, now() + interval '7 days', true),
((SELECT id FROM public.sections WHERE title = 'Web Application Security'), 'Cross-Site Scripting (XSS)', 'Learn about XSS vulnerabilities and prevention', '# Cross-Site Scripting (XSS)

## Overview

Cross-Site Scripting (XSS) attacks are a type of injection attack...

## Types of XSS

- Stored XSS
- Reflected XSS  
- DOM-based XSS', 2, now() + interval '14 days', true);