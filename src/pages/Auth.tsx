import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Mail, Lock, User, Crown } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!username || username.length < 3) {
          toast({
            title: "Erreur",
            description: "Le pseudo doit contenir au moins 3 caractères",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: username,
            },
          },
        });

        if (error) throw error;

        // Send welcome email
        if (data.user) {
          await sendWelcomeEmail(email, username);
        }

        toast({
          title: "Compte créé ! 🎉",
          description: "Bienvenue sur HERMÈS ! Vérifiez votre email.",
        });
        
        // Auto login after signup (if email confirmation is disabled)
        if (data.session) {
          navigate("/");
        }
      } else {
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
      }
    } catch (error: any) {
      let errorMessage = error.message || "Une erreur est survenue";
      if (error.message?.includes("User already registered")) {
        errorMessage = "Un compte existe déjà avec cet email";
      } else if (error.message?.includes("Invalid login credentials")) {
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-card border-border shadow-glow">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">HERMÈS</h1>
          <p className="text-sm text-muted-foreground">Information Neutre & Sociale</p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Pseudo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="votre_pseudo"
                  className="pl-10 bg-background border-border"
                  required={isSignUp}
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_]+"
                />
              </div>
            </div>
          )}

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

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 h-11"
          >
            {isLoading ? "Chargement..." : isSignUp ? "Créer un compte" : "Se connecter"}
          </Button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
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