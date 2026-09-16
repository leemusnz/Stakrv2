import { NextResponse } from "next/server";
import { ChallengeError } from "@/lib/challenge-engine";
import { ZodError } from "zod";

export function challengeErrorResponse(error: unknown) {
  if (error instanceof ChallengeError)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status },
    );
  if (error instanceof ZodError || error instanceof SyntaxError)
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request",
        details: error instanceof ZodError ? error.issues : undefined,
      },
      { status: 400 },
    );
  const code = (error as { code?: string })?.code;
  if (code === "22P02")
    return NextResponse.json(
      { success: false, error: "Invalid identifier or amount" },
      { status: 400 },
    );
  if (code === "23505")
    return NextResponse.json(
      {
        success: false,
        error:
          "This request conflicts with an existing record. Refresh and retry.",
      },
      { status: 409 },
    );
  if (["55P03", "57014", "40001", "40P01"].includes(code ?? ""))
    return NextResponse.json(
      { success: false, error: "This challenge is busy. Please retry." },
      { status: 503, headers: { "Retry-After": "2" } },
    );
  console.error("Challenge operation failed", { code: code ?? "unknown" });
  return NextResponse.json(
    {
      success: false,
      error: "Unable to complete this operation. Please retry.",
    },
    { status: 500 },
  );
}
