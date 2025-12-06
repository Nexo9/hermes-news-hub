import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, Shield, Crown, Award, Calendar, Eye, Settings2, 
  Mail, CheckCircle2, Users 
} from "lucide-react";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: "admin" | "moderator" | "user";
}

interface UserSubscription {
  user_id: string;
  plan_type: string;
  is_certified: boolean;
}

export function AdminUserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<Map<string, string>>(new Map());
  const [userSubscriptions, setUserSubscriptions] = useState<Map<string, UserSubscription>>(new Map());
  const [searchUser, setSearchUser] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch profiles
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, bio, created_at")
      .order("created_at", { ascending: false });

    if (profilesData) {
      setProfiles(profilesData);

      // Fetch roles for all users
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesData) {
        const rolesMap = new Map<string, string>();
        rolesData.forEach((r) => rolesMap.set(r.user_id, r.role));
        setUserRoles(rolesMap);
      }

      // Fetch subscriptions for all users
      const { data: subsData } = await supabase
        .from("user_subscriptions")
        .select("user_id, plan_type, is_certified");

      if (subsData) {
        const subsMap = new Map<string, UserSubscription>();
        subsData.forEach((s) => subsMap.set(s.user_id, s));
        setUserSubscriptions(subsMap);
      }
    }
  };

  const handleRoleChange = async (userId: string, newRole: "admin" | "moderator" | "user") => {
    setLoading(true);
    try {
      const currentRole = userRoles.get(userId);

      if (currentRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: newRole }]);

        if (error) throw error;
      }

      setUserRoles((prev) => new Map(prev).set(userId, newRole));
      toast({
        title: "Rôle mis à jour",
        description: `Le rôle a été changé en ${newRole}.`,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rôle.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionChange = async (userId: string, planType: string, isCertified: boolean) => {
    setLoading(true);
    try {
      const currentSub = userSubscriptions.get(userId);

      if (currentSub) {
        // Update existing subscription
        const { error } = await supabase
          .from("user_subscriptions")
          .update({ plan_type: planType, is_certified: isCertified })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Insert new subscription
        const { error } = await supabase
          .from("user_subscriptions")
          .insert({ user_id: userId, plan_type: planType, is_certified: isCertified });

        if (error) throw error;
      }

      setUserSubscriptions((prev) => new Map(prev).set(userId, { user_id: userId, plan_type: planType, is_certified: isCertified }));
      toast({
        title: "Abonnement mis à jour",
        description: `L'abonnement a été changé en ${planType}.`,
      });
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'abonnement.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendEmailToUser = async (email: string, userId: string) => {
    setLoading(true);
    try {
      // Get user's email from auth (would need edge function for this)
      // For now, show the dialog to send system message instead
      toast({
        title: "Fonctionnalité en développement",
        description: "L'envoi d'email direct arrive bientôt. Utilisez les messages système.",
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter((p) =>
    p.username.toLowerCase().includes(searchUser.toLowerCase())
  );

  const getRoleBadge = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      case "moderator":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Shield className="h-3 w-3 mr-1" />
            Modérateur
          </Badge>
        );
      default:
        return null;
    }
  };

  const getSubscriptionBadge = (sub: UserSubscription | undefined) => {
    if (!sub) return null;
    
    if (sub.plan_type === "elite") {
      return (
        <Badge className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30">
          <Crown className="h-3 w-3 mr-1" />
          Élite
          {sub.is_certified && <CheckCircle2 className="h-3 w-3 ml-1" />}
        </Badge>
      );
    }
    if (sub.plan_type === "premium") {
      return (
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
          <Award className="h-3 w-3 mr-1" />
          Premium
          {sub.is_certified && <CheckCircle2 className="h-3 w-3 ml-1" />}
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestion des utilisateurs ({profiles.length})
            </CardTitle>
            <CardDescription>Gérez les rôles et abonnements des utilisateurs</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {filteredProfiles.map((profile) => {
              const role = userRoles.get(profile.id);
              const subscription = userSubscriptions.get(profile.id);

              return (
                <div
                  key={profile.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {profile.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{profile.username}</p>
                      {getRoleBadge(role)}
                      {getSubscriptionBadge(subscription)}
                    </div>
                    {profile.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{profile.bio}</p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      Inscrit le {new Date(profile.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Settings2 className="h-4 w-4" />
                          Gérer
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={profile.avatar_url || undefined} />
                              <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {profile.username}
                          </DialogTitle>
                          <DialogDescription>
                            Gérez les permissions et l'abonnement de cet utilisateur
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {/* Role Selection */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                              <Shield className="h-4 w-4 text-primary" />
                              Rôle
                            </label>
                            <Select
                              value={role || "user"}
                              onValueChange={(value) => handleRoleChange(profile.id, value as "admin" | "moderator" | "user")}
                              disabled={loading}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Utilisateur</SelectItem>
                                <SelectItem value="moderator">Modérateur</SelectItem>
                                <SelectItem value="admin">Administrateur</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Subscription Selection */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                              <Crown className="h-4 w-4 text-primary" />
                              Abonnement
                            </label>
                            <Select
                              value={subscription?.plan_type || "free"}
                              onValueChange={(value) => 
                                handleSubscriptionChange(
                                  profile.id, 
                                  value, 
                                  value !== "free"
                                )
                              }
                              disabled={loading}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Gratuit</SelectItem>
                                <SelectItem value="premium">Premium (Certifié)</SelectItem>
                                <SelectItem value="elite">Élite (Certifié)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}