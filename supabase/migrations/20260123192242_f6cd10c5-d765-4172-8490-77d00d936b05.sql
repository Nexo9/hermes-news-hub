-- Add read receipts and typing indicators to messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create table for real-time presence (typing/recording indicators)
CREATE TABLE IF NOT EXISTS public.conversation_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_presence UNIQUE (conversation_id, user_id)
);

-- Enable RLS on conversation_presence
ALTER TABLE public.conversation_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_presence
CREATE POLICY "Users can view presence in their conversations"
  ON public.conversation_presence
  FOR SELECT
  USING (is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Users can update their own presence"
  ON public.conversation_presence
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_presence;

-- Add RLS policy for updating read_at on messages
CREATE POLICY "Users can mark messages as read"
  ON public.messages
  FOR UPDATE
  USING (is_conversation_participant(conversation_id, auth.uid()))
  WITH CHECK (is_conversation_participant(conversation_id, auth.uid()));

-- Link groups to conversations system
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON public.messages(read_at);
CREATE INDEX IF NOT EXISTS idx_presence_conversation ON public.conversation_presence(conversation_id);
CREATE INDEX IF NOT EXISTS idx_groups_conversation ON public.groups(conversation_id);