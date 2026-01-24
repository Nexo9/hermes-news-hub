import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  MessageCircle, 
  MoreHorizontal, 
  Heart, 
  Repeat2, 
  Share, 
  Bookmark, 
  X, 
  Image as ImageIcon,
  Send,
  AtSign
} from "lucide-react";
import { ThreadReplies } from "./ThreadReplies";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Thread {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  image_url?: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
  replyCount?: number;
  likeCount?: number;
  isLiked?: boolean;
}

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface ThreadSectionEnhancedProps {
  newsId: string | null;
  newsTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ThreadSectionEnhanced = ({ newsId, newsTitle, isOpen, onClose }: ThreadSectionEnhancedProps) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [newThread, setNewThread] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionResults, setMentionResults] = useState<Profile[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", data.user.id)
          .single();
        setUserProfile(profile);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (newsId && isOpen) {
      fetchThreads();
    }
  }, [newsId, isOpen]);

  // Search for users to mention
  useEffect(() => {
    const searchMentions = async () => {
      if (mentionSearch.length < 2) {
        setMentionResults([]);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .ilike("username", `%${mentionSearch}%`)
        .limit(5);

      setMentionResults(data || []);
    };

    const debounce = setTimeout(searchMentions, 300);
    return () => clearTimeout(debounce);
  }, [mentionSearch]);

  const fetchThreads = async () => {
    if (!newsId) return;

    const { data: threadsData, error: threadsError } = await supabase
      .from("threads")
      .select("*")
      .eq("news_id", newsId)
      .order("created_at", { ascending: false });

    if (threadsError) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les discussions",
        variant: "destructive",
      });
      return;
    }

    if (threadsData && threadsData.length > 0) {
      const userIds = [...new Set(threadsData.map(t => t.user_id))];
      const threadIds = threadsData.map(t => t.id);

      const [profilesResult, repliesCountResult] = await Promise.all([
        supabase.from("profiles").select("id, username, avatar_url").in("id", userIds),
        supabase.from("thread_replies").select("thread_id").in("thread_id", threadIds),
      ]);

      const profilesMap = new Map(profilesResult.data?.map(p => [p.id, p]) || []);
      
      const replyCountMap = new Map<string, number>();
      repliesCountResult.data?.forEach(r => {
        replyCountMap.set(r.thread_id, (replyCountMap.get(r.thread_id) || 0) + 1);
      });

      const threadsWithProfiles = threadsData.map(thread => ({
        ...thread,
        profiles: profilesMap.get(thread.user_id) || null,
        replyCount: replyCountMap.get(thread.id) || 0,
        likeCount: Math.floor(Math.random() * 50),
        isLiked: false,
      }));
      setThreads(threadsWithProfiles);
    } else {
      setThreads([]);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "L'image doit faire moins de 5 Mo",
          variant: "destructive",
        });
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const pos = e.target.selectionStart;
    setNewThread(value);
    setCursorPosition(pos);

    // Check for @ mention
    const textBeforeCursor = value.substring(0, pos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (atMatch) {
      setShowMentionPicker(true);
      setMentionSearch(atMatch[1]);
    } else {
      setShowMentionPicker(false);
      setMentionSearch("");
    }
  };

  const insertMention = (username: string) => {
    const textBeforeCursor = newThread.substring(0, cursorPosition);
    const textAfterCursor = newThread.substring(cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    
    const newText = textBeforeCursor.substring(0, atIndex) + `@${username} ` + textAfterCursor;
    setNewThread(newText);
    setShowMentionPicker(false);
    setMentionSearch("");
    textareaRef.current?.focus();
  };

  const handleSubmit = async () => {
    if ((!newThread.trim() && !selectedImage) || !newsId || !user) return;

    setIsLoading(true);

    try {
      let imageUrl = null;

      // Upload image if selected
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `thread-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('message-media')
          .upload(filePath, selectedImage);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('message-media')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      // Create thread with optional image_url (stored in content as JSON or separate field)
      const threadContent = imageUrl 
        ? JSON.stringify({ text: newThread, image: imageUrl })
        : newThread;

      const { error } = await supabase.from("threads").insert({
        news_id: newsId,
        user_id: user.id,
        content: threadContent,
      });

      if (error) throw error;

      setNewThread("");
      removeImage();
      fetchThreads();
      toast({
        title: "Publié",
        description: "Votre commentaire a été partagé",
      });
    } catch (error) {
      console.error("Post error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de publier votre message",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const toggleLike = (threadId: string) => {
    setThreads(prev => prev.map(t => 
      t.id === threadId 
        ? { ...t, isLiked: !t.isLiked, likeCount: t.isLiked ? (t.likeCount || 1) - 1 : (t.likeCount || 0) + 1 }
        : t
    ));
  };

  // Parse thread content (handle JSON with image)
  const parseContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      return { text: parsed.text || "", image: parsed.image || null };
    } catch {
      return { text: content, image: null };
    }
  };

  // Render content with mentions highlighted
  const renderContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        return (
          <span key={idx} className="text-primary font-medium hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-lg p-0 bg-background border-l border-border overflow-hidden flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">Commentaires</SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => onClose()} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1 pr-8">{newsTitle}</p>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Compose Box */}
          {user && (
            <div className="p-4 border-b border-border">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={userProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userProfile?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <Textarea
                      ref={textareaRef}
                      placeholder="Partagez votre analyse... Utilisez @ pour mentionner quelqu'un"
                      value={newThread}
                      onChange={handleTextChange}
                      className="min-h-[80px] border-0 bg-transparent resize-none focus-visible:ring-0 p-0 text-base placeholder:text-muted-foreground/60"
                    />
                    
                    {/* Mention Picker */}
                    <AnimatePresence>
                      {showMentionPicker && mentionResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden"
                        >
                          {mentionResults.map((profile) => (
                            <button
                              key={profile.id}
                              onClick={() => insertMention(profile.username)}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-left transition-colors"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={profile.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {profile.username[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">@{profile.username}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative mt-2 inline-block">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-h-32 rounded-lg border border-border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={removeImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        onClick={() => {
                          setNewThread(prev => prev + "@");
                          textareaRef.current?.focus();
                        }}
                      >
                        <AtSign className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={handleSubmit}
                      disabled={(!newThread.trim() && !selectedImage) || isLoading}
                      size="sm"
                      className="rounded-full px-4 gap-2"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {isLoading ? "Publication..." : "Publier"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!user && (
            <div className="p-6 border-b border-border text-center">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">Connectez-vous pour participer</p>
            </div>
          )}

          {/* Threads List */}
          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mb-4 opacity-30" />
              <p className="font-medium">Aucun commentaire</p>
              <p className="text-sm mt-1">Soyez le premier à commenter</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {threads.map((thread, index) => {
                const { text, image } = parseContent(thread.content);
                
                return (
                  <motion.article
                    key={thread.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-border hover:bg-accent/5 transition-colors"
                  >
                    <div className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={thread.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-sm">
                            {thread.profiles?.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 text-sm">
                            <span className="font-semibold text-foreground truncate max-w-[120px]">
                              {thread.profiles?.username || 'Utilisateur'}
                            </span>
                            <span className="text-muted-foreground truncate">
                              @{thread.profiles?.username || 'user'}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground text-xs whitespace-nowrap">
                              {formatDistanceToNow(new Date(thread.created_at), {
                                addSuffix: false,
                                locale: fr,
                              })}
                            </span>
                            <div className="ml-auto flex-shrink-0">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Signaler</DropdownMenuItem>
                                  <DropdownMenuItem>Copier le lien</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Body with mentions */}
                          <p className="text-foreground mt-1 text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                            {renderContent(text)}
                          </p>

                          {/* Image if present */}
                          {image && (
                            <div className="mt-2">
                              <img 
                                src={image} 
                                alt="Thread image" 
                                className="max-h-64 rounded-xl border border-border cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(image, '_blank')}
                              />
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center justify-between mt-3 max-w-[400px]">
                            <button
                              onClick={() => setExpandedThread(expandedThread === thread.id ? null : thread.id)}
                              className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors group"
                            >
                              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors -ml-2">
                                <MessageCircle className="h-4 w-4" />
                              </div>
                              <span className="text-xs">{thread.replyCount || ''}</span>
                            </button>

                            <button className="flex items-center gap-1 text-muted-foreground hover:text-green-500 transition-colors group">
                              <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                                <Repeat2 className="h-4 w-4" />
                              </div>
                            </button>

                            <button
                              onClick={() => toggleLike(thread.id)}
                              className={`flex items-center gap-1 transition-colors group ${
                                thread.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                              }`}
                            >
                              <div className="p-2 rounded-full group-hover:bg-red-500/10 transition-colors">
                                <Heart className={`h-4 w-4 ${thread.isLiked ? 'fill-current' : ''}`} />
                              </div>
                              <span className="text-xs">{thread.likeCount || ''}</span>
                            </button>

                            <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors group">
                              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                                <Bookmark className="h-4 w-4" />
                              </div>
                            </button>

                            <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors group">
                              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                                <Share className="h-4 w-4" />
                              </div>
                            </button>
                          </div>

                          {/* Thread Replies */}
                          <AnimatePresence>
                            {expandedThread === thread.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <ThreadReplies threadId={thread.id} currentUserId={user?.id || null} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
