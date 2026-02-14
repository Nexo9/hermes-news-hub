import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { HermesLogo } from "@/components/HermesLogo";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const floatingParticles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 4 + 3,
    delay: Math.random() * 2,
  }));

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(600px circle at ${50 + mousePos.x}% ${50 + mousePos.y}%, hsl(var(--primary) / 0.06), transparent 60%)`,
        }}
      />

      {/* Floating particles */}
      {floatingParticles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [-20, 20, -20], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          <HermesLogo size="xl" animated={false} />
        </motion.div>

        {/* 404 Number */}
        <motion.h1
          className="mt-8 font-display text-[8rem] sm:text-[10rem] font-bold leading-none tracking-tight"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(38, 80%, 75%), hsl(var(--primary)))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 30px hsl(var(--primary) / 0.3))",
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          404
        </motion.h1>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-2 max-w-md"
        >
          <h2 className="text-2xl font-display font-semibold text-foreground">
            Page introuvable
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Le chemin <span className="font-mono text-primary/80 text-sm bg-primary/5 px-2 py-0.5 rounded">{location.pathname}</span> n'existe pas sur Hermès.
          </p>
        </motion.div>

        {/* Separator */}
        <motion.div
          className="mt-8 h-px w-32 bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        />

        {/* Actions */}
        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Button asChild className="gap-2">
            <Link to="/">
              <Home className="h-4 w-4" />
              Accueil
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link to="/search">
              <Search className="h-4 w-4" />
              Rechercher
            </Link>
          </Button>
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/discussions">
              <Compass className="h-4 w-4" />
              Explorer
            </Link>
          </Button>
        </motion.div>

        {/* Back link */}
        <motion.button
          onClick={() => window.history.back()}
          className="mt-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à la page précédente
        </motion.button>
      </div>
    </div>
  );
};

export default NotFound;
