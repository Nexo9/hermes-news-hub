import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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

  // Show consent modal
  if (!hasConsent) {
    return (
      <div className="fixed inset-0 z-[100] bg-background">
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="border-b border-border bg-background/80 backdrop-blur-lg py-6">
            <div className="container mx-auto px-4 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">HERMÈS</h1>
              </div>
              <p className="text-muted-foreground">Bienvenue sur notre plateforme d'information</p>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
              <div className="p-6 bg-muted/50 border-b border-border">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Conditions Générales d'Utilisation
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Veuillez lire et accepter nos conditions pour accéder à HERMÈS
                </p>
              </div>

              <ScrollArea className="h-[400px] p-6">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <h3>1. Présentation de la plateforme</h3>
                  <p>
                    HERMÈS est une plateforme d'information et de réseau social développée par Ibrahim Mohamed Antik. 
                    Notre mission est de fournir une information neutre, vérifiée et accessible à tous. 
                    En utilisant ce service, vous acceptez de respecter les présentes conditions.
                  </p>

                  <h3>2. Inscription et compte utilisateur</h3>
                  <p>
                    L'accès à certaines fonctionnalités nécessite la création d'un compte. Vous vous engagez à :
                  </p>
                  <ul>
                    <li>Fournir des informations exactes et à jour</li>
                    <li>Maintenir la confidentialité de vos identifiants</li>
                    <li>Ne pas créer plusieurs comptes</li>
                    <li>Signaler toute utilisation non autorisée de votre compte</li>
                  </ul>

                  <h3>3. Règles de conduite</h3>
                  <p>Sur HERMÈS, vous vous engagez à ne pas :</p>
                  <ul>
                    <li>Publier de contenus haineux, discriminatoires ou illégaux</li>
                    <li>Harceler, menacer ou intimider d'autres utilisateurs</li>
                    <li>Diffuser de fausses informations de manière intentionnelle</li>
                    <li>Usurper l'identité d'une autre personne</li>
                    <li>Utiliser la plateforme à des fins commerciales non autorisées</li>
                    <li>Tenter de compromettre la sécurité du système</li>
                  </ul>

                  <h3>4. Contenus et propriété intellectuelle</h3>
                  <p>
                    Les articles synthétisés par Antik-IA sont générés à partir de sources publiques et citées. 
                    Vous conservez les droits sur vos contenus originaux publiés, mais accordez à HERMÈS une 
                    licence d'utilisation pour leur affichage sur la plateforme.
                  </p>

                  <h3>5. Modération et sanctions</h3>
                  <p>
                    L'équipe HERMÈS se réserve le droit de modérer les contenus et de suspendre ou supprimer 
                    tout compte en violation des présentes conditions, sans préavis ni indemnité.
                  </p>

                  <h3>6. Protection des données personnelles</h3>
                  <p>
                    Vos données sont collectées et traitées conformément au RGPD. Nous collectons :
                  </p>
                  <ul>
                    <li>Données d'inscription (email, nom d'utilisateur)</li>
                    <li>Données de profil (avatar, bio, centres d'intérêt)</li>
                    <li>Données d'utilisation (interactions, préférences)</li>
                    <li>Cookies techniques et analytiques</li>
                  </ul>
                  <p>
                    Vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
                  </p>

                  <h3>7. Cookies</h3>
                  <p>
                    HERMÈS utilise des cookies pour :
                  </p>
                  <ul>
                    <li><strong>Cookies essentiels :</strong> authentification, sécurité, préférences</li>
                    <li><strong>Cookies analytiques :</strong> amélioration de l'expérience utilisateur</li>
                    <li><strong>Cookies de personnalisation :</strong> adaptation du contenu à vos intérêts</li>
                  </ul>

                  <h3>8. Engagement humanitaire</h3>
                  <p>
                    HERMÈS soutient activement les causes humanitaires, notamment en Palestine, au Congo et au Soudan. 
                    Une partie des revenus générés par les abonnements Premium est reversée à des organisations 
                    humanitaires reconnues. En utilisant HERMÈS, vous contribuez indirectement à ces causes.
                  </p>

                  <h3>9. Limitation de responsabilité</h3>
                  <p>
                    HERMÈS fournit un service d'agrégation et de synthèse d'informations. Nous nous efforçons 
                    d'assurer l'exactitude des contenus, mais ne pouvons garantir l'absence d'erreurs. 
                    Les utilisateurs sont encouragés à consulter les sources originales pour vérification.
                  </p>

                  <h3>10. Modifications des conditions</h3>
                  <p>
                    Ces conditions peuvent être modifiées à tout moment. Les utilisateurs seront informés 
                    des changements significatifs et devront accepter les nouvelles conditions pour continuer 
                    à utiliser le service.
                  </p>

                  <h3>11. Droit applicable</h3>
                  <p>
                    Les présentes conditions sont régies par le droit français. Tout litige sera soumis 
                    aux tribunaux compétents.
                  </p>

                  <Separator className="my-6" />

                  <p className="text-center text-muted-foreground">
                    Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </ScrollArea>

              <div className="p-6 bg-muted/30 border-t border-border space-y-4">
                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox 
                      checked={termsAccepted} 
                      onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      <FileText className="w-4 h-4 inline mr-1 text-primary" />
                      J'ai lu et j'accepte les <strong>Conditions Générales d'Utilisation</strong> de HERMÈS
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox 
                      checked={cookiesAccepted} 
                      onCheckedChange={(checked) => setCookiesAccepted(checked === true)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      <Cookie className="w-4 h-4 inline mr-1 text-primary" />
                      J'accepte l'utilisation des <strong>cookies</strong> nécessaires au fonctionnement du site
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox 
                      checked={privacyAccepted} 
                      onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      <Shield className="w-4 h-4 inline mr-1 text-primary" />
                      J'accepte la <strong>politique de confidentialité</strong> et le traitement de mes données personnelles
                    </span>
                  </label>
                </div>

                {/* Accept Button */}
                <Button 
                  onClick={handleAccept} 
                  disabled={!canAccept}
                  className="w-full bg-primary hover:bg-primary/90 h-12 text-lg"
                >
                  {canAccept ? "Accéder à HERMÈS" : "Veuillez accepter toutes les conditions"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  <Heart className="w-3 h-3 inline mr-1 text-destructive" />
                  En accédant à HERMÈS, vous soutenez nos causes humanitaires
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // User has consented, show the app
  return <>{children}</>;
};
