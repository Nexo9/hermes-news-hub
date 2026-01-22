import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, 
  Loader2, 
  Hash,
  Image as ImageIcon,
  Smile
} from "lucide-react";
import { HashtagBadge } from "./HashtagBadge";
import { INTEREST_CATEGORIES } from "./CategorySidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface ComposeThreadProps {
  userProfile: Profile | null;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isPosting: boolean;
  maxLength?: number;
}

export const ComposeThread = ({
  userProfile,
  value,
  onChange,
  onSubmit,
  isPosting,
  maxLength = 500
}: ComposeThreadProps) => {
  const [showHashtagPicker, setShowHashtagPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertHashtag = (hashtag: string) => {
    const newValue = value + (value.endsWith(" ") || value === "" ? "" : " ") + `#${hashtag} `;
    onChange(newValue);
    setShowHashtagPicker(false);
    textareaRef.current?.focus();
  };

  const charCount = value.length;
  const isOverLimit = charCount > maxLength;
  const charPercentage = Math.min((charCount / maxLength) * 100, 100);

  return (
    <div className="p-4 border-b border-border bg-card/50">
      <div className="flex gap-3">
        <Avatar className="h-12 w-12 shrink-0 ring-2 ring-primary/20">
          <AvatarImage src={userProfile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">
            {userProfile?.username?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <Textarea
            ref={textareaRef}
            placeholder="Qu'avez-vous à dire ? Utilisez # pour ajouter des catégories..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-28 resize-none border-0 focus-visible:ring-0 p-0 text-lg placeholder:text-muted-foreground/60 bg-transparent"
            maxLength={maxLength + 50}
          />
          
          {/* Toolbar */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-1">
              <Popover open={showHashtagPicker} onOpenChange={setShowHashtagPicker}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-primary hover:bg-primary/10"
                  >
                    <Hash className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-3 border-b border-border">
                    <h4 className="font-medium text-sm">Ajouter un hashtag</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cliquez pour ajouter à votre message
                    </p>
                  </div>
                  <ScrollArea className="h-64">
                    <div className="p-3 flex flex-wrap gap-2">
                      {INTEREST_CATEGORIES.map((cat) => (
                        <HashtagBadge
                          key={cat.id}
                          tag={cat.hashtag}
                          onClick={() => insertHashtag(cat.hashtag)}
                          className="text-xs"
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                disabled
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                disabled
              >
                <Smile className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Character count */}
              <div className="flex items-center gap-2">
                <div className="relative h-6 w-6">
                  <svg className="h-6 w-6 -rotate-90" viewBox="0 0 24 24">
                    <circle
                      className="text-border"
                      strokeWidth="2"
                      stroke="currentColor"
                      fill="transparent"
                      r="10"
                      cx="12"
                      cy="12"
                    />
                    <circle
                      className={isOverLimit ? "text-destructive" : "text-primary"}
                      strokeWidth="2"
                      strokeDasharray={`${charPercentage * 0.628} 100`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="10"
                      cx="12"
                      cy="12"
                    />
                  </svg>
                </div>
                <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {charCount}/{maxLength}
                </span>
              </div>
              
              <Button 
                onClick={onSubmit} 
                disabled={!value.trim() || isPosting || isOverLimit}
                className="gap-2 px-6"
              >
                {isPosting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Publier
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
