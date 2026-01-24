-- Completely disable RLS on conversations table to allow unrestricted access
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on conversations
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;

-- Re-enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create completely open policies - no restrictions at all
CREATE POLICY "Anyone can create conversations"
ON public.conversations
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can view conversations"
ON public.conversations
FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can update conversations"
ON public.conversations
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete conversations"
ON public.conversations
FOR DELETE
TO public
USING (true);