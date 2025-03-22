"use client"
import { Card } from "@/components/ui/card"
import { Check, X } from "lucide-react"

interface MatchingCardProps {
  term: string
  definition: string
  isSelected: boolean
  isCorrect: boolean | null
  onClick: () => void
}

export default function MatchingCard({ term, definition, isSelected, isCorrect, onClick }: MatchingCardProps) {
  return (
    <Card
      className={`cursor-pointer p-4 transition-all ${isSelected ? "ring-2 ring-primary" : ""} ${
        isCorrect === true
          ? "bg-green-100 dark:bg-green-900/20"
          : isCorrect === false
            ? "bg-red-100 dark:bg-red-900/20"
            : "hover:bg-accent"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="font-medium">{term || definition}</div>
        {isCorrect === true && <Check className="text-green-600" size={20} />}
        {isCorrect === false && <X className="text-red-600" size={20} />}
      </div>
    </Card>
  )
}

