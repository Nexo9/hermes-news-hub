import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, UserPlus, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  isFollowing: boolean;
  isMutualFollow: boolean;
}

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const searchProfiles = async () => {
      if (!searchQuery.trim() || !currentUserId) {
        setProfiles([]);
        return;
      }

      setLoading(true);
      const { data: profilesData, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio")
        .ilike("username", `%${searchQuery}%`)
        .neq("id", currentUserId)
        .limit(20);

      if (error) {
        console.error("Error searching profiles:", error);
        setProfiles([]);
        setLoading(false);
        return;
      }

      // Check follow status
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("following_id, follower_id")
        .or(`follower_id.eq.${currentUserId},following_id.eq.${currentUserId}`);

      const profilesWithFollowStatus = profilesData?.map((profile) => {
        const userFollows = subscriptions?.some(
          (sub) => sub.follower_id === currentUserId && sub.following_id === profile.id
        );
        const profileFollows = subscriptions?.some(
          (sub) => sub.following_id === currentUserId && sub.follower_id === profile.id
        );
        return {
          ...profile,
          isFollowing: userFollows || false,
          isMutualFollow: userFollows && profileFollows,
        };
      }) || [];

      setProfiles(profilesWithFollowStatus);
      setLoading(false);
    };

    const timeoutId = setTimeout(searchProfiles, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentUserId]);

  const handleFollow = async (profileId: string) => {
    if (!currentUserId) return;

    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    if (profile.isFollowing) {
      // Unfollow
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", profileId);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de ne plus suivre cet utilisateur.",
          variant: "destructive",
        });
        return;
      }

      setProfiles(profiles.map(p => 
        p.id === profileId ? { ...p, isFollowing: false, isMutualFollow: false } : p
      ));
    } else {
      // Follow
      const { error } = await supabase
        .from("subscriptions")
        .insert({ follower_id: currentUserId, following_id: profileId });

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de suivre cet utilisateur.",
          variant: "destructive",
        });
        return;
      }

      // Check if mutual
      const { data: reverseFollow } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("follower_id", profileId)
        .eq("following_id", currentUserId)
        .single();

      setProfiles(profiles.map(p => 
        p.id === profileId 
          ? { ...p, isFollowing: true, isMutualFollow: !!reverseFollow } 
          : p
      ));

      if (reverseFollow) {
        toast({
          title: "Vous êtes maintenant amis !",
          description: "Vous pouvez vous envoyer des messages.",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Rechercher des profils</h1>
        
        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher par nom d'utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Recherche en cours...</p>
        ) : profiles.length > 0 ? (
          <div className="space-y-4">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div
                  className="flex items-center gap-4 flex-1 cursor-pointer"
                  onClick={() => navigate(`/profile/${profile.username}`)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{profile.username}</p>
                    {profile.bio && (
                      <p className="text-sm text-muted-foreground">{profile.bio}</p>
                    )}
                    {profile.isMutualFollow && (
                      <span className="text-xs text-primary">👥 Amis</span>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => handleFollow(profile.id)}
                  variant={profile.isFollowing ? "secondary" : "default"}
                  size="sm"
                >
                  {profile.isFollowing ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Suivi
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Suivre
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <p className="text-center text-muted-foreground">Aucun profil trouvé.</p>
        ) : (
          <p className="text-center text-muted-foreground">
            Commencez à taper pour rechercher des profils.
          </p>
        )}
      </div>
    </div>
  );
}
