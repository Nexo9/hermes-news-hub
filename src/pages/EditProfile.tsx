import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
}

const EditProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
      setBio(data.bio || '');
      setAvatarUrl(data.avatar_url || '');
      setBannerUrl(data.banner_url || '');
    };

    fetchProfile();
  }, [navigate]);

  const handleSave = async () => {
    if (!profile) return;

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        bio,
        avatar_url: avatarUrl || null,
        banner_url: bannerUrl || null,
      })
      .eq('id', profile.id);

    setLoading(false);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Profil mis à jour",
      description: "Vos modifications ont été enregistrées",
    });
    navigate(`/profile/${profile.username}`);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => navigate(`/profile/${profile.username}`)}
            variant="ghost"
            size="icon"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Modifier le profil</h1>
        </div>

        <Card className="p-6 space-y-6">
          <div>
            <Label htmlFor="avatar">Photo de profil</Label>
            <div className="flex items-center gap-4 mt-2">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {profile.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Input
                  id="avatar"
                  type="url"
                  placeholder="URL de l'image"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Entrez l'URL d'une image
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="banner">Bannière</Label>
            <div className="space-y-2 mt-2">
              {bannerUrl && (
                <div className="h-32 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${bannerUrl})` }} />
              )}
              <Input
                id="banner"
                type="url"
                placeholder="URL de l'image de bannière"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Entrez l'URL d'une image de bannière
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="username">Pseudo</Label>
            <Input
              id="username"
              type="text"
              value={profile.username}
              disabled
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Le pseudo ne peut pas être modifié
            </p>
          </div>

          <div>
            <Label htmlFor="bio">Biographie</Label>
            <Textarea
              id="bio"
              placeholder="Parlez-nous de vous..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-2 min-h-32"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {bio.length}/500 caractères
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button
              onClick={() => navigate(`/profile/${profile.username}`)}
              variant="outline"
            >
              Annuler
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EditProfile;