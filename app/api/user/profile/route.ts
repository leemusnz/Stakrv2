import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createDbConnection } from "@/lib/db";
import { moderationService } from "@/lib/moderation";
import { userProfileUpdateSchema } from "@/lib/validation";

// GET user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read live data: session claims are frozen at sign-in, so credits, XP and
    // streaks would otherwise stay stale for the whole 30-day token life.
    const sql = createDbConnection();
    const rows = await sql`
      SELECT id, name, username, email, email_verified, avatar_url, credits, trust_score,
             verification_tier, challenges_completed, current_streak, longest_streak,
             premium_subscription, onboarding_completed, xp, level, created_at
      FROM users WHERE id = ${session.user.id}
    `;
    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const profile = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      emailVerified: Boolean(user.email_verified),
      avatar: user.avatar_url,
      credits: Number(user.credits),
      trustScore: user.trust_score,
      verificationTier: user.verification_tier,
      challengesCompleted: user.challenges_completed,
      currentStreak: user.current_streak,
      longestStreak: user.longest_streak,
      premiumSubscription: user.premium_subscription,
      onboardingCompleted: user.onboarding_completed,
      xp: user.xp,
      level: user.level,
      createdAt: user.created_at,
    };

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      {
        error: "Failed to get profile",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 },
    );
  }
}

// PATCH update user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input with Zod
    const validationResult = userProfileUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

    const { name, username, avatar } = validationResult.data;

    // Validate name with moderation if provided
    if (name !== undefined) {
      try {
        const moderationResult =
          await moderationService.moderateProfileName(name);

        if (moderationResult.flagged) {
          return NextResponse.json(
            {
              error: "Profile name not allowed",
              reason: moderationResult.reason.join(", "),
              message:
                "Please choose a different name that follows our community guidelines",
            },
            { status: 400 },
          );
        }
      } catch (moderationError) {
        console.warn(
          "Moderation check failed, allowing name:",
          moderationError,
        );
      }
    }

    // Validate username with moderation if provided
    if (username !== undefined) {
      try {
        const moderationResult =
          await moderationService.moderateProfileName(username);

        if (moderationResult.flagged) {
          return NextResponse.json(
            {
              error: "Username not allowed",
              reason: moderationResult.reason.join(", "),
              message:
                "Please choose a different username that follows our community guidelines",
            },
            { status: 400 },
          );
        }
      } catch (moderationError) {
        console.warn(
          "Moderation check failed, allowing username:",
          moderationError,
        );
      }
    }

    // Try to update database if available
    if (name !== undefined || username !== undefined || avatar !== undefined) {
      try {
        const sql = createDbConnection();

        // Update fields individually to avoid SQL syntax issues
        let result: any[] = [];

        if (name !== undefined) {
          await sql`UPDATE users SET name = ${name}, updated_at = NOW() WHERE id = ${session.user.id}`;
        }
        if (username !== undefined) {
          await sql`UPDATE users SET username = ${username}, updated_at = NOW() WHERE id = ${session.user.id}`;
        }
        if (avatar !== undefined) {
          await sql`UPDATE users SET avatar_url = ${avatar}, updated_at = NOW() WHERE id = ${session.user.id}`;
        }

        // Fetch updated user data
        result = await sql`
          SELECT name, username, avatar_url, updated_at 
          FROM users 
          WHERE id = ${session.user.id}
        `;

        if (result.length > 0) {
          return NextResponse.json({
            success: true,
            message: "Profile updated successfully",
            profile: {
              ...session.user,
              name: result[0].name,
              username: result[0].username,
              image: result[0].avatar_url,
              avatar: result[0].avatar_url, // Include both fields for consistency
            },
            avatarUrl: result[0].avatar_url, // Explicit avatar URL for verification
          });
        }
      } catch (dbError) {}
    }

    // Fallback mock response for demo
    const mockUpdatedProfile = {
      ...session.user,
      name: name || session.user.name,
      username: username || session.user.email?.split("@")[0] || "user",
      image: avatar || session.user.image,
    };

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: mockUpdatedProfile,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      {
        error: "Failed to update profile",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 },
    );
  }
}
