import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Upload, Camera, ImageIcon, Loader2, Lock, Shield, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PasswordChangeDialog } from "@/components/PasswordChangeDialog";
import { Separator } from "@/components/ui/separator";

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
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      setProfile(data);
      setBio(data.bio || "");
      setAvatarUrl(data.avatar_url || "");
      setBannerUrl(data.banner_url || "");
    };

    fetchProfile();
  }, [navigate]);

  const uploadImage = async (file: File, type: "avatar" | "banner") => {
    if (!profile) return;

    const isAvatar = type === "avatar";
    isAvatar ? setUploadingAvatar(true) : setUploadingBanner(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${profile.id}/${type}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger l'image",
        variant: "destructive",
      });
      isAvatar ? setUploadingAvatar(false) : setUploadingBanner(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

    if (isAvatar) {
      setAvatarUrl(data.publicUrl);
      setUploadingAvatar(false);
    } else {
      setBannerUrl(data.publicUrl);
      setUploadingBanner(false);
    }

    toast({
      title: "Image téléchargée",
      description: "L'image a été mise à jour",
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, "avatar");
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, "banner");
  };

  const handleSave = async () => {
    if (!profile) return;

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        bio,
        avatar_url: avatarUrl || null,
        banner_url: bannerUrl || null,
      })
      .eq("id", profile.id);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
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

        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="p-6 space-y-8 bg-card border-border">
            {/* Banner Upload */}
            <div>
              <Label>Bannière</Label>
              <div 
                className="relative mt-2 h-40 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 overflow-hidden group cursor-pointer"
                onClick={() => bannerInputRef.current?.click()}
                style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
              >
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingBanner ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <div className="text-center text-white">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                      <span className="text-sm">Changer la bannière</span>
                    </div>
                  )}
                </div>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Avatar Upload */}
            <div>
              <Label>Photo de profil</Label>
              <div className="flex items-center gap-6 mt-2">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Avatar className="h-24 w-24 ring-4 ring-primary/30">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                      {profile.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploadingAvatar ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-lg">@{profile.username}</p>
                  <p className="text-sm text-muted-foreground">Cliquez sur l'avatar pour le modifier</p>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="bio">Biographie</Label>
              <Textarea
                id="bio"
                placeholder="Parlez-nous de vous..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-2 min-h-32 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {bio.length}/500 caractères
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button onClick={handleSave} disabled={loading} className="flex-1 gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Enregistrer
                  </>
                )}
              </Button>
              <Button
                onClick={() => navigate(`/profile/${profile.username}`)}
                variant="outline"
              >
                Annuler
              </Button>
            </div>
          </Card>

          {/* Security Card */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Sécurité</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Mot de passe</p>
                    <p className="text-sm text-muted-foreground">Modifier votre mot de passe</p>
                  </div>
                </div>
                <Button onClick={() => setShowPasswordDialog(true)} variant="outline">
                  Modifier
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5">
                <div className="flex items-center gap-3">
                  <LogOut className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">Déconnexion</p>
                    <p className="text-sm text-muted-foreground">Se déconnecter de votre compte</p>
                  </div>
                </div>
                <Button onClick={handleLogout} variant="destructive">
                  Déconnexion
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <PasswordChangeDialog
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
      />
    </div>
  );
};

export default EditProfile;
