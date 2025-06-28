import { ChallengeCard } from "@/components/challenge-card"
import { Card, CardContent } from "@/components/ui/card"
import { Target, Trophy, Flame, TrendingUp } from "lucide-react"

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground">
          Put Your Money Where Your <span className="text-primary">Goals</span> Are
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Stake real money on personal challenges. Complete them and win rewards. Fail and lose your stake. The ultimate
          accountability system.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors">
            Start Your First Challenge
          </button>
          <button className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors">
            Browse Challenges
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Challenges</p>
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground">$125 at stake</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Target className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">$890 earned</p>
              </div>
              <div className="p-3 rounded-full bg-success/10 text-success">
                <Trophy className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">7</p>
                <p className="text-xs text-muted-foreground">days strong</p>
              </div>
              <div className="p-3 rounded-full bg-orange-500/10 text-orange-500">
                <Flame className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">92%</p>
                <p className="text-xs text-success flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Personal best!
                </p>
              </div>
              <div className="p-3 rounded-full bg-secondary/10 text-secondary">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Challenges Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Your Active Challenges</h2>
          <button className="text-primary hover:text-primary/80 font-medium">View All</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ChallengeCard
            id="1"
            title="Morning Meditation Streak"
            description="Meditate for 10 minutes every morning for 7 days straight. Build mindfulness and start your day with intention."
            category="Mindfulness"
            duration="7 days"
            participants={234}
            minStake={10}
            maxStake={100}
            difficulty="Easy"
          />

          <ChallengeCard
            id="2"
            title="10K Steps Daily"
            description="Walk at least 10,000 steps every single day. No excuses, no shortcuts. Your health is worth it."
            category="Fitness"
            duration="14 days"
            participants={567}
            minStake={25}
            maxStake={200}
            difficulty="Medium"
            progress={65}
            isJoined={true}
            isActive={true}
          />

          <ChallengeCard
            id="3"
            title="No Social Media"
            description="Complete digital detox. Delete all social media apps for 30 days and reclaim your attention."
            category="Digital Wellness"
            duration="30 days"
            participants={89}
            minStake={50}
            maxStake={500}
            difficulty="Hard"
          />
        </div>
      </div>

      {/* Trending Challenges */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Trending Challenges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ChallengeCard
            id="4"
            title="Read 20 Pages Daily"
            description="Read at least 20 pages of a book every day. Expand your mind and build a consistent reading habit."
            category="Learning"
            duration="21 days"
            participants={345}
            minStake={15}
            maxStake={150}
            difficulty="Easy"
          />

          <ChallengeCard
            id="5"
            title="Cold Shower Challenge"
            description="Take a cold shower every morning for 14 days. Build mental toughness and boost your energy levels."
            category="Wellness"
            duration="14 days"
            participants={156}
            minStake={20}
            maxStake={100}
            difficulty="Medium"
          />

          <ChallengeCard
            id="6"
            title="Launch Your Side Project"
            description="Ship a complete side project in 30 days. No more excuses - it's time to build something real."
            category="Productivity"
            duration="30 days"
            participants={67}
            minStake={100}
            maxStake={1000}
            difficulty="Hard"
          />
        </div>
      </div>
    </div>
  )
}
