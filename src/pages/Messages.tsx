import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatView } from "@/components/messaging/ChatView";
import { EmptyChat } from "@/components/messaging/EmptyChat";
import { CreateGroupDialog } from "@/components/messaging/CreateGroupDialog";
import { SystemMessagesPanel } from "@/components/SystemMessagesPanel";
import { 
  Conversation, 
  Message, 
  Friend, 
  Group, 
  PresenceStatus 
} from "@/components/messaging/types";
import { cn } from "@/lib/utils";

const Messages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // User state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // UI state
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Presence state
  const [presenceStatuses, setPresenceStatuses] = useState<PresenceStatus[]>([]);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Initialize user
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setCurrentUserId(user.id);
      setLoading(false);
    };
    checkUser();
  }, [navigate]);

  // Fetch data when user is set
  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
      fetchFriends();
      fetchGroups();
    }
  }, [currentUserId]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchConversations();
          if (selectedConversation) {
            fetchMessages(selectedConversation.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, selectedConversation]);

  // Subscribe to presence updates
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`presence:${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_presence',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        async () => {
          await fetchPresence(selectedConversation.id);
        }
      )
      .subscribe();

    fetchPresence(selectedConversation.id);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id]);

  // Mark messages as read
  useEffect(() => {
    if (selectedConversation && currentUserId && messages.length > 0) {
      markMessagesAsRead();
    }
  }, [selectedConversation, messages, currentUserId]);

  const fetchFriends = async () => {
    if (!currentUserId) return;

    const { data: following } = await supabase
      .from("subscriptions")
      .select("following_id")
      .eq("follower_id", currentUserId);

    const { data: followers } = await supabase
      .from("subscriptions")
      .select("follower_id")
      .eq("following_id", currentUserId);

    if (following && followers) {
      const followingIds = following.map((f) => f.following_id);
      const followerIds = followers.map((f) => f.follower_id);
      const mutualIds = followingIds.filter((id) => followerIds.includes(id));

      if (mutualIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, bio")
          .in("id", mutualIds);

        if (profiles) {
          setFriends(profiles);
        }
      }
    }
  };

  const fetchGroups = async () => {
    if (!currentUserId) return;

    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", currentUserId);

    if (memberships && memberships.length > 0) {
      const groupIds = memberships.map((m) => m.group_id);

      const { data: groupsData } = await supabase
        .from("groups")
        .select("id, name, image_url, conversation_id")
        .in("id", groupIds);

      if (groupsData) {
        const groupsWithCounts = await Promise.all(
          groupsData.map(async (group) => {
            const { count } = await supabase
              .from("group_members")
              .select("*", { count: "exact", head: true })
              .eq("group_id", group.id);

            return {
              ...group,
              member_count: count || 0,
            };
          })
        );

        setGroups(groupsWithCounts as Group[]);
      }
    }
  };

  const fetchConversations = async () => {
    if (!currentUserId) return;

    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('conversation_id, conversations(id, updated_at)')
      .eq('user_id', currentUserId);

    if (!participants || participants.length === 0) {
      setConversations([]);
      return;
    }

    const conversationIds = participants.map((p) => p.conversation_id);

    // Check which conversations are group conversations
    const { data: groupConvs } = await supabase
      .from('groups')
      .select('conversation_id, name, image_url')
      .in('conversation_id', conversationIds);

    const groupConvMap = new Map(
      groupConvs?.map((g) => [g.conversation_id, g]) || []
    );

    const conversationsWithDetails = await Promise.all(
      participants.map(async (p) => {
        const convId = p.conversation_id;
        const isGroup = groupConvMap.has(convId);
        const groupInfo = groupConvMap.get(convId);

        // Get participants
        const { data: allParticipants } = await supabase
          .from('conversation_participants')
          .select('user_id, profiles(id, username, avatar_url)')
          .eq('conversation_id', convId);

        const participantsList = allParticipants?.map((ap) => ({
          id: ap.profiles?.id || '',
          username: ap.profiles?.username || '',
          avatar_url: ap.profiles?.avatar_url || null,
        })).filter((p) => p.id) || [];

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, message_type, sender_id, created_at')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', convId)
          .neq('sender_id', currentUserId)
          .is('read_at', null);

        return {
          id: convId,
          updated_at: p.conversations?.updated_at || new Date().toISOString(),
          type: isGroup ? 'group' : 'direct',
          name: groupInfo?.name,
          image_url: groupInfo?.image_url,
          participants: participantsList,
          lastMessage,
          unreadCount: unreadCount || 0,
        } as Conversation;
      })
    );

    // Sort by updated_at
    conversationsWithDetails.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    setConversations(conversationsWithDetails);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(username, avatar_url)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data as Message[]);
    }
  };

  const fetchPresence = async (conversationId: string) => {
    const { data } = await supabase
      .from('conversation_presence')
      .select('user_id, status')
      .eq('conversation_id', conversationId);

    if (data) {
      // Get usernames for presence
      const userIds = data.map((p) => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      const presenceWithNames = data.map((p) => ({
        ...p,
        username: profiles?.find((pr) => pr.id === p.user_id)?.username,
      })) as PresenceStatus[];

      setPresenceStatuses(presenceWithNames);
    }
  };

  const markMessagesAsRead = async () => {
    if (!selectedConversation || !currentUserId) return;

    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', selectedConversation.id)
      .neq('sender_id', currentUserId)
      .is('read_at', null);
  };

  const updatePresence = async (status: 'idle' | 'typing' | 'recording') => {
    if (!selectedConversation || !currentUserId) return;

    await supabase
      .from('conversation_presence')
      .upsert({
        conversation_id: selectedConversation.id,
        user_id: currentUserId,
        status,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'conversation_id,user_id' });
  };

  const handleSelectConversation = async (id: string, type: 'direct' | 'group') => {
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setSelectedConversation(conv);
      await fetchMessages(id);
      setShowChat(true);
      setShowAnnouncements(false);
    }
  };

  const handleNewConversation = async (userId: string) => {
    if (!currentUserId) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer une conversation",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if direct conversation already exists between these two users
      const { data: myParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);

      if (myParticipations && myParticipations.length > 0) {
        const myConvIds = myParticipations.map((p) => p.conversation_id);
        
        // Find conversations where the other user is also a participant
        const { data: sharedConvs } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', userId)
          .in('conversation_id', myConvIds);

        if (sharedConvs && sharedConvs.length > 0) {
          // Check if any of these are direct (2 participants only, not a group)
          for (const conv of sharedConvs) {
            const { count } = await supabase
              .from('conversation_participants')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.conversation_id);

            // Also check it's not a group conversation
            const { data: isGroup } = await supabase
              .from('groups')
              .select('id')
              .eq('conversation_id', conv.conversation_id)
              .maybeSingle();

            if (count === 2 && !isGroup) {
              // Found existing direct conversation
              await handleSelectConversation(conv.conversation_id, 'direct');
              return;
            }
          }
        }
      }

      // No existing direct conversation found, create new one
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({ created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        toast({
          title: "Erreur",
          description: `Impossible de créer la conversation: ${convError.message}`,
          variant: "destructive",
        });
        return;
      }

      if (!newConv) {
        toast({
          title: "Erreur",
          description: "La conversation n'a pas été créée",
          variant: "destructive",
        });
        return;
      }

      // Add both participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConv.id, user_id: currentUserId },
          { conversation_id: newConv.id, user_id: userId },
        ]);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        // Try to clean up the conversation
        await supabase.from('conversations').delete().eq('id', newConv.id);
        toast({
          title: "Erreur",
          description: `Impossible d'ajouter les participants: ${participantsError.message}`,
          variant: "destructive",
        });
        return;
      }

      // Refresh and select the new conversation
      await fetchConversations();
      await handleSelectConversation(newConv.id, 'direct');
      
      toast({
        title: "Succès",
        description: "Conversation créée avec succès",
      });
    } catch (error) {
      console.error('Unexpected error creating conversation:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation || !currentUserId) return;

    await supabase.from('messages').insert({
      conversation_id: selectedConversation.id,
      sender_id: currentUserId,
      content,
      message_type: 'text',
    });

    await updatePresence('idle');
  };

  const handleSendImage = async (file: File) => {
    if (!selectedConversation || !currentUserId) return;

    const fileExt = file.name.split(".").pop();
    const filePath = `${currentUserId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("message-media")
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger l'image.",
        variant: "destructive",
      });
      return;
    }

    const { data } = supabase.storage
      .from("message-media")
      .getPublicUrl(filePath);

    await supabase.from("messages").insert({
      conversation_id: selectedConversation.id,
      sender_id: currentUserId,
      media_url: data.publicUrl,
      message_type: "image",
    });
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        await uploadVoiceMessage(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      await updatePresence('recording');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current = null;
      await updatePresence('idle');
    }
  };

  const uploadVoiceMessage = async (blob: Blob) => {
    if (!selectedConversation || !currentUserId) return;

    const filePath = `${currentUserId}/${Date.now()}.webm`;

    const { error: uploadError } = await supabase.storage
      .from("message-media")
      .upload(filePath, blob);

    if (uploadError) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le message vocal.",
        variant: "destructive",
      });
      return;
    }

    const { data } = supabase.storage
      .from("message-media")
      .getPublicUrl(filePath);

    await supabase.from("messages").insert({
      conversation_id: selectedConversation.id,
      sender_id: currentUserId,
      media_url: data.publicUrl,
      message_type: "voice",
    });
  };

  const handleTypingStart = () => updatePresence('typing');
  const handleTypingStop = () => updatePresence('idle');

  const handleBack = () => {
    if (showChat) {
      setShowChat(false);
      setSelectedConversation(null);
    } else {
      navigate('/');
    }
  };

  const handleGroupCreated = async (conversationId: string) => {
    await fetchConversations();
    await fetchGroups();
    await handleSelectConversation(conversationId, 'group');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Conversation List */}
      <div
        className={cn(
          "w-full md:w-96 shrink-0 transition-transform duration-300",
          isMobile && showChat && "-translate-x-full absolute"
        )}
      >
        <ConversationList
          conversations={conversations}
          groups={groups}
          friends={friends}
          selectedId={selectedConversation?.id || null}
          currentUserId={currentUserId || ''}
          onSelect={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onNewGroup={() => setShowCreateGroup(true)}
          onBack={() => navigate('/')}
          onShowAnnouncements={() => {
            setShowAnnouncements(!showAnnouncements);
            setShowChat(true);
            setSelectedConversation(null);
          }}
          showAnnouncements={showAnnouncements}
        />
      </div>

      {/* Chat Area */}
      <div
        className={cn(
          "flex-1 transition-transform duration-300",
          isMobile && !showChat && "translate-x-full absolute w-full"
        )}
      >
        {showAnnouncements ? (
          <div className="h-full p-4 overflow-auto">
            <SystemMessagesPanel />
          </div>
        ) : selectedConversation ? (
          <ChatView
            conversation={selectedConversation}
            messages={messages}
            currentUserId={currentUserId || ''}
            presenceStatuses={presenceStatuses}
            isRecording={isRecording}
            onSendMessage={handleSendMessage}
            onSendImage={handleSendImage}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            onBack={handleBack}
          />
        ) : (
          <EmptyChat />
        )}
      </div>

      {/* Create Group Dialog */}
      {currentUserId && (
        <CreateGroupDialog
          open={showCreateGroup}
          onOpenChange={setShowCreateGroup}
          userId={currentUserId}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </div>
  );
};

export default Messages;
