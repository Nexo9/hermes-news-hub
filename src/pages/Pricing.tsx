import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap, Shield, MessageSquare, Globe, ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: PlanFeature[];
  icon: React.ReactNode;
  popular?: boolean;
  color: string;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Gratuit",
    price: 0,
    period: "pour toujours",
    description: "Découvrez HERMÈS avec les fonctionnalités essentielles",
    icon: <Star className="h-6 w-6" />,
    color: "from-gray-500 to-gray-600",
    features: [
      { text: "Accès aux actualités neutres", included: true },
      { text: "Participation aux discussions", included: true },
      { text: "Messagerie avec amis", included: true },
      { text: "Carte des actualités basique", included: true },
      { text: "Badge de certification", included: false },
      { text: "Priorité sur les commentaires", included: false },
      { text: "Analyse IA des tendances", included: false },
      { text: "Support prioritaire", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 4.99,
    period: "/mois",
    description: "Pour les passionnés d'information de qualité",
    icon: <Crown className="h-6 w-6" />,
    color: "from-primary to-purple-600",
    popular: true,
    features: [
      { text: "Tout du plan Gratuit", included: true },
      { text: "Badge de certification ✓", included: true },
      { text: "Commentaires mis en avant", included: true },
      { text: "Carte des actualités avancée", included: true },
      { text: "Filtres personnalisés", included: true },
      { text: "Notifications prioritaires", included: true },
      { text: "Analyse IA des tendances", included: false },
      { text: "Support prioritaire", included: false },
    ],
  },
  {
    id: "elite",
    name: "Élite",
    price: 9.99,
    period: "/mois",
    description: "L'expérience HERMÈS ultime avec toutes les fonctionnalités",
    icon: <Zap className="h-6 w-6" />,
    color: "from-amber-500 to-orange-600",
    features: [
      { text: "Tout du plan Premium", included: true },
      { text: "Badge Élite exclusif ⭐", included: true },
      { text: "Analyse IA des tendances", included: true },
      { text: "Résumés personnalisés IA", included: true },
      { text: "Accès anticipé aux nouveautés", included: true },
      { text: "Support prioritaire 24/7", included: true },
      { text: "Groupes illimités", included: true },
      { text: "Statistiques avancées", included: true },
    ],
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      fetchCurrentPlan(user.id);
    }
  };

  const fetchCurrentPlan = async (userId: string) => {
    const { data } = await supabase
      .from("user_subscriptions")
      .select("plan_type")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setCurrentPlan(data.plan_type);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!currentUserId) {
      navigate("/auth");
      return;
    }

    if (planId === "free") {
      toast({
        title: "Plan Gratuit",
        description: "Vous êtes déjà sur le plan gratuit !",
      });
      return;
    }

    setLoading(true);

    // For demo purposes, we'll simulate subscription
    // In production, this would integrate with Stripe
    try {
      const { error } = await supabase
        .from("user_subscriptions")
        .upsert({
          user_id: currentUserId,
          plan_type: planId,
          is_certified: planId !== "free",
          started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (error) throw error;

      setCurrentPlan(planId);
      toast({
        title: "Abonnement activé !",
        description: `Votre plan ${planId === "premium" ? "Premium" : "Élite"} est maintenant actif.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'activer l'abonnement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button onClick={() => navigate("/")} variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Tarifs HERMÈS</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Nouveau modèle économique
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Choisissez votre expérience HERMÈS
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Des tarifs accessibles pour une information de qualité. Devenez certifié et profitez de fonctionnalités exclusives.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                plan.popular ? "border-primary shadow-lg shadow-primary/20" : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground">
                    Populaire
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white mb-4`}>
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price === 0 ? "Gratuit" : `${plan.price}€`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                
                <ul className="space-y-3 text-left">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded-full p-0.5 ${feature.included ? "bg-green-500/20" : "bg-muted"}`}>
                        <Check className={`h-4 w-4 ${feature.included ? "text-green-500" : "text-muted-foreground"}`} />
                      </div>
                      <span className={feature.included ? "text-foreground" : "text-muted-foreground line-through"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading || currentPlan === plan.id}
                >
                  {currentPlan === plan.id ? "Plan actuel" : plan.price === 0 ? "Commencer" : "S'abonner"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="bg-card rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-bold text-center mb-8">Pourquoi devenir Premium ?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Certification</h3>
              <p className="text-sm text-muted-foreground">Badge vérifié visible par tous les utilisateurs</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Visibilité</h3>
              <p className="text-sm text-muted-foreground">Vos commentaires sont mis en avant</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Carte avancée</h3>
              <p className="text-sm text-muted-foreground">Accédez à plus de filtres et d'analyses</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">IA exclusive</h3>
              <p className="text-sm text-muted-foreground">Analyses et résumés personnalisés</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;