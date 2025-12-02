import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Friend {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

interface FriendsListProps {
  userId: string;
}

export const FriendsList = ({ userId }: FriendsListProps) => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, [userId]);

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
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, bio")
      .in("id", friendIds);

    setFriends(profiles || []);
    setLoading(false);
  };

  const startConversation = async (friendId: string) => {
    // Check if conversation already exists
    const { data: myParticipations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId);

    if (myParticipations) {
      for (const p of myParticipations) {
        const { data: otherParticipant } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", p.conversation_id)
          .eq("user_id", friendId)
          .maybeSingle();

        if (otherParticipant) {
          navigate("/messages");
          return;
        }
      }
    }

    // Create new conversation
    const { data: newConv } = await supabase
      .from("conversations")
      .insert({})
      .select()
      .single();

    if (newConv) {
      await supabase.from("conversation_participants").insert([
        { conversation_id: newConv.id, user_id: userId },
        { conversation_id: newConv.id, user_id: friendId },
      ]);
    }

    navigate("/messages");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <Card className="p-6 text-center bg-card/50 border-border">
        <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">Aucun ami pour le moment</p>
        <p className="text-xs text-muted-foreground mt-1">
          Suivez des utilisateurs qui vous suivent pour devenir amis
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <Users className="w-4 h-4" />
        Amis ({friends.length})
      </h3>
      <div className="grid gap-2">
        {friends.map((friend) => (
          <Card
            key={friend.id}
            className="p-3 flex items-center gap-3 bg-card/50 border-border hover:bg-card transition-colors"
          >
            <Avatar 
              className="h-10 w-10 cursor-pointer hover:ring-2 ring-primary transition-all"
              onClick={() => navigate(`/profile/${friend.username}`)}
            >
              <AvatarImage src={friend.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {friend.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p 
                className="font-medium text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                onClick={() => navigate(`/profile/${friend.username}`)}
              >
                @{friend.username}
              </p>
              {friend.bio && (
                <p className="text-xs text-muted-foreground truncate">{friend.bio}</p>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => startConversation(friend.id)}
              className="shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
