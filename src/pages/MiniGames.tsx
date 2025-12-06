import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gamepad2, Globe, Flag, Trophy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeoQuiz } from "@/components/games/GeoQuiz";
import { PixelRunner } from "@/components/games/PixelRunner";
import { FlagMatch } from "@/components/games/FlagMatch";
import { motion } from "framer-motion";

const MiniGames = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Gamepad2 className="h-8 w-8 text-primary" />
              Mini-Jeux
            </h1>
            <p className="text-muted-foreground">
              Testez vos connaissances en géopolitique et actualité !
            </p>
          </div>
        </div>

        {/* Games Tabs */}
        <Tabs defaultValue="geoquiz" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="geoquiz" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Quiz Géopolitique</span>
              <span className="sm:hidden">Quiz</span>
            </TabsTrigger>
            <TabsTrigger value="pixelrunner" className="gap-2">
              <Gamepad2 className="h-4 w-4" />
              <span className="hidden sm:inline">Pixel Runner</span>
              <span className="sm:hidden">Runner</span>
            </TabsTrigger>
            <TabsTrigger value="flagmatch" className="gap-2">
              <Flag className="h-4 w-4" />
              <span className="hidden sm:inline">Flag Match</span>
              <span className="sm:hidden">Flags</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geoquiz">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <GeoQuiz />
            </motion.div>
          </TabsContent>

          <TabsContent value="pixelrunner">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PixelRunner />
            </motion.div>
          </TabsContent>

          <TabsContent value="flagmatch">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FlagMatch />
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-purple-600/10 rounded-xl border border-primary/20"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Apprenez en vous amusant !</h3>
              <p className="text-muted-foreground text-sm">
                Ces mini-jeux sont conçus pour tester et améliorer vos connaissances en géopolitique, 
                géographie et actualité mondiale. Jouez régulièrement pour devenir incollable !
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MiniGames;
