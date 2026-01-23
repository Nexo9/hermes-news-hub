import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  MessageCircle, 
  Users, 
  ArrowLeft,
  Megaphone,
  Settings
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Conversation, Friend, Group } from "./types";
import { NewConversationDialog } from "./NewConversationDialog";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: Conversation[];
  groups: Group[];
  friends: Friend[];
  selectedId: string | null;
  currentUserId: string;
  onSelect: (id: string, type: 'direct' | 'group') => void;
  onNewConversation: (userId: string) => void;
  onNewGroup: () => void;
  onBack: () => void;
  onShowAnnouncements: () => void;
  showAnnouncements: boolean;
}

export function ConversationList({
  conversations,
  groups,
  friends,
  selectedId,
  currentUserId,
  onSelect,
  onNewConversation,
  onNewGroup,
  onBack,
  onShowAnnouncements,
  showAnnouncements,
}: ConversationListProps) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredConversations = conversations.filter((conv) => {
    const searchLower = search.toLowerCase();
    if (conv.type === 'group' && conv.name) {
      return conv.name.toLowerCase().includes(searchLower);
    }
    return conv.participants.some((p) => 
      p.username.toLowerCase().includes(searchLower)
    );
  });

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(search.toLowerCase())
  );

  const getConversationDisplay = (conv: Conversation) => {
    if (conv.type === 'group') {
      return {
        name: conv.name || 'Groupe',
        avatar: conv.image_url,
        initials: conv.name?.[0]?.toUpperCase() || 'G',
        isGroup: true,
      };
    }
    const other = conv.participants.find((p) => p.id !== currentUserId);
    return {
      name: other?.username || 'Utilisateur',
      avatar: other?.avatar_url,
      initials: other?.username?.[0]?.toUpperCase() || 'U',
      isGroup: false,
    };
  };

  const getLastMessagePreview = (conv: Conversation) => {
    if (!conv.lastMessage) return "Aucun message";
    switch (conv.lastMessage.message_type) {
      case 'image':
        return "📷 Photo";
      case 'voice':
        return "🎤 Message vocal";
      case 'file':
        return "📎 Fichier";
      default:
        return conv.lastMessage.content || "Message";
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Messages</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onShowAnnouncements}
              className={cn(showAnnouncements && "bg-primary/20 text-primary")}
            >
              <Megaphone className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-background/50"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 grid grid-cols-3">
          <TabsTrigger value="all" className="text-xs">
            <MessageCircle className="h-4 w-4 mr-1" />
            Tous
          </TabsTrigger>
          <TabsTrigger value="direct" className="text-xs">
            Messages
          </TabsTrigger>
          <TabsTrigger value="groups" className="text-xs">
            <Users className="h-4 w-4 mr-1" />
            Groupes
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 mt-2">
          <TabsContent value="all" className="m-0 p-2 space-y-1">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucune conversation</p>
                <p className="text-xs mt-1">Cliquez sur + pour commencer</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const display = getConversationDisplay(conv);
                return (
                  <button
                    key={conv.id}
                    onClick={() => onSelect(conv.id, conv.type)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                      "hover:bg-accent/50",
                      selectedId === conv.id && "bg-primary/10 border border-primary/20"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={display.avatar || undefined} />
                        <AvatarFallback className={cn(
                          "text-sm font-medium",
                          display.isGroup ? "bg-primary/20" : "bg-secondary"
                        )}>
                          {display.isGroup ? (
                            <Users className="h-5 w-5" />
                          ) : (
                            display.initials
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {(conv.unreadCount || 0) > 0 && (
                        <Badge 
                          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">
                          {display.isGroup ? display.name : `@${display.name}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.updated_at), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {getLastMessagePreview(conv)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="direct" className="m-0 p-2 space-y-1">
            {filteredConversations
              .filter((c) => c.type === 'direct')
              .map((conv) => {
                const display = getConversationDisplay(conv);
                return (
                  <button
                    key={conv.id}
                    onClick={() => onSelect(conv.id, 'direct')}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                      "hover:bg-accent/50",
                      selectedId === conv.id && "bg-primary/10 border border-primary/20"
                    )}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={display.avatar || undefined} />
                      <AvatarFallback className="bg-secondary">
                        {display.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="font-medium truncate block">
                        @{display.name}
                      </span>
                      <p className="text-sm text-muted-foreground truncate">
                        {getLastMessagePreview(conv)}
                      </p>
                    </div>
                  </button>
                );
              })}
          </TabsContent>

          <TabsContent value="groups" className="m-0 p-2 space-y-1">
            <Button
              variant="outline"
              className="w-full mb-2 gap-2"
              onClick={onNewGroup}
            >
              <Plus className="h-4 w-4" />
              Créer un groupe
            </Button>
            {filteredGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => group.conversation_id && onSelect(group.conversation_id, 'group')}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                  "hover:bg-accent/50",
                  selectedId === group.conversation_id && "bg-primary/10 border border-primary/20"
                )}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={group.image_url || undefined} />
                  <AvatarFallback className="bg-primary/20">
                    <Users className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <span className="font-medium truncate block">{group.name}</span>
                  <p className="text-sm text-muted-foreground">
                    {group.member_count} membre{group.member_count > 1 ? 's' : ''}
                  </p>
                </div>
              </button>
            ))}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <NewConversationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        friends={friends}
        onSelectUser={onNewConversation}
        onCreateGroup={onNewGroup}
      />
    </div>
  );
}
