"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Ban, Mail, MessageCircle, Scale } from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"

export default function SuspendedPage() {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Ban className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Suspended</h1>
            <p className="text-gray-600 mt-2">Your account has been temporarily suspended</p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Ban className="w-5 h-5" />
              Account Status: Suspended
            </CardTitle>
            <CardDescription>
              Your account access has been restricted due to violations of our community guidelines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Reason */}
            <Alert className="border-orange-200 bg-orange-50">
              <Scale className="h-4 w-4" />
              <AlertDescription>
                <strong>Reason:</strong> Inappropriate username that violates our community standards.
                Usernames must be respectful and appropriate for all users.
              </AlertDescription>
            </Alert>

            {/* What this means */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">What this means:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Badge variant="destructive" className="mt-0.5 text-xs">×</Badge>
                  Cannot participate in challenges
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="destructive" className="mt-0.5 text-xs">×</Badge>
                  Cannot create or join new challenges
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="destructive" className="mt-0.5 text-xs">×</Badge>
                  Cannot post content or interact with other users
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="destructive" className="mt-0.5 text-xs">×</Badge>
                  Limited access to platform features
                </li>
              </ul>
            </div>

            {/* Next steps */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Next steps:</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  To restore your account access, please contact our support team to:
                </p>
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
                className="w-full"
                variant="default"
              >
                <Link href="mailto:support@stakr.app?subject=Account Suspension Appeal&body=Hello Stakr Support Team,%0D%0A%0D%0AI am writing to appeal my account suspension. I understand that my username violated community guidelines and I would like to update it to comply with your standards.%0D%0A%0D%0AAccount Email: [Your Email]%0D%0AReason for Suspension: Inappropriate Username%0D%0A%0D%0AThank you for your time.">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                className="w-full"
              >
                <Link href="/community-guidelines">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Review Community Guidelines
                </Link>
              </Button>
              
              <Button 
                onClick={handleSignOut}
                variant="ghost" 
                className="w-full text-gray-600"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            Account suspensions are reviewed on a case-by-case basis
          </p>
          <p className="text-xs text-gray-500">
            For urgent matters, email: <Link href="mailto:support@stakr.app" className="text-blue-600 hover:underline">support@stakr.app</Link>
          </p>
        </div>
      </div>
    </div>
  )
} 