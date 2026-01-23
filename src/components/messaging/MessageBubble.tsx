import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Message } from "./types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  showAvatar: boolean;
  isGroup: boolean;
}

export function MessageBubble({ message, isMine, showAvatar, isGroup }: MessageBubbleProps) {
  const renderContent = () => {
    switch (message.message_type) {
      case 'image':
        return (
          <img
            src={message.media_url || ''}
            alt="Image"
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.media_url || '', '_blank')}
          />
        );
      case 'voice':
        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="flex-1">
              <audio 
                src={message.media_url || ''} 
                controls 
                className="w-full h-8"
                style={{ 
                  filter: isMine ? 'invert(1) hue-rotate(180deg)' : 'none'
                }}
              />
            </div>
          </div>
        );
      case 'file':
        return (
          <a
            href={message.media_url || ''}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm underline"
          >
            📎 Fichier attaché
          </a>
        );
      default:
        return (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex gap-2",
        isMine ? "justify-end" : "justify-start"
      )}
    >
      {!isMine && showAvatar && (
        <Avatar className="h-8 w-8 mt-auto">
          <AvatarImage src={message.profiles?.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-secondary">
            {message.profiles?.username?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}

      {!isMine && !showAvatar && <div className="w-8" />}

      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2 shadow-sm",
          isMine
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card border border-border rounded-bl-sm"
        )}
      >
        {!isMine && isGroup && showAvatar && (
          <p className="text-xs font-medium text-primary mb-1">
            @{message.profiles?.username}
          </p>
        )}
        
        {renderContent()}

        <div className={cn(
          "flex items-center gap-1 mt-1",
          isMine ? "justify-end" : "justify-start"
        )}>
          <span className={cn(
            "text-[10px]",
            isMine ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {format(new Date(message.created_at), "HH:mm", { locale: fr })}
          </span>
          
          {isMine && (
            message.read_at ? (
              <CheckCheck className={cn(
                "h-3 w-3",
                "text-primary-foreground/70"
              )} />
            ) : (
              <Check className="h-3 w-3 text-primary-foreground/70" />
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
