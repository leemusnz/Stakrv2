import { NextRequest, NextResponse } from "next/server";
import { createDbConnection } from "@/lib/db";
import { processCheckoutCompleted } from "@/lib/payments-service";

// Stripe webhook handler. Signature verification is mandatory — unsigned or
// unverifiable requests are rejected outright, and event payloads are never
// trusted for identities or amounts (processCheckoutCompleted reconciles
// against the pending transaction row recorded at checkout-creation time).
export async function POST(request: NextRequest) {
  if (process.env.ENABLE_CASH_PAYMENTS !== "true")
    return NextResponse.json(
      { error: "Cash payments are disabled" },
      { status: 503 },
    );
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret || !endpointSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 503 },
    );
  }

  let event: any;
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }
    const stripeMod: any = await import("stripe");
    const Stripe = stripeMod.default || stripeMod;
    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });
    event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  if (!event?.id) {
    return NextResponse.json({ error: "Missing event id" }, { status: 400 });
  }

  try {
    const sql = createDbConnection();
    const result = await processCheckoutCompleted(sql, event);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Stripe webhook processing failed:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
