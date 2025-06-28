import { Input } from "@/components/ui/input"
import { Search, Zap } from "lucide-react"

interface DiscoverHeaderProps {
  activeTab: string
}

export function DiscoverHeader({ activeTab }: DiscoverHeaderProps) {
  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case "creators":
        return "Search creators..."
      case "brands":
        return "Search brands..."
      default:
        return "Search challenges..."
    }
  }

  const getStats = () => {
    switch (activeTab) {
      case "creators":
        return [
          { icon: <Zap className="w-4 h-4 text-primary" />, label: "156 verified creators" },
          { label: "4.8★ avg rating" },
          { label: "92% success rate" },
        ]
      case "brands":
        return [
          { icon: <Zap className="w-4 h-4 text-primary" />, label: "43 partner brands" },
          { label: "$500K+ in rewards" },
          { label: "89 active sponsorships" },
        ]
      default:
        return [
          { icon: <Zap className="w-4 h-4 text-primary" />, label: "1,247 active challenges" },
          { label: "$2.3M in active stakes" },
          { label: "89% avg completion rate" },
        ]
    }
  }

  const getTitle = () => {
    switch (activeTab) {
      case "creators":
        return (
          <>
            Find Your <span className="text-primary">Inspiration</span>
          </>
        )
      case "brands":
        return (
          <>
            Partner <span className="text-primary">Brands</span>
          </>
        )
      default:
        return (
          <>
            Discover Your Next <span className="text-primary">Challenge</span>
          </>
        )
    }
  }

  const getDescription = () => {
    switch (activeTab) {
      case "creators":
        return "Follow creators who inspire you, learn from their journeys, and join their exclusive challenges."
      case "brands":
        return "Discover brands that align with your values and participate in sponsored challenges with amazing rewards."
      default:
        return "Put your money where your mouth is. Find challenges that push your limits and help you grow stronger every day."
    }
  }

  const stats = getStats()

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">{getTitle()}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{getDescription()}</p>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center gap-1">
            {stat.icon}
            <span>
              <strong>{stat.label.split(" ")[0]}</strong> {stat.label.split(" ").slice(1).join(" ")}
            </span>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="max-w-lg mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={getSearchPlaceholder()}
            className="pl-10 pr-4 py-2 text-sm bg-muted/50 border-muted-foreground/20 focus:bg-background"
          />
        </div>
      </div>
    </div>
  )
}
