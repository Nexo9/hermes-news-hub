import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Trophy, Star, Clock, CheckCircle2, XCircle, Sparkles } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correct: number;
  category: string;
}

const questions: Question[] = [
  {
    question: "Quelle est la capitale de l'Australie ?",
    options: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
    correct: 2,
    category: "Géographie"
  },
  {
    question: "Quel pays possède le plus grand nombre d'îles ?",
    options: ["Indonésie", "Philippines", "Suède", "Finlande"],
    correct: 2,
    category: "Géographie"
  },
  {
    question: "Quel est le plus long fleuve du monde ?",
    options: ["Amazone", "Nil", "Mississippi", "Yangtsé"],
    correct: 1,
    category: "Géographie"
  },
  {
    question: "Combien de pays composent l'Union Européenne en 2024 ?",
    options: ["25", "27", "28", "30"],
    correct: 1,
    category: "Politique"
  },
  {
    question: "Quel pays a le PIB le plus élevé au monde ?",
    options: ["Chine", "États-Unis", "Japon", "Allemagne"],
    correct: 1,
    category: "Économie"
  },
  {
    question: "Quelle organisation a été créée en 1945 pour maintenir la paix ?",
    options: ["OTAN", "ONU", "UNESCO", "OMS"],
    correct: 1,
    category: "Politique"
  },
  {
    question: "Quel pays est le plus grand exportateur mondial ?",
    options: ["États-Unis", "Allemagne", "Chine", "Japon"],
    correct: 2,
    category: "Économie"
  },
  {
    question: "Combien de pays permanents siègent au Conseil de sécurité de l'ONU ?",
    options: ["3", "4", "5", "6"],
    correct: 2,
    category: "Politique"
  },
  {
    question: "Quel détroit sépare l'Europe de l'Asie ?",
    options: ["Gibraltar", "Bosphore", "Magellan", "Ormuz"],
    correct: 1,
    category: "Géographie"
  },
  {
    question: "Quelle monnaie est utilisée par le plus grand nombre de pays ?",
    options: ["Dollar", "Euro", "Yen", "Livre"],
    correct: 1,
    category: "Économie"
  }
];

export function GeoQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!gameOver && !showResult && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult) {
      handleAnswer(-1);
    }
  }, [timeLeft, gameOver, showResult]);

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowResult(true);

    if (answerIndex === questions[currentQuestion].correct) {
      const bonus = Math.floor(timeLeft / 3);
      setScore(score + 10 + bonus + streak * 2);
      setStreak(streak + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setTimeLeft(15);
      } else {
        setGameOver(true);
      }
    }, 1500);
  };

  const resetGame = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameOver(false);
    setTimeLeft(15);
    setStreak(0);
  };

  const question = questions[currentQuestion];

  return (
    <Card className="border-primary/30 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/20 to-purple-600/20 pb-4">
        <CardTitle className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <Globe className="h-5 w-5 text-white" />
          </div>
          Quiz Géopolitique
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {gameOver ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mb-4"
              >
                <Trophy className="h-12 w-12 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Partie terminée !</h3>
              <p className="text-4xl font-bold text-primary mb-2">{score} points</p>
              <div className="flex items-center justify-center gap-2">
                {[...Array(Math.min(5, Math.floor(score / 20)))].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
            </div>
            <Button onClick={resetGame} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Rejouer
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{question.category}</Badge>
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestion + 1}/{questions.length}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {streak > 1 && (
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                    🔥 x{streak}
                  </Badge>
                )}
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="font-bold">{score}</span>
                </div>
              </div>
            </div>

            {/* Timer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Temps restant
                </div>
                <span className={`font-bold ${timeLeft <= 5 ? "text-red-500" : "text-foreground"}`}>
                  {timeLeft}s
                </span>
              </div>
              <Progress 
                value={(timeLeft / 15) * 100} 
                className={`h-2 ${timeLeft <= 5 ? "[&>div]:bg-red-500" : ""}`}
              />
            </div>

            {/* Question */}
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="py-4"
            >
              <h3 className="text-lg font-semibold text-foreground mb-6">
                {question.question}
              </h3>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3">
                <AnimatePresence mode="wait">
                  {question.options.map((option, index) => {
                    const isCorrect = index === question.correct;
                    const isSelected = index === selectedAnswer;
                    
                    let buttonClass = "w-full justify-start text-left h-auto py-4 px-6 ";
                    if (showResult) {
                      if (isCorrect) {
                        buttonClass += "bg-green-500/20 border-green-500 text-green-400";
                      } else if (isSelected && !isCorrect) {
                        buttonClass += "bg-red-500/20 border-red-500 text-red-400";
                      }
                    }

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Button
                          variant="outline"
                          className={buttonClass}
                          onClick={() => !showResult && handleAnswer(index)}
                          disabled={showResult}
                        >
                          <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 text-sm font-bold">
                            {String.fromCharCode(65 + index)}
                          </span>
                          {option}
                          {showResult && isCorrect && (
                            <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />
                          )}
                          {showResult && isSelected && !isCorrect && (
                            <XCircle className="ml-auto h-5 w-5 text-red-500" />
                          )}
                        </Button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
