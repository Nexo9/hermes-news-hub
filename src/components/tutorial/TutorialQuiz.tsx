import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, HelpCircle } from "lucide-react";

interface TutorialQuizProps {
  question: string;
  options: { label: string; correct?: boolean }[];
  onComplete: () => void;
}

export function TutorialQuiz({ question, options, onComplete }: TutorialQuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);

    // Auto-advance after correct answer or delay
    setTimeout(onComplete, options[idx].correct ? 1200 : 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 rounded-xl bg-muted/50 border border-border space-y-3"
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <HelpCircle className="w-4 h-4 text-primary" />
        <span>Mini-Quiz</span>
      </div>
      <p className="text-sm font-medium">{question}</p>
      <div className="space-y-2">
        {options.map((opt, idx) => {
          const isSelected = selected === idx;
          const isCorrect = opt.correct;

          let borderClass = "border-border hover:border-primary/50";
          if (answered && isSelected) {
            borderClass = isCorrect
              ? "border-green-500 bg-green-500/10"
              : "border-red-500 bg-red-500/10";
          } else if (answered && isCorrect) {
            borderClass = "border-green-500/50 bg-green-500/5";
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className={`w-full text-left p-3 rounded-lg border text-sm transition-all flex items-center justify-between ${borderClass} ${
                !answered ? "cursor-pointer hover:bg-accent/50" : "cursor-default"
              }`}
            >
              <span>{opt.label}</span>
              <AnimatePresence>
                {answered && isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    {isCorrect ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
      {answered && selected !== null && !options[selected].correct && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground"
        >
          Pas tout à fait ! La bonne réponse est indiquée en vert.
        </motion.p>
      )}
      {answered && selected !== null && options[selected].correct && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-green-500 font-medium"
        >
          🎉 Bravo, c'est correct !
        </motion.p>
      )}
    </motion.div>
  );
}
