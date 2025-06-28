import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle } from "lucide-react"

interface Challenge {
  longDescription: string
  rules: string[]
}

interface ChallengeDescriptionProps {
  challenge: Challenge
}

export function ChallengeDescription({ challenge }: ChallengeDescriptionProps) {
  return (
    <div className="space-y-6">
      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">About This Challenge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            {challenge.longDescription.split("\n\n").map((paragraph, index) => {
              if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
                return (
                  <h3 key={index} className="font-bold text-lg mt-6 mb-3">
                    {paragraph.replace(/\*\*/g, "")}
                  </h3>
                )
              }
              if (paragraph.includes("•")) {
                const lines = paragraph.split("\n")
                const title = lines[0]
                const items = lines.slice(1).filter((line) => line.trim())

                return (
                  <div key={index} className="space-y-2">
                    {title && <p className="font-medium">{title}</p>}
                    <ul className="space-y-1 ml-4">
                      {items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{item.replace("• ", "")}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              }
              return (
                <p key={index} className="text-muted-foreground leading-relaxed">
                  {paragraph}
                </p>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Challenge Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {challenge.rules.map((rule, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Badge
                  variant="outline"
                  className="text-xs font-bold bg-primary/10 text-primary border-primary/20 mt-0.5"
                >
                  {index + 1}
                </Badge>
                <p className="text-sm leading-relaxed">{rule}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
            <p className="text-xs text-destructive font-medium">
              ⚠️ Breaking any rule will result in forfeiting your stake. No exceptions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
