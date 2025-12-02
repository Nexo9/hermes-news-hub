import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Upload, X } from "lucide-react";

interface Friend {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface CreateGroupDialogProps {
  userId: string;
  onGroupCreated?: () => void;
}

export function CreateGroupDialog({ userId, onGroupCreated }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchFriends();
    }
  }, [open, userId]);

  const fetchFriends = async () => {
    // Get mutual friends (users who follow each other)
    const { data: following } = await supabase
      .from("subscriptions")
      .select("following_id")
      .eq("follower_id", userId);

    const { data: followers } = await supabase
      .from("subscriptions")
      .select("follower_id")
      .eq("following_id", userId);

    if (following && followers) {
      const followingIds = following.map((f) => f.following_id);
      const followerIds = followers.map((f) => f.follower_id);
      const mutualIds = followingIds.filter((id) => followerIds.includes(id));

      if (mutualIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", mutualIds);

        if (profiles) {
          setFriends(profiles);
        }
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGroupImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleFriend = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter((id) => id !== friendId));
    } else if (selectedFriends.length < 29) {
      setSelectedFriends([...selectedFriends, friendId]);
    } else {
      toast({
        title: "Limite atteinte",
        description: "Un groupe peut contenir maximum 30 personnes (vous inclus).",
        variant: "destructive",
      });
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez donner un nom au groupe.",
        variant: "destructive",
      });
      return;
    }

    if (selectedFriends.length === 0) {
      toast({
        title: "Erreur",
        description: "Ajoutez au moins un membre au groupe.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl: string | null = null;

      // Upload image if provided
      if (groupImage) {
        const fileExt = groupImage.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("group-images")
          .upload(fileName, groupImage);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("group-images")
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      // Create the group
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: groupName,
          image_url: imageUrl,
          created_by: userId,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin member
      const { error: creatorError } = await supabase
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: userId,
          role: "admin",
        });

      if (creatorError) throw creatorError;

      // Add selected friends as members
      const memberInserts = selectedFriends.map((friendId) => ({
        group_id: group.id,
        user_id: friendId,
        role: "member",
      }));

      const { error: membersError } = await supabase
        .from("group_members")
        .insert(memberInserts);

      if (membersError) throw membersError;

      toast({
        title: "Groupe créé",
        description: `Le groupe "${groupName}" a été créé avec ${selectedFriends.length + 1} membres.`,
      });

      // Reset form
      setGroupName("");
      setGroupImage(null);
      setImagePreview(null);
      setSelectedFriends([]);
      setOpen(false);
      onGroupCreated?.();
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le groupe.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          Créer un groupe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un groupe</DialogTitle>
          <DialogDescription>
            Créez un groupe avec jusqu'à 30 membres pour discuter ensemble.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Image */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                {imagePreview ? (
                  <AvatarImage src={imagePreview} />
                ) : (
                  <AvatarFallback className="bg-primary/20">
                    <Users className="h-8 w-8 text-primary" />
                  </AvatarFallback>
                )}
              </Avatar>
              {imagePreview && (
                <button
                  onClick={() => {
                    setGroupImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="group-image" className="cursor-pointer">
                <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Upload className="h-4 w-4" />
                  Ajouter une image
                </div>
              </Label>
              <Input
                id="group-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>

          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="group-name">Nom du groupe</Label>
            <Input
              id="group-name"
              placeholder="Ex: Amis du lycée"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          {/* Members Selection */}
          <div className="space-y-2">
            <Label>
              Membres ({selectedFriends.length}/29 sélectionnés)
            </Label>
            <ScrollArea className="h-48 border rounded-lg p-2">
              {friends.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun ami à ajouter. Suivez des personnes qui vous suivent pour les ajouter.
                </p>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer"
                      onClick={() => toggleFriend(friend.id)}
                    >
                      <Checkbox
                        checked={selectedFriends.includes(friend.id)}
                        onCheckedChange={() => toggleFriend(friend.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={friend.avatar_url || undefined} />
                        <AvatarFallback>
                          {friend.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{friend.username}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreateGroup}
            disabled={isLoading || !groupName.trim() || selectedFriends.length === 0}
            className="w-full"
          >
            {isLoading ? "Création..." : "Créer le groupe"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
