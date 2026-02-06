import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Lightbulb,
  Rocket,
} from "lucide-react";
import { tutorialSteps } from "./tutorialSteps";
import { TutorialProgress } from "./TutorialProgress";
import { TutorialQuiz } from "./TutorialQuiz";

interface TutorialOverlayProps {
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export function TutorialOverlay({
  currentStep,
  onNext,
  onPrev,
  onSkip,
}: TutorialOverlayProps) {
  const step = tutorialSteps[currentStep];
  const totalSteps = tutorialSteps.length;
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const [quizDone, setQuizDone] = useState(false);

  const handleNext = () => {
    setQuizDone(false);
    onNext();
  };

  const handlePrev = () => {
    setQuizDone(false);
    onPrev();
  };

  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        key={step.id}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header gradient */}
        <div className={`relative p-6 pb-12 bg-gradient-to-br ${step.color}`}>
          {/* Skip button */}
          {!isLast && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="absolute top-3 right-3 text-white/70 hover:text-white hover:bg-white/10 text-xs gap-1"
            >
              Passer
              <X className="w-3 h-3" />
            </Button>
          )}

          {/* Icon */}
          <motion.div
            initial={{ rotate: -10, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4"
          >
            <Icon className="w-8 h-8 text-white" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Badge className="bg-white/20 text-white border-white/30 mb-2">
              {step.subtitle}
            </Badge>
            <h2 className="text-2xl font-bold text-white">{step.title}</h2>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-6 -mt-6 relative">
          <div className="bg-card rounded-xl border border-border p-4 shadow-lg">
            <ScrollArea className="max-h-[40vh]">
              <motion.p
                key={`desc-${step.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-muted-foreground leading-relaxed mb-4"
              >
                {step.description}
              </motion.p>

              {/* Features list */}
              <div className="space-y-2 mb-4">
                {step.features.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + idx * 0.05 }}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span className="text-primary mt-0.5">•</span>
                    <span>{feature}</span>
                  </motion.div>
                ))}
              </div>

              {/* Tip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10"
              >
                <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">{step.tip}</p>
              </motion.div>

              {/* Interactive quiz */}
              {step.interactive?.type === "quiz" &&
                step.interactive.question &&
                step.interactive.options && (
                  <TutorialQuiz
                    question={step.interactive.question}
                    options={step.interactive.options}
                    onComplete={() => setQuizDone(true)}
                  />
                )}
            </ScrollArea>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <TutorialProgress currentStep={currentStep} totalSteps={totalSteps} />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={isFirst}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </Button>

            <Button
              onClick={handleNext}
              size="sm"
              className="gap-1"
            >
              {isLast ? (
                <>
                  <Rocket className="w-4 h-4" />
                  Commencer !
                </>
              ) : (
                <>
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
