import React from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  onRatingChange: (rating: number) => void
  className?: string
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  className
}) => {
  const [hover, setHover] = React.useState<number | null>(null)

  return (
    <div className={cn("flex space-x-1", className)}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(null)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              "size-6 transition-all",
              (hover ? hover >= star : rating >= star)
                ? "fill-foreground text-foreground"
                : "text-muted-foreground fill-none"
            )}
          />
        </button>
      ))}
    </div>
  )
}

export default StarRating
