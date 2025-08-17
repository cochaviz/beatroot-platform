-- Fix infinite recursion in RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Instructors can view all profiles" ON public.profiles;

-- Drop policies from other tables that reference profiles
DROP POLICY IF EXISTS "Anyone can view published phases" ON public.phases;
DROP POLICY IF EXISTS "Instructors can manage phases" ON public.phases;
DROP POLICY IF EXISTS "Anyone can view sections" ON public.sections;
DROP POLICY IF EXISTS "Instructors can manage sections" ON public.sections;
DROP POLICY IF EXISTS "Anyone can view published modules" ON public.modules;
DROP POLICY IF EXISTS "Instructors can manage modules" ON public.modules;
DROP POLICY IF EXISTS "Users can view their own progress" ON public.module_progress;
DROP POLICY IF EXISTS "Users can manage their own progress" ON public.module_progress;
DROP POLICY IF EXISTS "Instructors can view all progress" ON public.module_progress;

-- Create simplified policies for profiles (no circular references)
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Only instructors can update profiles (including roles)
CREATE POLICY "Instructors can update profiles" 
ON public.profiles FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'instructor'
  )
);

-- Create policies for phases (simplified)
CREATE POLICY "Anyone can view phases" 
ON public.phases FOR SELECT 
USING (true);

CREATE POLICY "Instructors can manage phases" 
ON public.phases FOR ALL 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'instructor'
  )
);

-- Create policies for sections (simplified)
CREATE POLICY "Anyone can view sections" 
ON public.sections FOR SELECT 
USING (true);

CREATE POLICY "Instructors can manage sections" 
ON public.sections FOR ALL 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'instructor'
  )
);

-- Create policies for modules (simplified)
CREATE POLICY "Anyone can view published modules" 
ON public.modules FOR SELECT 
USING (is_published = true);

CREATE POLICY "Instructors can view all modules" 
ON public.modules FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'instructor'
  )
);

CREATE POLICY "Instructors can manage modules" 
ON public.modules FOR ALL 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'instructor'
  )
);

-- Create policies for module_progress (simplified)
CREATE POLICY "Users can view their own progress" 
ON public.module_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progress" 
ON public.module_progress FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Instructors can view all progress" 
ON public.module_progress FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'instructor'
  )
);
