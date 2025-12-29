import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, ticketNumber, buyerName, buyerPhone, amount } = body;
    const buyerEmail = body.buyerEmail || "guest@zlucky.com";

    if (!eventId || !ticketNumber || !buyerName || !buyerPhone || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Generate UNIQUE tx_ref
    const tx_ref = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 2. Store payment document in Firestore as "pending"
    const paymentRef = adminDb.collection("payments").doc(tx_ref);
    await paymentRef.set({
      tx_ref,
      eventId,
      ticketNumber: Number(ticketNumber),
      amount: Number(amount),
      buyerName,
      buyerPhone,
      buyerEmail,
      status: "pending",
      createdAt: Timestamp.now(),
    });

    // 3. Call Chapa initialize endpoint
    const response = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency: "ETB",
        email: buyerEmail,
        first_name: buyerName,
        phone_number: buyerPhone,
        tx_ref,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/callback`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?tx_ref=${tx_ref}`,
        customization: {
          title: "Ticket Purchase",
          description: `Ticket ${ticketNumber}`,
        },
      }),
    });

    const chapaData = await response.json();

    if (chapaData.status !== "success") {
      console.error("Chapa init failed:", chapaData);
      return NextResponse.json(
        { error: chapaData.message || "Failed to initialize payment" },
        { status: 400 }
      );
    }

    // 4. Return checkout_url to client
    return NextResponse.json({
      success: true,
      checkout_url: chapaData.data.checkout_url,
      tx_ref,
    });
  } catch (error: any) {
    console.error("Payment Initialize Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
