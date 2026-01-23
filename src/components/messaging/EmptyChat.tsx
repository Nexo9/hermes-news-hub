import { MessageCircle, Users, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function EmptyChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <MessageCircle className="h-12 w-12 text-primary" />
        </div>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute -top-2 -right-2"
        >
          <Sparkles className="h-6 w-6 text-primary" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-2">Vos messages</h2>
        <p className="text-muted-foreground mb-6">
          Sélectionnez une conversation ou commencez une nouvelle discussion avec vos amis.
        </p>

        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Messages privés</p>
              <p className="text-xs">Discutez en tête-à-tête</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Groupes</p>
              <p className="text-xs">Jusqu'à 30 personnes par groupe</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
