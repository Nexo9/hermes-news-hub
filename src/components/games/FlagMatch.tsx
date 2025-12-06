import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, Trophy, Clock, Sparkles, CheckCircle2, XCircle } from "lucide-react";

interface FlagQuestion {
  flag: string;
  country: string;
  options: string[];
}

const flagData: FlagQuestion[] = [
  { flag: "🇫🇷", country: "France", options: ["France", "Italie", "Belgique", "Pays-Bas"] },
  { flag: "🇯🇵", country: "Japon", options: ["Chine", "Japon", "Corée du Sud", "Vietnam"] },
  { flag: "🇧🇷", country: "Brésil", options: ["Portugal", "Brésil", "Argentine", "Colombie"] },
  { flag: "🇨🇦", country: "Canada", options: ["Canada", "États-Unis", "Australie", "Nouvelle-Zélande"] },
  { flag: "🇩🇪", country: "Allemagne", options: ["Belgique", "Autriche", "Allemagne", "Suisse"] },
  { flag: "🇮🇹", country: "Italie", options: ["Irlande", "Hongrie", "Italie", "Mexique"] },
  { flag: "🇪🇸", country: "Espagne", options: ["Portugal", "Espagne", "Andorre", "Monaco"] },
  { flag: "🇬🇧", country: "Royaume-Uni", options: ["Australie", "Royaume-Uni", "Nouvelle-Zélande", "Islande"] },
  { flag: "🇷🇺", country: "Russie", options: ["Slovénie", "Slovaquie", "Russie", "Serbie"] },
  { flag: "🇨🇳", country: "Chine", options: ["Chine", "Vietnam", "Taïwan", "Mongolie"] },
  { flag: "🇮🇳", country: "Inde", options: ["Pakistan", "Bangladesh", "Inde", "Sri Lanka"] },
  { flag: "🇦🇺", country: "Australie", options: ["Nouvelle-Zélande", "Australie", "Fidji", "Royaume-Uni"] },
  { flag: "🇲🇽", country: "Mexique", options: ["Mexique", "Guatemala", "Italie", "Irlande"] },
  { flag: "🇰🇷", country: "Corée du Sud", options: ["Japon", "Corée du Nord", "Corée du Sud", "Taïwan"] },
  { flag: "🇿🇦", country: "Afrique du Sud", options: ["Kenya", "Afrique du Sud", "Nigeria", "Égypte"] },
];

export function FlagMatch() {
  const [questions, setQuestions] = useState<FlagQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameStarted, setGameStarted] = useState(false);

  const initGame = () => {
    const shuffled = [...flagData].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameOver(false);
    setTimeLeft(10);
    setGameStarted(true);
  };

  useEffect(() => {
    if (!gameStarted || gameOver || showResult) return;
    
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      handleAnswer("");
    }
  }, [timeLeft, gameStarted, gameOver, showResult]);

  const handleAnswer = (answer: string) => {
    if (showResult || !questions[currentIndex]) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === questions[currentIndex].country;
    
    if (isCorrect) {
      const bonus = Math.floor(timeLeft);
      setScore(score + 10 + bonus + streak * 3);
      setStreak(streak + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setTimeLeft(10);
      } else {
        setGameOver(true);
      }
    }, 1200);
  };

  const currentQuestion = questions[currentIndex];

  if (!gameStarted) {
    return (
      <Card className="border-primary/30">
        <CardHeader className="bg-gradient-to-r from-blue-500/20 to-cyan-600/20">
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Flag className="h-5 w-5 text-white" />
            </div>
            Flag Match
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🏳️🌍🎯</div>
            <h3 className="text-xl font-bold mb-2">Reconnaissez les drapeaux !</h3>
            <p className="text-muted-foreground mb-6">
              Testez vos connaissances sur les drapeaux du monde
            </p>
            <Button onClick={initGame} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Commencer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="bg-gradient-to-r from-blue-500/20 to-cyan-600/20 pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Flag className="h-5 w-5 text-white" />
            </div>
            Flag Match
          </div>
          <div className="flex items-center gap-2">
            {streak > 1 && (
              <Badge className="bg-orange-500/20 text-orange-400">
                🔥 x{streak}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1">
              <Trophy className="h-3 w-3" />
              {score}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {gameOver ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="text-6xl mb-4"
            >
              🏆
            </motion.div>
            <h3 className="text-2xl font-bold mb-2">Bien joué !</h3>
            <p className="text-4xl font-bold text-primary mb-4">{score} points</p>
            <p className="text-muted-foreground mb-6">
              Vous avez identifié les drapeaux avec succès !
            </p>
            <Button onClick={initGame} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Rejouer
            </Button>
          </motion.div>
        ) : currentQuestion ? (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Question {currentIndex + 1}/{questions.length}
              </span>
              <div className="flex items-center gap-2">
                <Clock className={`h-4 w-4 ${timeLeft <= 3 ? "text-red-500" : "text-muted-foreground"}`} />
                <span className={`font-bold ${timeLeft <= 3 ? "text-red-500" : ""}`}>
                  {timeLeft}s
                </span>
              </div>
            </div>
            <Progress 
              value={(timeLeft / 10) * 100} 
              className={`h-2 ${timeLeft <= 3 ? "[&>div]:bg-red-500" : ""}`}
            />

            {/* Flag */}
            <motion.div
              key={currentIndex}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-4"
            >
              <div className="text-[100px] leading-none mb-4">
                {currentQuestion.flag}
              </div>
              <p className="text-lg text-muted-foreground">
                Quel est ce pays ?
              </p>
            </motion.div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              <AnimatePresence mode="wait">
                {currentQuestion.options.map((option, index) => {
                  const isCorrect = option === currentQuestion.country;
                  const isSelected = option === selectedAnswer;
                  
                  let buttonVariant: "outline" | "default" = "outline";
                  let buttonClass = "";
                  
                  if (showResult) {
                    if (isCorrect) {
                      buttonClass = "bg-green-500/20 border-green-500 text-green-400";
                    } else if (isSelected && !isCorrect) {
                      buttonClass = "bg-red-500/20 border-red-500 text-red-400";
                    }
                  }

                  return (
                    <motion.div
                      key={option}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Button
                        variant={buttonVariant}
                        className={`w-full h-auto py-4 ${buttonClass}`}
                        onClick={() => !showResult && handleAnswer(option)}
                        disabled={showResult}
                      >
                        {option}
                        {showResult && isCorrect && (
                          <CheckCircle2 className="ml-2 h-4 w-4 text-green-500" />
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <XCircle className="ml-2 h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
