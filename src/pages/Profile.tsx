import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Profile {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
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

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        {/* Banner */}
        <div 
          className="h-64 bg-gradient-to-r from-primary/20 to-accent/20"
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

        {/* Edit button */}
        {isOwnProfile && (
          <Button
            onClick={() => navigate('/profile/edit')}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm"
          >
            <Pencil className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-20">
        <div className="flex items-end gap-6 mb-6">
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
              {profile.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 pb-2">
            <h1 className="text-3xl font-bold text-foreground mb-2">@{profile.username}</h1>
            {profile.bio && (
              <p className="text-muted-foreground">{profile.bio}</p>
            )}
          </div>
        </div>

        <div className="mt-8">
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
    </div>
  );
};

export default Profile;