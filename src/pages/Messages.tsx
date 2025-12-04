import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Search, Send, Mic, Image as ImageIcon, StopCircle, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { SystemMessagesPanel } from "@/components/SystemMessagesPanel";

interface Conversation {
  id: string;
  updated_at: string;
  otherUser: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  lastMessage: string | null;
}

interface Message {
  id: string;
  content: string | null;
  message_type: string;
  media_url: string | null;
  created_at: string;
  sender_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface Friend {
  id: string;
  username: string;
  avatar_url: string | null;
}

const Messages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchUsername, setSearchUsername] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [showSystemMessages, setShowSystemMessages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
      fetchFriends();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (searchUsername.trim()) {
      const filtered = friends.filter(f => 
        f.username.toLowerCase().includes(searchUsername.toLowerCase())
      );
      setFilteredFriends(filtered);
    } else {
      setFilteredFriends([]);
    }
  }, [searchUsername, friends]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
      const unsubscribe = subscribeToMessages();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setCurrentUserId(user.id);
    setLoading(false);
  };

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
          .select("id, username, avatar_url")
          .in("id", mutualIds);

        if (profiles) {
          setFriends(profiles);
        }
      }
    }
  };

  const fetchConversations = async () => {
    if (!currentUserId) return;

    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('conversation_id, conversations(updated_at)')
      .eq('user_id', currentUserId);

    if (!participants || participants.length === 0) {
      setConversations([]);
      return;
    }

    const conversationIds = participants.map(p => p.conversation_id);
    
    const conversationsWithUsers = await Promise.all(
      conversationIds.map(async (convId) => {
        const { data: otherParticipants } = await supabase
          .from('conversation_participants')
          .select('user_id, profiles(id, username, avatar_url)')
          .eq('conversation_id', convId)
          .neq('user_id', currentUserId)
          .limit(1);

        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const participant = participants.find(p => p.conversation_id === convId);

        return {
          id: convId,
          updated_at: participant?.conversations?.updated_at || new Date().toISOString(),
          otherUser: otherParticipants?.[0]?.profiles || null,
          lastMessage: lastMessage?.content || null,
        };
      })
    );

    setConversations(conversationsWithUsers.filter(c => c.otherUser));
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;

    const { data } = await supabase
      .from('messages')
      .select('*, profiles(username, avatar_url)')
      .eq('conversation_id', selectedConversation)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data as Message[]);
    }
  };

  const subscribeToMessages = () => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`messages:${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const startNewConversation = async (friendId?: string, friendUsername?: string) => {
    if (!currentUserId) return;

    const targetId = friendId;
    const targetUsername = friendUsername || searchUsername;

    if (!targetId && !targetUsername) return;

    let profileId = targetId;

    if (!profileId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', targetUsername)
        .maybeSingle();

      if (!profile) {
        toast({
          title: "Erreur",
          description: "Utilisateur introuvable",
          variant: "destructive",
        });
        return;
      }
      profileId = profile.id;
    }

    // Check if conversation exists
    const { data: existingParticipants } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId);

    if (existingParticipants) {
      for (const p of existingParticipants) {
        const { data: otherParticipant } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', p.conversation_id)
          .eq('user_id', profileId)
          .maybeSingle();

        if (otherParticipant) {
          setSelectedConversation(p.conversation_id);
          setSearchUsername("");
          setFilteredFriends([]);
          return;
        }
      }
    }

    // Create new conversation
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (convError || !newConv) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la conversation",
        variant: "destructive",
      });
      return;
    }

    // Add participants
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConv.id, user_id: currentUserId },
        { conversation_id: newConv.id, user_id: profileId },
      ]);

    if (participantsError) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter les participants",
        variant: "destructive",
      });
      return;
    }

    setSelectedConversation(newConv.id);
    setSearchUsername("");
    setFilteredFriends([]);
    fetchConversations();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedConversation,
      sender_id: currentUserId,
      content: newMessage,
      message_type: 'text',
    });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
      return;
    }

    setNewMessage("");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversation || !currentUserId) return;

    const fileExt = file.name.split(".").pop();
    const filePath = `${currentUserId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("message-media")
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier.",
        variant: "destructive",
      });
      return;
    }

    const { data } = supabase.storage
      .from("message-media")
      .getPublicUrl(filePath);

    const messageType = file.type.startsWith("image/") ? "image" : "file";

    await supabase.from("messages").insert({
      conversation_id: selectedConversation,
      sender_id: currentUserId,
      media_url: data.publicUrl,
      message_type: messageType,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startRecording = async () => {
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
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
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
      conversation_id: selectedConversation,
      sender_id: currentUserId,
      media_url: data.publicUrl,
      message_type: "voice",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Conversations List */}
        <div className="w-80 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-4">
              <Button onClick={() => navigate('/')} variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-foreground">Messages</h1>
              <div className="flex-1" />
              <Button 
                onClick={() => setShowSystemMessages(!showSystemMessages)} 
                variant="ghost" 
                size="icon"
                className={showSystemMessages ? "bg-primary/20" : ""}
              >
                <Megaphone className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="relative">
              <div className="flex gap-2">
                <Input
                  placeholder="Rechercher un ami..."
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && startNewConversation()}
                />
                <Button onClick={() => startNewConversation()} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {/* Friends suggestions dropdown */}
              {filteredFriends.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 border border-border rounded-lg bg-card max-h-48 overflow-y-auto z-10 shadow-lg">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      onClick={() => startNewConversation(friend.id, friend.username)}
                      className="p-3 hover:bg-accent/10 cursor-pointer flex items-center gap-3"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={friend.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {friend.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">@{friend.username}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <p>Aucune conversation</p>
                <p className="text-sm mt-1">Recherchez un ami pour démarrer</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`p-4 cursor-pointer hover:bg-accent/5 border-b border-border ${
                    selectedConversation === conv.id ? 'bg-accent/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={conv.otherUser.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {conv.otherUser.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">@{conv.otherUser.username}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage || 'Aucun message'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area or System Messages */}
        <div className="flex-1 flex flex-col">
          {showSystemMessages ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <SystemMessagesPanel />
            </div>
          ) : selectedConversation ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {msg.profiles?.username?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isOwn
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {msg.message_type === 'text' && (
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}
                            {msg.message_type === 'image' && msg.media_url && (
                              <img
                                src={msg.media_url}
                                alt="Image"
                                className="max-w-xs rounded-lg"
                              />
                            )}
                            {msg.message_type === 'voice' && msg.media_url && (
                              <audio controls src={msg.media_url} className="max-w-xs" />
                            )}
                          </div>
                          <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? 'text-right' : ''}`}>
                            {formatDistanceToNow(new Date(msg.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="ghost"
                    size="icon"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant="ghost"
                    size="icon"
                    className={isRecording ? 'text-destructive' : ''}
                  >
                    {isRecording ? (
                      <StopCircle className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>
                  <Input
                    placeholder="Écrivez un message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} size="icon">
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg">Sélectionnez une conversation</p>
                <p className="text-sm mt-1">ou recherchez un ami pour commencer</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
