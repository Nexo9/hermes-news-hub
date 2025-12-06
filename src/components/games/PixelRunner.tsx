import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Gamepad2, Trophy, Play, RotateCcw } from "lucide-react";

interface Obstacle {
  x: number;
  type: "spike" | "bird";
  passed: boolean;
}

export function PixelRunner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"ready" | "playing" | "gameover">("ready");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  const gameDataRef = useRef({
    playerY: 200,
    velocityY: 0,
    obstacles: [] as Obstacle[],
    frameCount: 0,
    speed: 3,
    isJumping: false,
  });

  const jump = useCallback(() => {
    if (gameState !== "playing") return;
    const data = gameDataRef.current;
    if (!data.isJumping) {
      data.velocityY = -12;
      data.isJumping = true;
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (gameState === "ready") {
          startGame();
        } else {
          jump();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, jump]);

  const startGame = () => {
    gameDataRef.current = {
      playerY: 200,
      velocityY: 0,
      obstacles: [],
      frameCount: 0,
      speed: 3,
      isJumping: false,
    };
    setScore(0);
    setGameState("playing");
  };

  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    
    const gameLoop = () => {
      const data = gameDataRef.current;
      
      // Clear canvas
      ctx.fillStyle = "#1A0033";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw ground
      ctx.fillStyle = "#A800FF";
      ctx.fillRect(0, 250, canvas.width, 2);

      // Draw pixel grid effect
      ctx.strokeStyle = "rgba(168, 0, 255, 0.1)";
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 250);
        ctx.stroke();
      }

      // Update player
      data.velocityY += 0.6; // Gravity
      data.playerY += data.velocityY;

      if (data.playerY >= 200) {
        data.playerY = 200;
        data.velocityY = 0;
        data.isJumping = false;
      }

      // Draw player (pixel character)
      const px = 50;
      const py = data.playerY;
      
      // Body
      ctx.fillStyle = "#A800FF";
      ctx.fillRect(px, py, 30, 40);
      
      // Head
      ctx.fillStyle = "#E0E0E0";
      ctx.fillRect(px + 5, py - 15, 20, 20);
      
      // Eyes
      ctx.fillStyle = "#1A0033";
      ctx.fillRect(px + 8, py - 10, 5, 5);
      ctx.fillRect(px + 17, py - 10, 5, 5);
      
      // Legs animation
      const legOffset = data.isJumping ? 5 : Math.sin(data.frameCount * 0.3) * 5;
      ctx.fillStyle = "#7700BB";
      ctx.fillRect(px + 5, py + 40, 8, 10 + legOffset);
      ctx.fillRect(px + 17, py + 40, 8, 10 - legOffset);

      // Update obstacles
      data.frameCount++;
      data.speed = 3 + Math.floor(data.frameCount / 500);

      if (data.frameCount % Math.max(60 - Math.floor(data.frameCount / 200), 30) === 0) {
        data.obstacles.push({
          x: canvas.width,
          type: Math.random() > 0.7 ? "bird" : "spike",
          passed: false,
        });
      }

      // Draw and update obstacles
      data.obstacles = data.obstacles.filter((obs) => {
        obs.x -= data.speed;

        if (obs.type === "spike") {
          // Draw spike
          ctx.fillStyle = "#FF0066";
          ctx.beginPath();
          ctx.moveTo(obs.x, 250);
          ctx.lineTo(obs.x + 15, 210);
          ctx.lineTo(obs.x + 30, 250);
          ctx.fill();
          
          // Collision check
          if (
            px + 25 > obs.x &&
            px + 5 < obs.x + 30 &&
            py + 40 > 210
          ) {
            setGameState("gameover");
            setHighScore((prev) => Math.max(prev, score));
          }
        } else {
          // Draw bird
          const birdY = 180 + Math.sin(data.frameCount * 0.1) * 20;
          ctx.fillStyle = "#00FFAA";
          ctx.fillRect(obs.x, birdY, 25, 15);
          ctx.fillRect(obs.x + 5, birdY - 5, 15, 5);
          
          // Wings
          const wingOffset = Math.sin(data.frameCount * 0.3) * 5;
          ctx.fillRect(obs.x - 5, birdY + 5 + wingOffset, 10, 5);
          ctx.fillRect(obs.x + 20, birdY + 5 - wingOffset, 10, 5);
          
          // Collision check
          if (
            px + 25 > obs.x &&
            px + 5 < obs.x + 25 &&
            py + 40 > birdY &&
            py < birdY + 15
          ) {
            setGameState("gameover");
            setHighScore((prev) => Math.max(prev, score));
          }
        }

        // Update score
        if (!obs.passed && obs.x + 30 < px) {
          obs.passed = true;
          setScore((prev) => prev + 10);
        }

        return obs.x > -50;
      });

      // Draw score
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 20px monospace";
      ctx.fillText(`Score: ${score}`, 10, 30);

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationId);
  }, [gameState, score]);

  return (
    <Card className="border-primary/30 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Gamepad2 className="h-5 w-5 text-white" />
            </div>
            Pixel Runner
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Trophy className="h-3 w-3" />
              {highScore}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={280}
            className="w-full rounded-lg border border-primary/30 cursor-pointer"
            onClick={() => {
              if (gameState === "ready") startGame();
              else if (gameState === "playing") jump();
            }}
          />

          {gameState === "ready" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Prêt ?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Appuyez sur Espace ou cliquez pour sauter
                </p>
                <Button onClick={startGame} className="gap-2">
                  <Play className="h-4 w-4" />
                  Jouer
                </Button>
              </div>
            </motion.div>
          )}

          {gameState === "gameover" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-red-500 mb-2">Game Over!</h3>
                <p className="text-2xl font-bold mb-1">{score} points</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Record: {highScore}
                </p>
                <Button onClick={startGame} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Rejouer
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          Évitez les obstacles ! Appuyez sur Espace ou cliquez pour sauter.
        </div>
      </CardContent>
    </Card>
  );
}
