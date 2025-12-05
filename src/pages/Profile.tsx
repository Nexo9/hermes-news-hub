import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, ArrowLeft, MessageSquare, Flag, BadgeCheck, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { FollowButton } from "@/components/FollowButton";
import { ReportUserDialog } from "@/components/ReportUserDialog";

interface Profile {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
}

interface UserSubscription {
  plan_type: string;
  is_certified: boolean;
}

interface Thread {
  id: string;
  content: string;
  created_at: string;
  news_id: string;
  news: {
    title: string;
  };
}

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    checkUser();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;

      setLoading(true);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch followers/following counts
      const { count: followersCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileData.id);

      const { count: followingCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profileData.id);

      setFollowersCount(followersCount || 0);
      setFollowingCount(followingCount || 0);

      // Fetch subscription/certification status
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('plan_type, is_certified')
        .eq('user_id', profileData.id)
        .maybeSingle();

      if (subData) {
        setSubscription(subData);
      }

      const { data: threadsData, error: threadsError } = await supabase
        .from('threads')
        .select('id, content, created_at, news_id, news(title)')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false });

      if (threadsError) {
        console.error('Error fetching threads:', threadsError);
      } else {
        setThreads(threadsData || []);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary">Chargement...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold text-primary mb-4">Profil introuvable</h1>
        <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
      </div>
    );
  }

  const isOwnProfile = currentUserId === profile.id;

  const startConversation = async () => {
    if (!currentUserId || !profile) return;

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
          .eq('user_id', profile.id)
          .single();

        if (otherParticipant) {
          navigate('/messages');
          return;
        }
      }
    }

    // Create new conversation
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (newConv) {
      await supabase.from('conversation_participants').insert([
        { conversation_id: newConv.id, user_id: currentUserId },
        { conversation_id: newConv.id, user_id: profile.id },
      ]);
      navigate('/messages');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        {/* Banner */}
        <div 
          className="h-32 sm:h-48 bg-gradient-to-r from-primary/20 to-accent/20"
          style={profile.banner_url ? { backgroundImage: `url(${profile.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        />
        
        {/* Back button */}
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isOwnProfile ? (
            <Button
              onClick={() => navigate('/profile/edit')}
              variant="ghost"
              size="icon"
              className="bg-background/80 backdrop-blur-sm"
            >
              <Pencil className="h-5 w-5" />
            </Button>
          ) : (
            <>
              <Button
                onClick={startConversation}
                variant="ghost"
                size="icon"
                className="bg-background/80 backdrop-blur-sm"
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
              {currentUserId && (
                <Button
                  onClick={() => setShowReportDialog(true)}
                  variant="ghost"
                  size="icon"
                  className="bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
                >
                  <Flag className="h-5 w-5" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Profile info section - positioned over banner */}
        <div className="relative -mt-16 sm:-mt-20 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl sm:text-4xl bg-primary text-primary-foreground">
                {profile.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* User info card - background for readability */}
            <div className="flex-1 bg-background/95 backdrop-blur-sm rounded-lg p-4 sm:pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">@{profile.username}</h1>
                    {subscription?.is_certified && (
                      <div className="flex items-center">
                        {subscription.plan_type === 'elite' ? (
                          <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                        ) : (
                          <BadgeCheck className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    )}
                  </div>
                  {profile.bio && (
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">{profile.bio}</p>
                  )}
                  <div className="flex gap-4 text-sm mt-2">
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">{followersCount}</strong> abonnés
                    </span>
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">{followingCount}</strong> abonnements
                    </span>
                  </div>
                </div>
                
                {!isOwnProfile && (
                  <FollowButton profileId={profile.id} currentUserId={currentUserId} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Threads section */}
        <div className="mt-8 pb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Commentaires ({threads.length})
          </h2>
          
          {threads.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              Aucun commentaire pour le moment
            </Card>
          ) : (
            <div className="space-y-4">
              {threads.map((thread) => (
                <Card key={thread.id} className="p-4 hover:bg-accent/5 transition-colors">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {profile.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">@{profile.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(thread.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Sur: <span className="text-foreground font-medium">{thread.news.title}</span>
                      </p>
                      <p className="text-foreground">{thread.content}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report dialog */}
      {currentUserId && profile && !isOwnProfile && (
        <ReportUserDialog
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          reportedUserId={profile.id}
          reportedUsername={profile.username}
          reporterId={currentUserId}
        />
      )}
    </div>
  );
};

export default Profile;
