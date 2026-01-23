import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Users, MessageCircle } from "lucide-react";
import { Friend } from "./types";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends: Friend[];
  onSelectUser: (userId: string) => void;
  onCreateGroup: () => void;
}

export function NewConversationDialog({
  open,
  onOpenChange,
  friends,
  onSelectUser,
  onCreateGroup,
}: NewConversationDialogProps) {
  const [search, setSearch] = useState("");

  const filteredFriends = friends.filter((friend) =>
    friend.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (userId: string) => {
    onSelectUser(userId);
    onOpenChange(false);
    setSearch("");
  };

  const handleCreateGroup = () => {
    onCreateGroup();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Nouvelle conversation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create group button */}
          <Button
            variant="outline"
            className="w-full gap-2 h-12"
            onClick={handleCreateGroup}
          >
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <span className="flex-1 text-left">Créer un groupe</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                ou discuter avec
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un ami..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Friends list */}
          <ScrollArea className="h-64">
            {filteredFriends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {search ? "Aucun ami trouvé" : "Aucun ami pour le moment"}
                </p>
                <p className="text-xs mt-1">
                  Suivez des personnes qui vous suivent pour devenir amis
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredFriends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => handleSelect(friend.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.avatar_url || undefined} />
                      <AvatarFallback className="bg-secondary">
                        {friend.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium">@{friend.username}</p>
                      {friend.bio && (
                        <p className="text-xs text-muted-foreground truncate">
                          {friend.bio}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
