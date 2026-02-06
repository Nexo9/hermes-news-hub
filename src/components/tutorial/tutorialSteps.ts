import {
  Newspaper, MessageSquare, Search, Map, Heart, Bookmark,
  Users, Send, Shield, Crown, Gamepad2, Globe, Sparkles,
  Bell, Share2, Filter, Eye
} from "lucide-react";

export interface TutorialStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  color: string;
  features: string[];
  tip: string;
  interactive?: {
    type: "quiz" | "action" | "explore";
    question?: string;
    options?: { label: string; correct?: boolean }[];
    actionLabel?: string;
  };
}

export const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Bienvenue sur HERMÈS",
    subtitle: "Votre plateforme d'information neutre et sociale",
    description: "HERMÈS est bien plus qu'un site d'actualités. C'est un espace où l'information est traitée de manière neutre grâce à notre IA, et où vous pouvez échanger avec une communauté engagée. Découvrons ensemble tout ce que vous pouvez faire !",
    icon: Sparkles,
    color: "from-primary to-purple-600",
    features: [
      "Actualités neutres rédigées par Antik-IA",
      "Communauté sociale engagée",
      "Outils interactifs uniques",
    ],
    tip: "Ce tutoriel prend environ 2 minutes. Vous pouvez le reprendre plus tard si besoin !",
  },
  {
    id: "news-feed",
    title: "Le Fil d'Actualités",
    subtitle: "L'information neutre à portée de main",
    description: "Chaque actualité sur HERMÈS est synthétisée par notre IA « Antik-IA » à partir de multiples sources pour garantir la neutralité. Aucune opinion, que des faits.",
    icon: Newspaper,
    color: "from-blue-500 to-cyan-500",
    features: [
      "Synthèses neutres multi-sources",
      "Catégories : Politique, Économie, Tech, Science...",
      "Mise à jour en temps réel",
      "Articles complets générés par IA",
    ],
    tip: "Cliquez sur une actualité pour lire l'article complet généré par Antik-IA !",
    interactive: {
      type: "quiz",
      question: "Pourquoi HERMÈS utilise plusieurs sources ?",
      options: [
        { label: "Pour avoir plus de contenu" },
        { label: "Pour garantir la neutralité", correct: true },
        { label: "Pour être plus rapide" },
      ],
    },
  },
  {
    id: "filters",
    title: "Filtres MST",
    subtitle: "Matrice Spatio-Temporelle",
    description: "Filtrez les actualités selon 3 dimensions : le sujet (catégorie), le lieu (localisation mondiale) et le temps (période). C'est votre boussole dans l'information.",
    icon: Filter,
    color: "from-emerald-500 to-teal-500",
    features: [
      "Filtre par catégorie (Politique, Tech, Sport...)",
      "Filtre géographique (France, Afrique, Asie...)",
      "Filtre temporel (Aujourd'hui, semaine, mois)",
      "Barre de recherche instantanée",
    ],
    tip: "Combinez plusieurs filtres pour trouver exactement l'info qui vous intéresse !",
  },
  {
    id: "interactions",
    title: "Interagir avec l'Actu",
    subtitle: "Likez, sauvegardez et partagez",
    description: "Chaque actualité peut être likée, sauvegardée dans vos favoris, ou partagée avec vos amis directement sur la plateforme.",
    icon: Heart,
    color: "from-rose-500 to-pink-500",
    features: [
      "❤️ Like pour soutenir un sujet",
      "🔖 Favoris pour sauvegarder",
      "📤 Partage à vos amis HERMÈS",
      "💬 Discussions en threads",
    ],
    tip: "Vos favoris sont accessibles depuis la page 'Mes Collections' !",
    interactive: {
      type: "quiz",
      question: "Où retrouvez-vous vos actualités sauvegardées ?",
      options: [
        { label: "Dans les paramètres" },
        { label: "Dans Mes Collections", correct: true },
        { label: "Dans les messages" },
      ],
    },
  },
  {
    id: "threads",
    title: "Les Threads",
    subtitle: "Discutez autour de l'actualité",
    description: "Sous chaque actualité, vous pouvez ouvrir un espace de discussion. Partagez votre avis, répondez aux autres, créez un vrai débat constructif.",
    icon: MessageSquare,
    color: "from-violet-500 to-purple-500",
    features: [
      "Commentaires liés à chaque actualité",
      "Réponses hiérarchiques (réponse à une réponse)",
      "Likes sur les commentaires",
      "Modération communautaire",
    ],
    tip: "Restez respectueux ! La charte d'utilisation s'applique dans les discussions.",
  },
  {
    id: "social",
    title: "Réseau Social",
    subtitle: "Connectez-vous avec la communauté",
    description: "HERMÈS est aussi un réseau social. Suivez des utilisateurs, devenez amis (suivi mutuel), et discutez de sujets qui vous passionnent.",
    icon: Users,
    color: "from-amber-500 to-orange-500",
    features: [
      "Suivre/Se désabonner d'utilisateurs",
      "Système d'amis (suivi mutuel)",
      "Profils personnalisables",
      "Page Discussions pour les échanges libres",
    ],
    tip: "Quand deux personnes se suivent mutuellement, elles deviennent amis et peuvent s'envoyer des messages !",
    interactive: {
      type: "quiz",
      question: "Comment devenir ami avec quelqu'un ?",
      options: [
        { label: "Envoyer une demande d'ami" },
        { label: "Se suivre mutuellement", correct: true },
        { label: "Lui envoyer un message" },
      ],
    },
  },
  {
    id: "messages",
    title: "Messagerie Privée",
    subtitle: "Communiquez en toute confidentialité",
    description: "Envoyez des messages privés à vos amis. Texte, images, et même des messages vocaux ! Tout reste entre vous.",
    icon: Send,
    color: "from-sky-500 to-blue-500",
    features: [
      "Messages texte en temps réel",
      "Envoi d'images",
      "Messages vocaux",
      "Création de groupes (jusqu'à 30 personnes)",
    ],
    tip: "Les messages vocaux sont parfaits pour exprimer vos réactions rapidement !",
  },
  {
    id: "map",
    title: "Carte des Actualités",
    subtitle: "L'info sur une carte interactive",
    description: "Visualisez les actualités du monde entier sur une carte interactive. Cliquez sur une région pour découvrir ce qui s'y passe.",
    icon: Map,
    color: "from-green-500 to-emerald-500",
    features: [
      "Carte mondiale interactive",
      "Marqueurs par région/pays",
      "Zoom et navigation fluides",
      "Actualités géolocalisées",
    ],
    tip: "La carte est idéale pour comprendre les dynamiques géopolitiques d'un coup d'œil !",
  },
  {
    id: "search",
    title: "Recherche Avancée",
    subtitle: "Antik-IA cherche pour vous",
    description: "Notre recherche avancée parcourt plus de 20 journaux internationaux et synthétise les résultats grâce à l'IA. Un vrai moteur de recherche d'actualités.",
    icon: Search,
    color: "from-indigo-500 to-blue-600",
    features: [
      "Recherche dans 20+ sources internationales",
      "Synthèse automatique par Antik-IA",
      "Résultats classés par pertinence",
      "Sources vérifiables",
    ],
    tip: "Utilisez la recherche avancée pour des sujets précis comme 'IA en médecine' !",
  },
  {
    id: "premium",
    title: "HERMÈS Premium & Élite",
    subtitle: "Des avantages exclusifs",
    description: "Passez à Premium ou Élite pour débloquer des fonctionnalités exclusives et soutenir le projet HERMÈS.",
    icon: Crown,
    color: "from-yellow-500 to-amber-500",
    features: [
      "Badge de certification ✓",
      "Accès prioritaire aux nouvelles fonctionnalités",
      "Thèmes exclusifs",
      "Soutien au projet HERMÈS",
    ],
    tip: "En devenant Premium, vous soutenez aussi nos causes humanitaires !",
  },
  {
    id: "games",
    title: "Mini-Jeux",
    subtitle: "Apprenez en vous amusant",
    description: "HERMÈS propose des mini-jeux liés à l'actualité pour tester vos connaissances tout en vous divertissant.",
    icon: Gamepad2,
    color: "from-fuchsia-500 to-pink-500",
    features: [
      "Quiz sur l'actualité",
      "Jeux éducatifs",
      "Classements entre utilisateurs",
      "Nouveaux jeux régulièrement",
    ],
    tip: "Les mini-jeux sont un excellent moyen de vérifier que vous suivez bien l'actu !",
    interactive: {
      type: "quiz",
      question: "HERMÈS est développé par qui ?",
      options: [
        { label: "Une grande entreprise" },
        { label: "Ibrahim Mohamed Antik", correct: true },
        { label: "Un collectif anonyme" },
      ],
    },
  },
  {
    id: "contributions",
    title: "Contributions Humanitaires",
    subtitle: "L'info au service de l'humanité",
    description: "HERMÈS soutient activement la Palestine, le Congo et le Soudan. Une partie des revenus est reversée à des organisations humanitaires.",
    icon: Globe,
    color: "from-red-500 to-rose-600",
    features: [
      "Soutien à la Palestine 🇵🇸",
      "Soutien au Congo 🇨🇩",
      "Soutien au Soudan 🇸🇩",
      "Transparence sur les contributions",
    ],
    tip: "En utilisant HERMÈS, vous contribuez déjà à ces causes. Merci !",
  },
  {
    id: "complete",
    title: "Vous êtes prêt ! 🎉",
    subtitle: "Bienvenue dans la communauté HERMÈS",
    description: "Vous connaissez maintenant toutes les fonctionnalités d'HERMÈS. Explorez, échangez, et restez informé de manière neutre et engagée !",
    icon: Sparkles,
    color: "from-primary to-accent",
    features: [
      "✅ Fil d'actualités neutre",
      "✅ Filtres MST & Recherche avancée",
      "✅ Réseau social & Messagerie",
      "✅ Carte interactive & Mini-jeux",
    ],
    tip: "Vous pouvez relancer ce tutoriel à tout moment depuis votre profil !",
  },
];
