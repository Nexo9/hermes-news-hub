import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Cookie, FileText, Heart } from "lucide-react";

const CONSENT_KEY = "hermes_consent_accepted";
const CONSENT_VERSION = "1.0";

interface ConsentModalProps {
  children: React.ReactNode;
}

export const ConsentModal = ({ children }: ConsentModalProps) => {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent) {
      try {
        const parsed = JSON.parse(consent);
        if (parsed.version === CONSENT_VERSION && parsed.accepted) {
          setHasConsent(true);
          return;
        }
      } catch {
        // Invalid consent, show modal
      }
    }
    setHasConsent(false);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      version: CONSENT_VERSION,
      accepted: true,
      timestamp: new Date().toISOString()
    }));
    setHasConsent(true);
  };

  const canAccept = termsAccepted && cookiesAccepted && privacyAccepted;

  // Loading state
  if (hasConsent === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {children}
      
      <Dialog open={!hasConsent} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden" hideCloseButton>
          <DialogHeader className="pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">Bienvenue sur HERMÈS</DialogTitle>
                <p className="text-sm text-muted-foreground">Veuillez accepter nos conditions pour continuer</p>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="h-[300px] pr-4">
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
              <h4 className="text-base font-semibold">1. Présentation</h4>
              <p className="text-muted-foreground">
                HERMÈS est une plateforme d'information développée par Ibrahim Mohamed Antik. 
                En utilisant ce service, vous acceptez les présentes conditions.
              </p>

              <h4 className="text-base font-semibold">2. Règles de conduite</h4>
              <p className="text-muted-foreground">Vous vous engagez à ne pas publier de contenus haineux, discriminatoires ou illégaux, 
              à ne pas harceler d'autres utilisateurs et à ne pas diffuser de fausses informations.</p>

              <h4 className="text-base font-semibold">3. Protection des données</h4>
              <p className="text-muted-foreground">
                Vos données sont collectées conformément au RGPD : email, profil, interactions.
                Vous disposez d'un droit d'accès, de rectification et de suppression.
              </p>

              <h4 className="text-base font-semibold">4. Cookies</h4>
              <p className="text-muted-foreground">
                HERMÈS utilise des cookies essentiels (authentification, sécurité), 
                analytiques (amélioration UX) et de personnalisation (contenu adapté).
              </p>

              <h4 className="text-base font-semibold">5. Engagement humanitaire</h4>
              <p className="text-muted-foreground">
                HERMÈS soutient la Palestine, le Congo et le Soudan. 
                Une partie des revenus est reversée à des organisations humanitaires.
              </p>

              <h4 className="text-base font-semibold">6. Modération</h4>
              <p className="text-muted-foreground">
                L'équipe HERMÈS peut modérer les contenus et suspendre tout compte en violation des conditions.
              </p>
            </div>
          </ScrollArea>

          <div className="pt-4 border-t border-border space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <Checkbox 
                checked={termsAccepted} 
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground">
                <FileText className="w-4 h-4 inline mr-1 text-primary" />
                J'accepte les <strong>CGU</strong>
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <Checkbox 
                checked={cookiesAccepted} 
                onCheckedChange={(checked) => setCookiesAccepted(checked === true)}
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground">
                <Cookie className="w-4 h-4 inline mr-1 text-primary" />
                J'accepte les <strong>cookies</strong>
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <Checkbox 
                checked={privacyAccepted} 
                onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground">
                <Shield className="w-4 h-4 inline mr-1 text-primary" />
                J'accepte la <strong>politique de confidentialité</strong>
              </span>
            </label>

            <Button 
              onClick={handleAccept} 
              disabled={!canAccept}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {canAccept ? "Accéder à HERMÈS" : "Acceptez toutes les conditions"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              <Heart className="w-3 h-3 inline mr-1 text-destructive" />
              En accédant, vous soutenez nos causes humanitaires
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
