-- Fix infinite recursion in group_members SELECT policy

-- Create a security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(grp_id uuid, usr_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = grp_id
      AND user_id = usr_id
  )
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;

-- Create a policy that allows users to see their own memberships
CREATE POLICY "Users can view own group memberships" 
ON public.group_members 
FOR SELECT 
USING (user_id = auth.uid());

-- Create a policy that allows users to see other members in groups they belong to
CREATE POLICY "Users can view group members" 
ON public.group_members 
FOR SELECT 
USING (
  public.is_group_member(group_id, auth.uid())
);

-- Also fix the DELETE policy for group_members which has same issue
DROP POLICY IF EXISTS "Group admins can remove members" ON public.group_members;

-- Create a security definer function to check if user is group admin
CREATE OR REPLACE FUNCTION public.is_group_admin(grp_id uuid, usr_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = grp_id
      AND user_id = usr_id
      AND role = 'admin'
  )
$$;

CREATE POLICY "Group admins can remove members" 
ON public.group_members 
FOR DELETE 
USING (
  public.is_group_admin(group_id, auth.uid())
  OR user_id = auth.uid()
);

-- Fix the INSERT policy to use the new function
DROP POLICY IF EXISTS "Group creator and admins can add members" ON public.group_members;

CREATE POLICY "Group creator and admins can add members" 
ON public.group_members 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_id AND g.created_by = auth.uid()
  )
  OR
  public.is_group_admin(group_id, auth.uid())
);