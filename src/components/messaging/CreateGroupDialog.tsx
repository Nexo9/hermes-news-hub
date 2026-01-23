import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Upload, X, Camera } from "lucide-react";
import { Friend } from "./types";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onGroupCreated: (conversationId: string) => void;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  userId,
  onGroupCreated,
}: CreateGroupDialogProps) {
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
      setGroupName("");
      setGroupImage(null);
      setImagePreview(null);
      setSelectedFriends([]);
    }
  }, [open, userId]);

  const fetchFriends = async () => {
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
          .select("id, username, avatar_url, bio")
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
        description: "Un groupe peut contenir maximum 30 personnes.",
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

      // Create conversation for the group
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      if (convError) throw convError;

      // Create the group linked to conversation
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: groupName,
          image_url: imageUrl,
          created_by: userId,
          conversation_id: conversation.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add all members to conversation
      const allMembers = [userId, ...selectedFriends];
      const participantInserts = allMembers.map((memberId) => ({
        conversation_id: conversation.id,
        user_id: memberId,
      }));

      await supabase
        .from("conversation_participants")
        .insert(participantInserts);

      // Add creator as admin
      await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: userId,
        role: "admin",
      });

      // Add selected friends as members
      const memberInserts = selectedFriends.map((friendId) => ({
        group_id: group.id,
        user_id: friendId,
        role: "member",
      }));

      await supabase.from("group_members").insert(memberInserts);

      toast({
        title: "Groupe créé",
        description: `Le groupe "${groupName}" a été créé.`,
      });

      onOpenChange(false);
      onGroupCreated(conversation.id);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Créer un groupe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group Image */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-primary/30">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Group"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-primary/50" />
                )}
              </div>
              <Label
                htmlFor="group-image"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Upload className="h-4 w-4 text-primary-foreground" />
              </Label>
              <Input
                id="group-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <button
                  onClick={() => {
                    setGroupImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive flex items-center justify-center"
                >
                  <X className="h-3 w-3 text-destructive-foreground" />
                </button>
              )}
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
              Membres ({selectedFriends.length}/29)
            </Label>
            <ScrollArea className="h-48 border border-border rounded-xl p-2">
              {friends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun ami à ajouter</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {friends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => toggleFriend(friend.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedFriends.includes(friend.id)}
                        onCheckedChange={() => toggleFriend(friend.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={friend.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {friend.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium flex-1 text-left truncate">
                        @{friend.username}
                      </span>
                    </button>
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
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
                Création...
              </>
            ) : (
              "Créer le groupe"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
