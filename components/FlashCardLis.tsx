"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import FlashCard from "./FlashCar"

interface FlashCard {
  question: string
  answer: string
}

interface FlashCardListProps {
  cards: FlashCard[]
}

export default function FlashCardList({ cards }: FlashCardListProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isShuffled, setIsShuffled] = useState(false)
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([])

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % cards.length)
  }

  const previousCard = () => {
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)
  }

  const shuffleCards = () => {
    const newIndices = [...Array(cards.length).keys()]
    for (let i = newIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newIndices[i], newIndices[j]] = [newIndices[j], newIndices[i]]
    }
    setShuffledIndices(newIndices)
    setIsShuffled(true)
  }

  const currentCard = isShuffled ? cards[shuffledIndices[currentIndex]] : cards[currentIndex]

  return (
    <div className="w-full space-y-6 relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={previousCard}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={nextCard}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={shuffleCards}
          className="text-muted-foreground hover:text-foreground"
        >
          <Shuffle className="h-4 w-4 mr-2" />
          {isShuffled ? "Unshuffle" : "Shuffle"}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
        >
          <FlashCard question={currentCard.question} answer={currentCard.answer} />
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center space-x-2">
        {cards.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === currentIndex ? "bg-primary" : "bg-muted hover:bg-muted-foreground"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

