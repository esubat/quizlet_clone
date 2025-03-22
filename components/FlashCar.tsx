"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RotateCcw, RotateCw } from "lucide-react"

interface FlashCardProps {
  question: string
  answer: string
}

const FlashCard: React.FC<FlashCardProps> = ({ question, answer }) => {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="cursor-pointer perspective-[1000px]" onClick={() => setIsFlipped(!isFlipped)}>
        <div className="relative w-full aspect-[3/2] preserve-3d">
          <motion.div
            className="absolute inset-0 w-full h-full backface-hidden"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front of card (Question) */}
            <Card className="absolute inset-0 p-6 flex items-center justify-center text-center bg-primary/5 dark:bg-primary/10 shadow-lg hover:shadow-xl transition-shadow backface-hidden">
              <div className="text-xl font-medium">{question}</div>
            </Card>

            {/* Back of card (Answer) */}
            <Card
              className="absolute inset-0 p-6 flex items-center justify-center text-center bg-primary/5 dark:bg-primary/10 shadow-lg hover:shadow-xl transition-shadow backface-hidden"
              style={{
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
              }}
            >
              <div className="text-xl font-medium">{answer}</div>
            </Card>
          </motion.div>
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setIsFlipped(!isFlipped)
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          {isFlipped ? (
            <>
              <RotateCcw className="h-4 w-4 mr-2" />
              Show Question
            </>
          ) : (
            <>
              <RotateCw className="h-4 w-4 mr-2" />
              Show Answer
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default FlashCard

