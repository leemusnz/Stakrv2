# 🚨 TEMPORARY FIX: Bypass Email Verification

If you can't access your database immediately, here's a temporary fix for the registration endpoint:

## Option 1: Comment Out Email Verification (Quick Fix)

In `app/api/auth/register/route.ts`, temporarily comment out the email verification:

\`\`\`typescript
// TEMPORARY: Comment out these lines until database schema is applied
/*
try {
  // Store verification token in database
  await sql`
    SELECT create_verification_token(${email}, ${verificationToken}, 'email_verification', 24)
  `

  // Send verification email
  const emailTemplate = createVerificationEmail(email, verificationToken, name)
  const emailResult = await sendEmail(emailTemplate)

  if (!emailResult.success) {
    console.error('❌ Failed to send verification email:', emailResult.error)
    // Note: We don't fail registration if email fails to send
  } else {
    console.log('✅ Verification email sent to:', email)
  }
} catch (emailError) {
  console.error('❌ Email verification setup failed:', emailError)
  // Continue with registration even if email fails
}
*/
\`\`\`

## Option 2: Set Email as Verified by Default (Quick Fix)

Change the user creation to set `email_verified: true`:

\`\`\`typescript
const newUsers = await sql`
  INSERT INTO users (
    email, 
    name, 
    password_hash,
    avatar_url,
    credits, 
    trust_score, 
    verification_tier,
    challenges_completed,
    false_claims,
    current_streak,
    longest_streak,
    premium_subscription,
    email_verified,  -- Change this to true
    created_at,
    updated_at
  ) VALUES (
    ${email},
    ${name},
    ${passwordHash},
    ${avatar || null},
    0.00,
    50,
    'manual',
    0,
    0,
    0,
    0,
    false,
    true,  -- SET TO TRUE temporarily
    NOW(),
    NOW()
  )
  RETURNING id, email, name, avatar_url, credits, trust_score, verification_tier, email_verified, created_at
`
\`\`\`

## ⚠️ IMPORTANT: 

**These are temporary fixes only!** You must apply the proper database schema (`PRODUCTION_FIX_EMAIL_SCHEMA.sql`) as soon as possible to enable proper email verification.

After applying the database fix:
1. Revert these temporary changes
2. Redeploy your application 
3. Email verification will work properly
