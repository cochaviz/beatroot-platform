-- Allow instructors to read all profiles
-- Create a function to safely check if user is instructor (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_instructor(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'instructor'
  );
END;
$$;

-- Create the policy using the safe function
CREATE POLICY "Instructors can read all profiles" 
ON public.profiles FOR SELECT 
USING (public.is_instructor(auth.uid()));