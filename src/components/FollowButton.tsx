import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FollowButtonProps {
  profileId: string;
  currentUserId: string | null;
}

export const FollowButton = ({ profileId, currentUserId }: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentUserId && currentUserId !== profileId) {
      checkFollowStatus();
    }
  }, [currentUserId, profileId]);

  const checkFollowStatus = async () => {
    if (!currentUserId) return;

    const { data } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', profileId)
      .single();

    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!currentUserId) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour suivre des utilisateurs",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('subscriptions')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', profileId);

        if (error) throw error;

        setIsFollowing(false);
        toast({
          title: "Désabonné",
          description: "Vous ne suivez plus cet utilisateur",
        });
      } else {
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            follower_id: currentUserId,
            following_id: profileId,
          });

        if (error) throw error;

        setIsFollowing(true);
        toast({
          title: "Abonné",
          description: "Vous suivez maintenant cet utilisateur",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUserId || currentUserId === profileId) {
    return null;
  }

  return (
    <Button
      onClick={handleFollow}
      disabled={loading}
      variant={isFollowing ? "outline" : "default"}
      className="gap-2"
    >
      {isFollowing ? (
        <>
          <UserMinus className="h-4 w-4" />
          Se désabonner
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          S'abonner
        </>
      )}
    </Button>
  );
};