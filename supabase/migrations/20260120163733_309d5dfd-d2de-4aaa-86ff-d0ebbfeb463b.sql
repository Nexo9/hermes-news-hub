-- Fix infinite recursion in conversation_participants SELECT policy
-- The issue is the policy checks conversation_participants to verify access to conversation_participants

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;

-- Create a security definer function to check conversation membership
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = conv_id
      AND conversation_participants.user_id = is_conversation_participant.user_id
  )
$$;

-- Create a new SELECT policy using the security definer function
CREATE POLICY "Users can view conversation participants" 
ON public.conversation_participants 
FOR SELECT 
USING (
  public.is_conversation_participant(conversation_id, auth.uid())
);

-- Also need to allow users to view their own participant records for fetching conversations
-- This is a simpler alternative that avoids recursion
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;

CREATE POLICY "Users can view own participations" 
ON public.conversation_participants 
FOR SELECT 
USING (user_id = auth.uid());

-- Create a separate policy to allow viewing other participants in same conversation
-- using the security definer function
CREATE POLICY "Users can view other participants in their conversations" 
ON public.conversation_participants 
FOR SELECT 
USING (
  public.is_conversation_participant(conversation_id, auth.uid())
);