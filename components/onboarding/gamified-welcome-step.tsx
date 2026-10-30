"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Trophy, Brain, ShieldCheck, Sparkles } from "lucide-react";
import type { OnboardingData } from "@/app/onboarding/page";

interface GamefiedWelcomeStepProps {
  data: OnboardingData;
  onNext: (data?: Partial<OnboardingData>) => void;
  onBack: () => void;
  onSkip: () => void;
}

export function GamefiedWelcomeStep({
  data,
  onNext,
}: GamefiedWelcomeStepProps) {
  const [showXPAnimation, setShowXPAnimation] = useState(false);

  const handleContinue = () => {
    setShowXPAnimation(true);
    setTimeout(() => {
      onNext();
    }, 1500);
  };

  return (
    <div className="text-center space-y-8 max-w-6xl mx-auto relative px-4">
      {/* XP Animation */}
      {showXPAnimation && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="bg-gradient-to-r from-[#F46036] to-[#D74E25] text-white px-8 py-4 rounded-2xl text-2xl font-heading font-bold shadow-2xl shadow-orange-500/50 flex items-center gap-3"
          >
            <Sparkles className="w-6 h-6 animate-spin-slow" />
            +50 XP Unlocked!
          </motion.div>
        </div>
      )}

      {/* Hero Section */}
      <div className="grid lg:grid-cols-2 gap-12 items-center pt-8 pb-16 lg:pb-32">
        {/* Left: Copy */}
        <div className="text-left space-y-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <Badge
              variant="outline"
              className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-sm font-bold px-4 py-2 animate-pulse"
            >
              🧠 The Accountability Platform
            </Badge>
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground leading-tight tracking-tight">
              Put Your Credits <br />
              Where Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F46036] to-[#D74E25]">
                Mouth Is.
              </span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed font-medium max-w-xl">
              Stakr is where you back your goals with credits. Prove your
              progress, build streaks, and share the pot with everyone who
              finishes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              onClick={handleContinue}
              size="lg"
              className="text-lg font-bold px-8 py-6 bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] shadow-lg shadow-orange-500/20 transition-all duration-300 group relative overflow-hidden rounded-xl w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Zap className="w-5 h-5 mr-2 fill-white/20" />
              Start Your Journey
            </Button>

            <Button
              onClick={() => (window.location.href = "/auth/signin")}
              variant="outline"
              size="lg"
              className="text-base font-medium px-8 py-6 w-full sm:w-auto border-white/10 hover:bg-white/5"
            >
              Login
            </Button>
          </motion.div>
        </div>

        {/* Right: how it works. Replaces invented example challenges, made-up participant counts and a
            fake "live activity" ticker, none of which reflected real activity. */}
        <ol
          className="relative z-10 space-y-4 text-left"
          aria-label="How Stakr works"
        >
          {[
            [
              "1",
              "Pick a challenge",
              "Read the published rules, then back your commitment with credits. The exact fee is shown before you join.",
            ],
            [
              "2",
              "Show your progress",
              "Submit evidence for each required day. A neutral reviewer checks it against the rules.",
            ],
            [
              "3",
              "Finish and share the pot",
              "Complete the required days to get your stake back, plus a share of the credits others forfeit.",
            ],
          ].map(([n, title, body]) => (
            <li
              key={n}
              className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#F46036] to-[#D74E25] font-heading text-lg font-bold text-white">
                {n}
              </span>
              <div>
                <h3 className="font-heading text-lg font-bold">{title}</h3>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Value Props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto pb-8">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-left">
          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
            <Trophy className="w-6 h-6 text-[#F46036]" />
          </div>
          <h3 className="font-heading font-bold text-lg mb-2">Share the pot</h3>
          <p className="text-sm text-muted-foreground">
            Everyone who completes a challenge gets their own stake back and
            splits what others forfeit. Credits have no cash value.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-left">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
            <Brain className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="font-heading font-bold text-lg mb-2">Prove it</h3>
          <p className="text-sm text-muted-foreground">
            Submit text, photo or video evidence. A neutral reviewer checks it
            against the published rules, and you can appeal a rejection.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-left">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="font-heading font-bold text-lg mb-2">
            Fair by design
          </h3>
          <p className="text-sm text-muted-foreground">
            Fees and payout rules are shown before you join and cannot change
            afterwards.
          </p>
        </div>
      </div>
    </div>
  );
}
