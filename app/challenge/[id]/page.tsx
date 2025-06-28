import { ChallengeDetailHeader } from "@/components/challenge-detail-header"
import { ChallengeDescription } from "@/components/challenge-description"
import { ChallengeStakeSection } from "@/components/challenge-stake-section"
import { ChallengeParticipants } from "@/components/challenge-participants"
import { ChallengeHost } from "@/components/challenge-host"
import { ChallengeProgress } from "@/components/challenge-progress"

// Mock data
const challengeData = {
  id: "morning-meditation-7day",
  title: "Morning Meditation Streak",
  description: "Transform your mornings and build unshakeable mental clarity with a 7-day meditation commitment.",
  longDescription: `Start every day with intention and focus. This challenge will help you build a sustainable meditation practice that sticks.

**What you'll do:**
• Meditate for 10+ minutes every morning
• Complete before 10 AM in your timezone  
• Submit daily proof via photo or video
• Join our supportive community chat

**What you'll gain:**
• Reduced stress and anxiety
• Better focus throughout the day
• Improved emotional regulation
• A habit that lasts beyond 7 days

This isn't just about sitting quietly - it's about rewiring your brain for success. Every morning you show up, you're proving to yourself that you can keep commitments and prioritize your wellbeing.`,
  category: "Mindfulness",
  duration: "7 days",
  difficulty: "Easy",
  participants: 234,
  completionRate: 78,
  minStake: 10,
  maxStake: 100,
  totalPot: 18420,
  startDate: "2024-01-15",
  endDate: "2024-01-22",
  rules: [
    "Meditate for minimum 10 minutes each morning",
    "Must complete before 10 AM in your local timezone",
    "Submit proof daily (photo of meditation setup or brief video)",
    "No makeup days - consistency is key",
    "Be respectful in community discussions",
  ],
  host: {
    name: "Sarah Chen",
    avatar: "/placeholder.svg?height=60&width=60",
    bio: "Mindfulness coach with 8 years experience. Helped 1000+ people build lasting meditation habits.",
    completedChallenges: 12,
    successRate: 94,
    verified: true,
  },
  isJoined: false,
  userProgress: null,
  recentActivity: [
    {
      id: "1",
      user: "Mike R.",
      action: "completed day 3",
      timestamp: "2 hours ago",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: "2",
      user: "Lisa K.",
      action: "joined the challenge",
      timestamp: "4 hours ago",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: "3",
      user: "Alex M.",
      action: "completed day 5",
      timestamp: "6 hours ago",
      avatar: "/placeholder.svg?height=32&width=32",
    },
  ],
}

export default function ChallengePage() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <ChallengeDetailHeader challenge={challengeData} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <ChallengeDescription challenge={challengeData} />
          {challengeData.isJoined && <ChallengeProgress challenge={challengeData} />}
          <ChallengeParticipants
            participants={challengeData.participants}
            recentActivity={challengeData.recentActivity}
            completionRate={challengeData.completionRate}
          />
        </div>
        <div className="space-y-6">
          <ChallengeStakeSection challenge={challengeData} />
          <ChallengeHost host={challengeData.host} />
        </div>
      </div>
    </div>
  )
}
