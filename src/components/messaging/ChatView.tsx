import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  Send, 
  Mic, 
  Image as ImageIcon, 
  StopCircle,
  MoreVertical,
  Phone,
  Video,
  Check,
  CheckCheck,
  Users
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import { Message, Conversation, PresenceStatus } from "./types";
import { TypingIndicator } from "./TypingIndicator";
import { MessageBubble } from "./MessageBubble";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ChatViewProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  presenceStatuses: PresenceStatus[];
  isRecording: boolean;
  onSendMessage: (content: string) => void;
  onSendImage: (file: File) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onBack: () => void;
}

export function ChatView({
  conversation,
  messages,
  currentUserId,
  presenceStatuses,
  isRecording,
  onSendMessage,
  onSendImage,
  onStartRecording,
  onStopRecording,
  onTypingStart,
  onTypingStop,
  onBack,
}: ChatViewProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const otherParticipant = conversation.participants.find(
    (p) => p.id !== currentUserId
  );

  const activePresence = presenceStatuses.filter(
    (p) => p.user_id !== currentUserId && p.status !== 'idle'
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      onTypingStart();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingStop();
    }, 2000);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage("");
    setIsTyping(false);
    onTypingStop();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onSendImage(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

    msgs.forEach((msg) => {
      const msgDate = new Date(msg.created_at);
      let dateLabel = "";
      
      if (isToday(msgDate)) {
        dateLabel = "Aujourd'hui";
      } else if (isYesterday(msgDate)) {
        dateLabel = "Hier";
      } else {
        dateLabel = format(msgDate, "d MMMM yyyy", { locale: fr });
      }

      if (dateLabel !== currentDate) {
        currentDate = dateLabel;
        groups.push({ date: dateLabel, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-10 w-10">
          {conversation.type === 'group' ? (
            <>
              <AvatarImage src={conversation.image_url || undefined} />
              <AvatarFallback className="bg-primary/20">
                <Users className="h-5 w-5" />
              </AvatarFallback>
            </>
          ) : (
            <>
              <AvatarImage src={otherParticipant?.avatar_url || undefined} />
              <AvatarFallback className="bg-secondary">
                {otherParticipant?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">
            {conversation.type === 'group' 
              ? conversation.name 
              : `@${otherParticipant?.username}`}
          </h2>
          <AnimatePresence mode="wait">
            {activePresence.length > 0 ? (
              <motion.p
                key="presence"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="text-xs text-primary"
              >
                {activePresence[0].status === 'typing' 
                  ? `${activePresence[0].username || 'Utilisateur'} écrit...`
                  : `${activePresence[0].username || 'Utilisateur'} enregistre...`}
              </motion.p>
            ) : (
              <motion.p
                key="participants"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="text-xs text-muted-foreground"
              >
                {conversation.type === 'group'
                  ? `${conversation.participants.length} participants`
                  : "En ligne"}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <Button variant="ghost" size="icon">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Video className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 max-w-3xl mx-auto">
          {messageGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              <div className="flex justify-center mb-4">
                <span className="px-3 py-1 text-xs bg-muted rounded-full text-muted-foreground">
                  {group.date}
                </span>
              </div>
              <div className="space-y-2">
                {group.messages.map((msg, idx) => {
                  const isMine = msg.sender_id === currentUserId;
                  const showAvatar = !isMine && (
                    idx === 0 || 
                    group.messages[idx - 1]?.sender_id !== msg.sender_id
                  );
                  
                  return (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isMine={isMine}
                      showAvatar={showAvatar}
                      isGroup={conversation.type === 'group'}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {activePresence.some((p) => p.status === 'typing') && (
              <TypingIndicator />
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>

          <div className="flex-1 relative">
            <Input
              placeholder="Écrire un message..."
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="pr-12 bg-background/50 border-border/50"
            />
          </div>

          {message.trim() ? (
            <Button
              onClick={handleSend}
              size="icon"
              className="shrink-0 bg-primary hover:bg-primary/90"
            >
              <Send className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              onClick={isRecording ? onStopRecording : onStartRecording}
              size="icon"
              variant={isRecording ? "destructive" : "ghost"}
              className={cn(
                "shrink-0 transition-all",
                isRecording && "animate-pulse"
              )}
            >
              {isRecording ? (
                <StopCircle className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
