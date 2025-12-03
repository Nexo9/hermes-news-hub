-- Fix conversation_participants RLS policy to allow adding other users when creating a conversation
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;

CREATE POLICY "Users can add participants to their conversations" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM conversation_participants cp 
    WHERE cp.conversation_id = conversation_participants.conversation_id 
    AND cp.user_id = auth.uid()
  )
  OR 
  NOT EXISTS (
    SELECT 1 FROM conversation_participants cp 
    WHERE cp.conversation_id = conversation_participants.conversation_id
  )
);

-- Fix group_members RLS policy to allow creator to add initial members
DROP POLICY IF EXISTS "Group admins can add members" ON public.group_members;

CREATE POLICY "Group admins can add members" 
ON public.group_members 
FOR INSERT 
WITH CHECK (
  -- User is admin of the group
  EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid() 
    AND gm.role = 'admin'
  )
  OR 
  -- User is the creator adding themselves as first admin
  (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM groups g 
    WHERE g.id = group_members.group_id 
    AND g.created_by = auth.uid()
  ))
  OR
  -- User is the creator of the group adding other members (no members exist yet or user is already admin)
  EXISTS (
    SELECT 1 FROM groups g 
    WHERE g.id = group_members.group_id 
    AND g.created_by = auth.uid()
  )
);