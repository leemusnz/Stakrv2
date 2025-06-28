"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, Dumbbell, Book, Smartphone, Heart, Briefcase, Filter, X, Check, RotateCcw } from "lucide-react"

export function DiscoverFilters() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("")
  const [selectedDuration, setSelectedDuration] = useState<string>("")
  const [selectedStakeRange, setSelectedStakeRange] = useState<string>("")

  const categories = [
    {
      id: "mindfulness",
      name: "Mindfulness",
      icon: Brain,
      borderColor: "#8B5CF6",
      bgColor: "#8B5CF6",
    },
    {
      id: "fitness",
      name: "Fitness",
      icon: Dumbbell,
      borderColor: "#EF4444",
      bgColor: "#EF4444",
    },
    {
      id: "learning",
      name: "Learning",
      icon: Book,
      borderColor: "#3B82F6",
      bgColor: "#3B82F6",
    },
    {
      id: "digital-wellness",
      name: "Digital Wellness",
      icon: Smartphone,
      borderColor: "#10B981",
      bgColor: "#10B981",
    },
    {
      id: "wellness",
      name: "Wellness",
      icon: Heart,
      borderColor: "#EC4899",
      bgColor: "#EC4899",
    },
    {
      id: "productivity",
      name: "Productivity",
      icon: Briefcase,
      borderColor: "#F97316",
      bgColor: "#F97316",
    },
  ]

  const difficulties = ["Easy", "Medium", "Hard"]
  const durations = ["1-7 days", "1-2 weeks", "2-4 weeks", "30+ days"]
  const stakeRanges = ["$0-25", "$25-50", "$50-100", "$100+"]

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedDifficulty("")
    setSelectedDuration("")
    setSelectedStakeRange("")
  }

  const hasActiveFilters = selectedCategories.length > 0 || selectedDifficulty || selectedDuration || selectedStakeRange

  return (
    <Card className="shadow-sm border-muted-foreground/10">
      <CardContent className="p-6 bg-muted/20">
        <div className="space-y-6">
          {/* Filter Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg text-foreground">Filter Challenges</h3>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                Clear all
              </Button>
            )}
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-muted-foreground">CATEGORIES</h4>
              {selectedCategories.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategories([])}
                  className="text-xs text-muted-foreground hover:text-foreground h-auto p-1"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon
                const isSelected = selectedCategories.includes(category.id)
                return (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md border-2 font-bold text-sm transition-all hover:scale-105"
                    style={{
                      backgroundColor: isSelected ? category.bgColor : "#ffffff",
                      borderColor: category.borderColor,
                      color: isSelected ? "#ffffff" : "#000000",
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                    {isSelected && <Check className="w-3 h-3" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Other Filters - Pill Toggles */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-muted-foreground">DIFFICULTY</h4>
                {selectedDifficulty && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDifficulty("")}
                    className="text-xs text-muted-foreground hover:text-foreground h-auto p-1"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {difficulties.map((difficulty) => (
                  <Button
                    key={difficulty}
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDifficulty(selectedDifficulty === difficulty ? "" : difficulty)}
                    className={`transition-all ${
                      selectedDifficulty === difficulty
                        ? "bg-primary text-white border-primary"
                        : "bg-transparent hover:bg-primary/10 hover:border-primary/40"
                    }`}
                  >
                    {difficulty}
                    {selectedDifficulty === difficulty && <Check className="w-3 h-3 ml-1" />}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-muted-foreground">DURATION</h4>
                {selectedDuration && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDuration("")}
                    className="text-xs text-muted-foreground hover:text-foreground h-auto p-1"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {durations.map((duration) => (
                  <Button
                    key={duration}
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDuration(selectedDuration === duration ? "" : duration)}
                    className={`transition-all ${
                      selectedDuration === duration
                        ? "bg-secondary text-white border-secondary"
                        : "bg-transparent hover:bg-secondary/10 hover:border-secondary/40"
                    }`}
                  >
                    {duration}
                    {selectedDuration === duration && <Check className="w-3 h-3 ml-1" />}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-muted-foreground">STAKE RANGE</h4>
                {selectedStakeRange && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStakeRange("")}
                    className="text-xs text-muted-foreground hover:text-foreground h-auto p-1"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {stakeRanges.map((range) => (
                  <Button
                    key={range}
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedStakeRange(selectedStakeRange === range ? "" : range)}
                    className={`transition-all ${
                      selectedStakeRange === range
                        ? "bg-success text-white border-success"
                        : "bg-transparent hover:bg-success/10 hover:border-success/40"
                    }`}
                  >
                    {range}
                    {selectedStakeRange === range && <Check className="w-3 h-3 ml-1" />}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Apply Filters Button */}
          {hasActiveFilters && (
            <div className="pt-4 border-t border-muted">
              <Button className="w-full font-bold">
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters (
                {selectedCategories.length +
                  (selectedDifficulty ? 1 : 0) +
                  (selectedDuration ? 1 : 0) +
                  (selectedStakeRange ? 1 : 0)}
                )
              </Button>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">ACTIVE FILTERS</h4>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((categoryId) => {
                  const category = categories.find((c) => c.id === categoryId)
                  return (
                    <Badge
                      key={categoryId}
                      variant="secondary"
                      className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20"
                    >
                      {category?.name}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-destructive"
                        onClick={() => toggleCategory(categoryId)}
                      />
                    </Badge>
                  )
                })}
                {selectedDifficulty && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20"
                  >
                    {selectedDifficulty}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => setSelectedDifficulty("")}
                    />
                  </Badge>
                )}
                {selectedDuration && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20"
                  >
                    {selectedDuration}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => setSelectedDuration("")}
                    />
                  </Badge>
                )}
                {selectedStakeRange && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20"
                  >
                    {selectedStakeRange}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => setSelectedStakeRange("")}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
