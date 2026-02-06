import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface TutorialProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function TutorialProgress({ currentStep, totalSteps }: TutorialProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Étape {currentStep + 1} / {totalSteps}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      {/* Step dots */}
      <div className="flex justify-between px-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < currentStep
                ? "bg-primary"
                : i === currentStep
                ? "bg-primary ring-2 ring-primary/30"
                : "bg-muted-foreground/20"
            }`}
            initial={false}
            animate={i === currentStep ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}
