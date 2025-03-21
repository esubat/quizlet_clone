import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { MatchingPair } from "@/lib/schemas";

interface MatchingGameProps {
  pairs: MatchingPair[];
  clearPDF: () => void;
  title: string;
}

export default function MatchingGame({ pairs, clearPDF, title }: MatchingGameProps) {
  const [shuffledTerms, setShuffledTerms] = useState<Array<{ id: number; text: string }>>([]);
  const [shuffledDefinitions, setShuffledDefinitions] = useState<Array<{ id: number; text: string }>>([]);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [score, setScore] = useState<number>(0);

  // Initialize the game
  useEffect(() => {
    const shuffleArray = <T,>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const terms = pairs.map((pair, index) => ({ id: index, text: pair.term }));
    const definitions = pairs.map((pair, index) => ({ id: index, text: pair.definition }));

    setShuffledTerms(shuffleArray(terms));
    setShuffledDefinitions(shuffleArray(definitions));
    setMatchedPairs(new Set());
    setScore(0);
    setSelectedTermId(null);
  }, [pairs]);

  const handleTermClick = (id: number) => {
    if (matchedPairs.has(id)) return;
    setSelectedTermId(id);
  };

  const handleDefinitionClick = (id: number) => {
    if (!selectedTermId || matchedPairs.has(id)) return;

    if (selectedTermId === id) {
      // Correct match
      setMatchedPairs(prev => new Set([...prev, id]));
      setScore(prev => prev + 1);
      setSelectedTermId(null);
    } else {
      // Incorrect match
      setTimeout(() => {
        setSelectedTermId(null);
      }, 1000);
    }
  };

  const resetGame = () => {
    const shuffleArray = <T,>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    setShuffledTerms(shuffleArray([...shuffledTerms]));
    setShuffledDefinitions(shuffleArray([...shuffledDefinitions]));
    setMatchedPairs(new Set());
    setScore(0);
    setSelectedTermId(null);
  };

  const progress = (score / pairs.length) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8 text-center">{title}</h1>
        <Progress value={progress} className="h-1 mb-8" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Terms Column */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Terms</h2>
            <div className="space-y-3">
              {shuffledTerms.map(({ id, text }) => (
                <Card
                  key={`term-${id}`}
                  className={`p-4 cursor-pointer transition-all ${
                    matchedPairs.has(id)
                      ? "bg-green-100 dark:bg-green-900/20"
                      : selectedTermId === id
                      ? "ring-2 ring-primary"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => handleTermClick(id)}
                >
                  <p className="font-medium">{text}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Definitions Column */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Definitions</h2>
            <div className="space-y-3">
              {shuffledDefinitions.map(({ id, text }) => (
                <Card
                  key={`def-${id}`}
                  className={`p-4 cursor-pointer transition-all ${
                    matchedPairs.has(id)
                      ? "bg-green-100 dark:bg-green-900/20"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => handleDefinitionClick(id)}
                >
                  <p className="font-medium">{text}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {score === pairs.length && (
          <motion.div 
            className="mt-8 flex justify-center space-x-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button onClick={resetGame} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" /> Play Again
            </Button>
            <Button onClick={clearPDF}>
              <FileText className="mr-2 h-4 w-4" /> Try Another PDF
            </Button>
          </motion.div>
        )}

        <div className="mt-4 text-center text-sm text-muted-foreground">
          {score < pairs.length && (
            <p>Click a term, then click its matching definition</p>
          )}
        </div>
      </main>
    </div>
  );
} 