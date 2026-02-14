import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Crown, ArrowLeft } from "lucide-react";
import OnboardingForm from "@/components/auth/OnboardingForm";
import { HermesLogo } from "@/components/HermesLogo";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      navigate("/");
    }
  };

  const sendWelcomeEmail = async (userEmail: string, userName: string) => {
    try {
      await supabase.functions.invoke("send-email", {
        body: {
          type: "welcome",
          email: userEmail,
          data: { username: userName },
        },
      });
    } catch (error) {
      console.error("Error sending welcome email:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur HERMÈS",
      });
      navigate("/");
    } catch (error: any) {
      let errorMessage = error.message || "Une erreur est survenue";
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Email ou mot de passe incorrect";
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive",
      });
      return;
    }

    // Validate password
    if (!password || password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    setShowOnboarding(true);
  };

  const handleOnboardingComplete = async (data: {
    username: string;
    birthDate: Date | undefined;
    status: string;
    workSector: string;
    interests: string[];
  }) => {
    setIsLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: data.username,
          },
        },
      });

      if (error) throw error;

      // Update profile with onboarding data
      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            username: data.username,
            birth_date: data.birthDate?.toISOString().split('T')[0],
            status: data.status,
            work_sector: data.workSector,
            interests: data.interests,
            onboarding_completed: true,
          })
          .eq("id", authData.user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
        }

        // Send welcome email
        await sendWelcomeEmail(email, data.username);
      }

      toast({
        title: "Compte créé ! 🎉",
        description: "Bienvenue sur HERMÈS ! Vérifiez votre email.",
      });
      
      // Auto login after signup (if email confirmation is disabled)
      if (authData.session) {
        navigate("/");
      }
    } catch (error: any) {
      let errorMessage = error.message || "Une erreur est survenue";
      if (error.message?.includes("User already registered")) {
        errorMessage = "Un compte existe déjà avec cet email";
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Onboarding view
  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg p-6 sm:p-8 bg-card border-border shadow-glow">
          {/* Header with back button */}
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOnboarding(false)}
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <HermesLogo size="sm" showText />
            </div>
          </div>

          <OnboardingForm 
            onComplete={handleOnboardingComplete} 
            isLoading={isLoading} 
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-card border-border shadow-glow">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <HermesLogo size="lg" className="mb-4" />
          <h1 className="text-3xl font-display font-bold text-foreground">Hermès</h1>
          <p className="text-sm text-muted-foreground">Information Neutre & Sociale</p>
        </div>

        {/* Form */}
        <form onSubmit={isSignUp ? handleStartSignUp : handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="pl-10 bg-background border-border"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 bg-background border-border"
                required
                minLength={6}
              />
            </div>
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 bg-background border-border"
                  required
                  minLength={6}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 h-11"
          >
            {isLoading ? "Chargement..." : isSignUp ? "Continuer" : "Se connecter"}
          </Button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setConfirmPassword("");
            }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isSignUp ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
          </button>
        </div>

        {/* Premium link */}
        <div className="mt-4 text-center">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
          >
            <Crown className="w-3 h-3" />
            Découvrir les plans Premium
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
