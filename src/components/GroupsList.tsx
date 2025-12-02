import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users } from "lucide-react";
import { CreateGroupDialog } from "./CreateGroupDialog";

interface Group {
  id: string;
  name: string;
  image_url: string | null;
  member_count: number;
}

interface GroupsListProps {
  userId: string;
}

export function GroupsList({ userId }: GroupsListProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGroups();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("groups-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "groups" },
        () => fetchGroups()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_members" },
        () => fetchGroups()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchGroups = async () => {
    setIsLoading(true);

    // Get groups where user is a member
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (memberships && memberships.length > 0) {
      const groupIds = memberships.map((m) => m.group_id);

      const { data: groupsData } = await supabase
        .from("groups")
        .select("id, name, image_url")
        .in("id", groupIds);

      if (groupsData) {
        // Get member counts for each group
        const groupsWithCounts = await Promise.all(
          groupsData.map(async (group) => {
            const { count } = await supabase
              .from("group_members")
              .select("*", { count: "exact", head: true })
              .eq("group_id", group.id);

            return {
              ...group,
              member_count: count || 0,
            };
          })
        );

        setGroups(groupsWithCounts);
      }
    } else {
      setGroups([]);
    }

    setIsLoading(false);
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Mes Groupes
        </CardTitle>
        <CreateGroupDialog userId={userId} onGroupCreated={fetchGroups} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Vous n'êtes membre d'aucun groupe.
          </p>
        ) : (
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    {group.image_url ? (
                      <AvatarImage src={group.image_url} />
                    ) : (
                      <AvatarFallback className="bg-primary/20">
                        <Users className="h-5 w-5 text-primary" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.member_count} membre{group.member_count > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
