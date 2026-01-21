-- Add additional profile fields for onboarding
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS work_sector TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Add constraint to check minimum age (15 years) via trigger
CREATE OR REPLACE FUNCTION check_minimum_age()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.birth_date IS NOT NULL AND 
     NEW.birth_date > (CURRENT_DATE - INTERVAL '15 years') THEN
    RAISE EXCEPTION 'User must be at least 15 years old';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_minimum_age_trigger ON public.profiles;
CREATE TRIGGER check_minimum_age_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION check_minimum_age();

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.status IS 'User status: student, worker, job_seeker, retired, other';
COMMENT ON COLUMN public.profiles.work_sector IS 'Work or study sector';
COMMENT ON COLUMN public.profiles.interests IS 'Array of user interests: politics, culture, sports, technology, etc.';