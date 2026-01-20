-- Fix RLS policies for groups and group_members to allow proper creation flow

-- Drop the existing problematic policy for group_members insert
DROP POLICY IF EXISTS "Group admins can add members" ON public.group_members;

-- Create a new policy that allows:
-- 1. The group creator to add members (including themselves as admin)
-- 2. Existing group admins to add new members
CREATE POLICY "Group creator and admins can add members" 
ON public.group_members 
FOR INSERT 
WITH CHECK (
  -- Allow the group creator to add any members
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_id AND g.created_by = auth.uid()
  )
  OR
  -- Allow existing group admins to add members
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid() 
    AND gm.role = 'admin'
  )
);

-- Fix conversation_participants to allow viewing other participants in conversations you're in
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversation_participants;

CREATE POLICY "Users can view participants of their conversations" 
ON public.conversation_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id 
    AND cp.user_id = auth.uid()
  )
);

-- Add policy to allow viewing groups after creation (before being added as member)
DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.groups;

CREATE POLICY "Users can view their groups" 
ON public.groups 
FOR SELECT 
USING (
  created_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id = auth.uid()
  )
);

-- Fix conversations insert policy to require authentication
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY "Authenticated users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);