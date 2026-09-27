import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createDbConnection } from "@/lib/db";
import { challengeJoinSchema } from "@/lib/validation";
import { joinChallenge, JoinError } from "@/lib/challenge-join";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    const { id: challengeId } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const validation = challengeJoinSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 },
      );
    }
    const result = await joinChallenge(
      challengeId,
      session.user.id,
      validation.data,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Successfully joined challenge!",
        ...result,
        financial_breakdown: {
          ...result.financial_breakdown,
          potential_reward: null,
        },
        next_steps: [
          "Review daily requirements and proof instructions",
          "Start completing daily tasks when challenge begins",
          "Submit proof of completion each day",
          "Earn rewards upon successful completion",
        ],
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof JoinError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    const code = (error as { code?: string })?.code;
    if (code === "23505")
      return NextResponse.json(
        { error: "You have already joined this challenge" },
        { status: 409 },
      );
    if (["55P03", "57014", "40001", "40P01"].includes(code ?? "")) {
      return NextResponse.json(
        { error: "Challenge entry is busy. Please retry." },
        { status: 503, headers: { "Retry-After": "2" } },
      );
    }
    // Avoid logging query parameters or financial/PII payloads.
    console.error("Challenge join failed", { code: code ?? "unknown" });
    return NextResponse.json(
      { error: "Failed to join challenge" },
      { status: 500 },
    );
  }
}

// GET challenge participation status
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { id: challengeId } = await params;

    // Real user handling
    const sql = createDbConnection();

    // Try querying with all features, fallback to basic query if tables don't exist
    try {
      const participation = await sql`
        SELECT 
          cp.*,
          0 as days_completed,
          NULL as last_completion_date
        FROM challenge_participants cp
        WHERE cp.challenge_id = ${challengeId} AND cp.user_id = ${session.user.id}
      `;

      if (participation.length === 0) {
        return NextResponse.json({
          success: true,
          participation: null,
          isParticipant: false,
        });
      }

      const participationData = participation[0];

      return NextResponse.json({
        success: true,
        participation: {
          ...participationData,
          team: null, // No team data for now
        },
        isParticipant: true,
      });
    } catch (dbError) {
      console.error("Participation query failed:", dbError);
      return NextResponse.json(
        { error: "Failed to get participation status" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Get participation error:", error);
    return NextResponse.json(
      {
        error: "Failed to get participation status",
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
