import React from 'react';
import { ArrowLeft, Shield, FileText, Users, AlertTriangle, Scale, Globe, Lock, Mail, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const TermsOfUse = () => {
  const sections = [
    {
      icon: BookOpen,
      title: "1. Présentation de la Plateforme HERMÈS",
      content: `HERMÈS est une plateforme d'information neutre et sociale qui vise à fournir des actualités synthétisées de manière objective, sans biais éditorial. Notre mission est de démocratiser l'accès à l'information en utilisant des techniques avancées de synthèse extractive pour garantir la neutralité des contenus.

La plateforme combine un fil d'actualités avec des fonctionnalités sociales permettant aux utilisateurs de discuter et de partager leurs opinions sur les sujets d'actualité. HERMÈS utilise la technologie Antik-IA pour analyser et synthétiser les informations provenant de sources multiples.

En utilisant HERMÈS, vous reconnaissez avoir lu, compris et accepté l'intégralité des présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser la plateforme.`
    },
    {
      icon: Users,
      title: "2. Inscription et Compte Utilisateur",
      content: `Pour accéder à certaines fonctionnalités de HERMÈS, vous devez créer un compte utilisateur. Lors de l'inscription, vous vous engagez à :

• Fournir des informations exactes, complètes et à jour
• Maintenir la confidentialité de vos identifiants de connexion
• Notifier immédiatement toute utilisation non autorisée de votre compte
• Être âgé d'au moins 13 ans pour utiliser la plateforme
• Ne pas créer de compte pour une autre personne sans son consentement explicite

Vous êtes entièrement responsable de toutes les activités effectuées depuis votre compte. HERMÈS se réserve le droit de suspendre ou de supprimer tout compte qui enfreindrait ces conditions ou serait utilisé de manière frauduleuse.

Le nom d'utilisateur que vous choisissez ne doit pas être offensant, trompeur ou porter atteinte aux droits d'autrui. HERMÈS se réserve le droit de modifier ou de supprimer tout nom d'utilisateur inapproprié.`
    },
    {
      icon: Shield,
      title: "3. Règles de Conduite et Comportement",
      content: `En utilisant HERMÈS, vous vous engagez à respecter les règles de conduite suivantes :

INTERDICTIONS :
• Publier du contenu illégal, diffamatoire, menaçant, harcelant, obscène ou discriminatoire
• Usurper l'identité d'une autre personne ou entité
• Diffuser des informations fausses ou trompeuses de manière délibérée
• Spammer, publier des publicités non sollicitées ou du contenu promotionnel
• Tenter d'accéder aux comptes d'autres utilisateurs
• Interférer avec le fonctionnement normal de la plateforme
• Collecter des informations personnelles sur d'autres utilisateurs sans leur consentement
• Utiliser des bots, scripts ou outils automatisés sans autorisation
• Contourner les mesures de sécurité ou de modération

ENGAGEMENTS POSITIFS :
• Contribuer de manière constructive aux discussions
• Respecter les opinions divergentes et favoriser le dialogue
• Signaler tout contenu inapproprié aux modérateurs
• Citer vos sources lors du partage d'informations
• Respecter la vie privée des autres utilisateurs`
    },
    {
      icon: FileText,
      title: "4. Contenu et Propriété Intellectuelle",
      content: `PROPRIÉTÉ DU CONTENU DE LA PLATEFORME :
Tous les éléments de la plateforme HERMÈS (textes, graphiques, logos, images, vidéos, logiciels, base de données) sont protégés par les lois relatives à la propriété intellectuelle. Ils sont la propriété exclusive de HERMÈS ou de ses partenaires.

CONTENU GÉNÉRÉ PAR LES UTILISATEURS :
En publiant du contenu sur HERMÈS (commentaires, threads, messages), vous :
• Conservez vos droits de propriété intellectuelle sur ce contenu
• Accordez à HERMÈS une licence mondiale, non exclusive, gratuite et transférable pour utiliser, reproduire, modifier et distribuer ce contenu dans le cadre du fonctionnement de la plateforme
• Garantissez que vous disposez des droits nécessaires pour publier ce contenu
• Acceptez que ce contenu puisse être visible par d'autres utilisateurs selon vos paramètres de confidentialité

ARTICLES D'ACTUALITÉ :
Les synthèses d'actualités présentées sur HERMÈS sont générées à partir de sources multiples et attribuées à leurs sources originales. HERMÈS ne revendique pas la propriété du contenu original des articles mais uniquement des synthèses produites par ses algorithmes.`
    },
    {
      icon: Lock,
      title: "5. Protection des Données Personnelles",
      content: `HERMÈS s'engage à protéger vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD) et aux lois applicables.

DONNÉES COLLECTÉES :
• Informations d'identification (email, nom d'utilisateur)
• Données de profil (photo, biographie, bannière)
• Données d'utilisation (interactions, préférences, historique de navigation)
• Données techniques (adresse IP, type d'appareil, navigateur)

UTILISATION DES DONNÉES :
• Fourniture et amélioration des services
• Personnalisation de l'expérience utilisateur
• Communication avec les utilisateurs
• Analyse statistique et amélioration de la plateforme
• Prévention de la fraude et sécurité

VOS DROITS :
• Droit d'accès à vos données
• Droit de rectification
• Droit à l'effacement ("droit à l'oubli")
• Droit à la portabilité
• Droit d'opposition
• Droit de retirer votre consentement

Pour exercer ces droits, contactez-nous à : privacy@hermes-news.com

CONSERVATION DES DONNÉES :
Vos données sont conservées pendant la durée de votre inscription et jusqu'à 3 ans après la suppression de votre compte pour les obligations légales.`
    },
    {
      icon: AlertTriangle,
      title: "6. Limitations de Responsabilité",
      content: `HERMÈS met tout en œuvre pour fournir un service de qualité, mais ne peut garantir :

CONCERNANT LE SERVICE :
• La disponibilité continue et ininterrompue de la plateforme
• L'absence totale de bugs ou d'erreurs techniques
• La compatibilité avec tous les appareils et navigateurs
• La sauvegarde permanente de vos données en cas de défaillance technique

CONCERNANT LE CONTENU :
• L'exactitude, la complétude ou l'actualité des informations présentées
• La neutralité absolue des synthèses générées par l'IA
• La qualité du contenu généré par les utilisateurs
• L'absence de contenu offensant malgré nos efforts de modération

LIMITATIONS :
HERMÈS ne pourra être tenu responsable :
• Des dommages indirects, accessoires ou consécutifs
• Des pertes de données ou de revenus
• Des actions de tiers ou d'autres utilisateurs
• Des contenus accessibles via des liens externes
• Des interruptions de service dues à des cas de force majeure

La responsabilité de HERMÈS est limitée au montant des sommes effectivement versées par l'utilisateur au cours des 12 derniers mois, le cas échéant.`
    },
    {
      icon: Scale,
      title: "7. Modération et Sanctions",
      content: `HERMÈS dispose d'une équipe de modération chargée de veiller au respect des présentes conditions.

PROCESSUS DE MODÉRATION :
• Modération automatique par algorithmes de détection
• Modération humaine par notre équipe dédiée
• Système de signalement par les utilisateurs

SIGNALEMENT :
Tout utilisateur peut signaler un contenu qu'il estime contraire aux règles de la plateforme. Les signalements sont traités dans un délai de 24 à 72 heures.

SANCTIONS APPLICABLES :
• Avertissement pour les infractions mineures
• Suspension temporaire du compte (1 à 30 jours)
• Suppression de contenu sans préavis
• Bannissement définitif pour les infractions graves ou répétées
• Signalement aux autorités compétentes si nécessaire

RECOURS :
Vous pouvez contester une décision de modération en contactant notre équipe à : moderation@hermes-news.com. Les recours sont examinés dans un délai de 7 jours ouvrables.

TRANSPARENCE :
HERMÈS publie régulièrement des rapports de transparence sur ses activités de modération.`
    },
    {
      icon: Globe,
      title: "8. Fonctionnalités Spécifiques",
      content: `CARTE DES ACTUALITÉS (NEWS MAP) :
La carte interactive permet de visualiser les actualités géolocalisées dans le monde. Les données de localisation sont approximatives et basées sur les informations contenues dans les articles sources.

SYSTÈME DE THREADS :
Les discussions sur les articles sont publiques par défaut. Les utilisateurs sont responsables de leurs contributions et doivent respecter les règles de la communauté.

MESSAGERIE PRIVÉE :
La messagerie est réservée aux utilisateurs ayant une relation d'amitié mutuelle. Les messages peuvent inclure du texte, des images et des messages vocaux. HERMÈS n'accède pas au contenu des messages sauf en cas de signalement.

GROUPES :
Les groupes sont limités à 30 membres. Le créateur du groupe en est l'administrateur et peut modérer les membres. Les groupes peuvent être utilisés pour des discussions privées entre membres.

FAVORIS ET COLLECTIONS :
Les articles sauvegardés sont privés et ne sont pas partagés avec d'autres utilisateurs. La fonctionnalité de partage permet de recommander des articles à vos amis mutuels.

PROFIL UTILISATEUR :
Les informations de profil (nom d'utilisateur, bio, avatar) sont publiques. Vous pouvez personnaliser votre bannière et votre photo de profil. L'historique de vos contributions est visible sur votre profil.`
    },
    {
      icon: FileText,
      title: "9. Modifications des Conditions",
      content: `HERMÈS se réserve le droit de modifier les présentes conditions d'utilisation à tout moment.

NOTIFICATION :
• Les modifications significatives seront notifiées par email et/ou par une annonce sur la plateforme
• Un délai de 30 jours sera accordé avant l'entrée en vigueur des modifications majeures
• Les modifications mineures (corrections, clarifications) peuvent prendre effet immédiatement

ACCEPTATION :
En continuant à utiliser la plateforme après l'entrée en vigueur des modifications, vous acceptez les nouvelles conditions. Si vous n'acceptez pas les modifications, vous devez cesser d'utiliser la plateforme et supprimer votre compte.

HISTORIQUE :
Un historique des versions précédentes des conditions d'utilisation est disponible sur demande.`
    },
    {
      icon: Scale,
      title: "10. Droit Applicable et Juridiction",
      content: `Les présentes conditions d'utilisation sont régies par le droit français.

RÉSOLUTION DES LITIGES :
En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute action judiciaire. Une procédure de médiation peut être initiée en contactant : legal@hermes-news.com

JURIDICTION COMPÉTENTE :
À défaut de résolution amiable, tout litige sera soumis aux tribunaux compétents de Paris, France.

DIVISIBILITÉ :
Si une disposition des présentes conditions est jugée invalide ou inapplicable, les autres dispositions resteront en vigueur.

INTÉGRALITÉ :
Les présentes conditions constituent l'intégralité de l'accord entre vous et HERMÈS concernant l'utilisation de la plateforme et remplacent tout accord antérieur.`
    },
    {
      icon: Mail,
      title: "11. Contact et Support",
      content: `Pour toute question concernant ces conditions d'utilisation ou l'utilisation de la plateforme, vous pouvez nous contacter :

SUPPORT GÉNÉRAL :
Email : support@hermes-news.com
Délai de réponse : 48 heures ouvrables

QUESTIONS JURIDIQUES :
Email : legal@hermes-news.com

PROTECTION DES DONNÉES :
Email : privacy@hermes-news.com
Délégué à la Protection des Données : dpo@hermes-news.com

MODÉRATION :
Email : moderation@hermes-news.com

SIGNALEMENT D'URGENCE :
Pour signaler un contenu illégal ou dangereux nécessitant une intervention immédiate : urgent@hermes-news.com

ADRESSE POSTALE :
HERMÈS
[Adresse à compléter]
France

Nous nous engageons à traiter toutes les demandes avec diligence et confidentialité.

Date de dernière mise à jour : ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Charte d'Utilisation
            </h1>
            <p className="text-sm text-muted-foreground">Conditions générales d'utilisation de HERMÈS</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Introduction */}
        <Card className="mb-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Bienvenue sur HERMÈS</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Ces conditions d'utilisation définissent les règles et directives pour l'utilisation de la plateforme HERMÈS. 
                  En accédant à notre service, vous acceptez d'être lié par ces conditions. Veuillez les lire attentivement 
                  avant d'utiliser la plateforme.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table of Contents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Sommaire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sections.map((section, index) => (
                <a
                  key={index}
                  href={`#section-${index}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  <section.icon className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground hover:text-foreground">{section.title}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <Card key={index} id={`section-${index}`} className="scroll-mt-20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <Separator className="my-8" />
        <div className="text-center text-sm text-muted-foreground pb-8">
          <p className="mb-2">
            En utilisant HERMÈS, vous acceptez ces conditions d'utilisation.
          </p>
          <p>
            © {new Date().getFullYear()} HERMÈS - Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
