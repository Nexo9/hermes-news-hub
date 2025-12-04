import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ReportUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUsername: string;
  reporterId: string;
}

const REPORT_REASONS = [
  { value: "harassment", label: "Harcèlement ou intimidation" },
  { value: "spam", label: "Spam ou publicité non sollicitée" },
  { value: "inappropriate", label: "Contenu inapproprié" },
  { value: "impersonation", label: "Usurpation d'identité" },
  { value: "hate_speech", label: "Discours haineux" },
  { value: "misinformation", label: "Désinformation" },
  { value: "other", label: "Autre raison" },
];

export const ReportUserDialog = ({
  isOpen,
  onClose,
  reportedUserId,
  reportedUsername,
  reporterId,
}: ReportUserDialogProps) => {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une raison",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("user_reports").insert({
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      reason,
      description: description.trim() || null,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le signalement",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Signalement envoyé",
      description: "Merci, notre équipe examinera votre signalement",
    });

    setReason("");
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Signaler @{reportedUsername}
          </DialogTitle>
          <DialogDescription>
            Aidez-nous à maintenir une communauté saine en signalant les comportements inappropriés.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Raison du signalement</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Détails supplémentaires (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Décrivez le problème plus en détail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-24"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={loading || !reason}
              variant="destructive"
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Envoyer le signalement"
              )}
            </Button>
            <Button onClick={onClose} variant="outline">
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
