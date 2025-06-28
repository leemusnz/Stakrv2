"use client"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Brain, Dumbbell, Book, Smartphone, Heart, Briefcase, Filter, Check, RotateCcw } from "lucide-react"

interface FilterDrawerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  selectedDifficulty: string
  setSelectedDifficulty: (difficulty: string) => void
  selectedDuration: string
  setSelectedDuration: (duration: string) => void
  selectedStakeRange: string
  setSelectedStakeRange: (range: string) => void
}

export function FilterDrawer({
  isOpen,
  onOpenChange,
  selectedCategories,
  setSelectedCategories,
  selectedDifficulty,
  setSelectedDifficulty,
  selectedDuration,
  setSelectedDuration,
  selectedStakeRange,
  setSelectedStakeRange,
}: FilterDrawerProps) {
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
    setSelectedCategories(
      selectedCategories.includes(categoryId)
        ? selectedCategories.filter((id) => id !== categoryId)
        : [...selectedCategories, categoryId],
    )
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedDifficulty("")
    setSelectedDuration("")
    setSelectedStakeRange("")
  }

  const hasActiveFilters = selectedCategories.length > 0 || selectedDifficulty || selectedDuration || selectedStakeRange

  const applyFilters = () => {
    // Apply filters and close drawer
    onOpenChange(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Filter Challenges
            </SheetTitle>
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
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[60vh] pb-6">
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

          {/* Other Filters */}
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
        </div>

        {/* Apply Button - Sticky at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t border-muted">
          <Button onClick={applyFilters} className="w-full font-bold text-lg py-6">
            <Filter className="w-5 h-5 mr-2" />
            {hasActiveFilters
              ? `Apply Filters (${
                  selectedCategories.length +
                  (selectedDifficulty ? 1 : 0) +
                  (selectedDuration ? 1 : 0) +
                  (selectedStakeRange ? 1 : 0)
                })`
              : "Apply Filters"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
