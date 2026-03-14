"use client"

import { Button } from "@/components/ui/button"
import { BackgroundImage } from '@/components/ui/background-image'
import { Badge } from "@/components/ui/badge"
import { Ban, Mail, MessageCircle, Scale } from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"

export default function SuspendedPage() {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/alpha-gate' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <BackgroundImage 
          src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=80"
          alt="Account suspended background"
          className="w-full h-full object-cover grayscale-[30%] dark:grayscale-[50%]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/70 to-white/80 dark:from-black/80 dark:via-black/70 dark:to-black/80"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black via-transparent to-white/50 dark:to-black/50"></div>
      </div>

      {/* Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-red-500 rounded-full mix-blend-screen filter blur-[120px] opacity-10 dark:opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-rose-500 rounded-full mix-blend-screen filter blur-[100px] opacity-[0.07] dark:opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Noise Texture */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/20">
            <Ban className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">Account <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500">Suspended</span></h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 font-body">Your account has been temporarily suspended</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
          
          <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-red-200 dark:border-red-500/20 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <div className="relative p-8 space-y-6">
              {/* Status Banner */}
              <div className="flex items-center justify-center gap-3 bg-red-500/10 border border-red-500/20 backdrop-blur-sm rounded-xl p-4">
                <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div className="text-center">
                  <p className="text-sm font-heading font-bold text-red-700 dark:text-red-300 uppercase tracking-wider">Account Status: Suspended</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-body">Account access has been restricted due to violations of our community guidelines.</p>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm rounded-xl p-4 flex items-start gap-3">
                <Scale className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-heading font-bold text-orange-700 dark:text-orange-300"><strong>Reason:</strong> Inappropriate username</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-body">Usernames must be respectful and appropriate for all users.</p>
                </div>
              </div>

              {/* What this means */}
              <div className="space-y-3">
                <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">What this means:</h3>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 font-body">
                  <li className="flex items-start gap-2">
                    <Badge variant="destructive" className="mt-0.5 text-xs shrink-0">×</Badge>
                    Cannot participate in challenges
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="destructive" className="mt-0.5 text-xs shrink-0">×</Badge>
                    Cannot create or join new challenges
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="destructive" className="mt-0.5 text-xs shrink-0">×</Badge>
                    Cannot post content or interact with other users
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="destructive" className="mt-0.5 text-xs shrink-0">×</Badge>
                    Limited access to platform features
                  </li>
                </ul>
              </div>

              {/* Next steps */}
              <div className="space-y-3">
                <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">Next steps:</h3>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 font-body bg-slate-100/50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl p-4">
                  <p>To restore your account access, please contact our support team to:</p>
                  <ul className="space-y-1 ml-4">
                    <li>• Discuss the reason for suspension</li>
                    <li>• Update your username to comply with guidelines</li>
                    <li>• Confirm your understanding of our community standards</li>
                  </ul>
                </div>
              </div>

              {/* Contact buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  asChild 
                  size="lg"
                  className="w-full h-14 bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] text-white font-heading font-bold text-lg shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-[1.02] rounded-xl"
                >
                  <Link href="mailto:support@stakr.app?subject=Account Suspension Appeal&body=Hello Stakr Support Team,%0D%0A%0D%0AI am writing to appeal my account suspension. I understand that my username violated community guidelines and I would like to update it to comply with your standards.%0D%0A%0D%0AAccount Email: [Your Email]%0D%0AReason for Suspension: Inappropriate Username%0D%0A%0D%0AThank you for your time.">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Support
                  </Link>
                </Button>
                
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg"
                  className="w-full h-12 bg-white/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-white hover:bg-white dark:hover:bg-white/10 backdrop-blur-sm transition-all duration-300 font-heading font-medium"
                >
                  <Link href="/community-guidelines">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Review Community Guidelines
                  </Link>
                </Button>
                
                <Button 
                  onClick={handleSignOut}
                  variant="ghost" 
                  size="lg"
                  className="w-full h-12 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-heading"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
            Account suspensions are reviewed on a case-by-case basis
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
            For urgent matters, email: <Link href="mailto:support@stakr.app" className="text-[#F46036] hover:underline">support@stakr.app</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
