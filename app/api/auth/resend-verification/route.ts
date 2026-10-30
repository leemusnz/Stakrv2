import { NextRequest, NextResponse } from "next/server";
import { createDbConnection } from "@/lib/db";
import {
  sendEmail,
  createVerificationEmail,
  generateVerificationToken,
} from "@/lib/email";
import {
  enforce,
  LIMITS,
  tooManyRequests,
  getClientIp,
} from "@/lib/rate-limit-db";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Email address is required",
        },
        { status: 400 },
      );
    }

    // Each request can send an email, so cap it per address and per IP (email-bombing, quota burn).
    const limited = await enforce([
      [LIMITS.emailSendPerIp, getClientIp(request)],
      [LIMITS.emailSendPerAddress, email],
    ]);
    if (!limited.allowed) return tooManyRequests(limited.retryAfterSeconds);

    // Same answer whether or not the account exists or is already verified, so this endpoint
    // cannot be used to learn which emails are registered.
    const generic = NextResponse.json({
      success: true,
      message:
        "If that account needs verification, a new email is on its way. Please check your inbox and spam folder.",
    });

    // Check if user exists and is not already verified
    const sql = createDbConnection();
    const users = await sql`
      SELECT id, email, name, email_verified 
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `;

    if (users.length === 0) return generic;

    const user = users[0];

    // Check if already verified
    if (user.email_verified === true) return generic;

    // Generate new verification token
    const verificationToken = generateVerificationToken();

    try {
      // Store new verification token in database (replacing any existing ones)
      await sql`
        SELECT create_verification_token(${email}, ${verificationToken}, 'email_verification', 24)
      `;

      // Send verification email
      const emailTemplate = createVerificationEmail(
        email,
        verificationToken,
        user.name,
      );
      const emailResult = await sendEmail(emailTemplate);

      if (!emailResult.success) {
        console.error(
          "❌ Failed to resend verification email:",
          emailResult.error,
        );
        return NextResponse.json(
          {
            success: false,
            message:
              "Failed to send verification email. Please try again later.",
          },
          { status: 500 },
        );
      }

      return generic;
    } catch (emailError) {
      console.error("❌ Email resend setup failed:", emailError);
      return NextResponse.json(
        {
          success: false,
          message:
            "Failed to setup verification email. Please try again later.",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("❌ Resend verification failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Please try again later.",
      },
      { status: 500 },
    );
  }
}
