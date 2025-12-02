import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Check, Users } from "lucide-react";

interface Friend {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface ShareNewsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  newsId: string;
  newsTitle: string;
  userId: string;
}

export const ShareNewsDialog = ({ isOpen, onClose, newsId, newsTitle, userId }: ShareNewsDialogProps) => {
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [sharedTo, setSharedTo] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchFriends();
    }
  }, [isOpen, userId]);

  const fetchFriends = async () => {
    // Get users that follow me
    const { data: followers } = await supabase
      .from("subscriptions")
      .select("follower_id")
      .eq("following_id", userId);

    // Get users I follow
    const { data: following } = await supabase
      .from("subscriptions")
      .select("following_id")
      .eq("follower_id", userId);

    const followerIds = new Set(followers?.map((f) => f.follower_id) || []);
    const followingIds = following?.map((f) => f.following_id) || [];

    // Friends = mutual follows
    const friendIds = followingIds.filter((id) => followerIds.has(id));

    if (friendIds.length === 0) {
      setFriends([]);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", friendIds);

    setFriends(profiles || []);
  };

  const shareToFriend = async (friendId: string) => {
    if (sharedTo.has(friendId)) return;
    
    setLoading(true);
    const { error } = await supabase.from("news_shares").insert({
      sender_id: userId,
      receiver_id: friendId,
      news_id: newsId,
    });

    setLoading(false);

    if (error) {
      toast({ title: "Erreur", description: "Impossible de partager", variant: "destructive" });
      return;
    }

    setSharedTo((prev) => new Set([...prev, friendId]));
    toast({ title: "Partagé!", description: "L'actualité a été partagée" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5 text-primary" />
            Partager avec vos amis
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">"{newsTitle}"</p>

        {friends.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun ami pour le moment</p>
            <p className="text-xs mt-1">Suivez des utilisateurs qui vous suivent pour devenir amis</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={friend.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {friend.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">@{friend.username}</span>
                </div>
                <Button
                  size="sm"
                  variant={sharedTo.has(friend.id) ? "secondary" : "default"}
                  onClick={() => shareToFriend(friend.id)}
                  disabled={loading || sharedTo.has(friend.id)}
                  className="gap-1.5"
                >
                  {sharedTo.has(friend.id) ? (
                    <>
                      <Check className="w-4 h-4" />
                      Envoyé
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
