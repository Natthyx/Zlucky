type SendTicketSMSParams = {
  buyerPhone: string;      // +2519XXXXXXXX
  buyerName: string;
  eventName: string;
  ticketNumber: string | number;
  tx_ref: string;
  receiptUrl: string;
};

export async function sendTicketSMS({
  buyerPhone,
  buyerName,
  eventName,
  ticketNumber,
  tx_ref,
  receiptUrl,
}: SendTicketSMSParams) {
  try {
    const apiKey = process.env.AFROMESSAGE_API_KEY;
    const senderId = process.env.AFROMESSAGE_SENDER_ID;
    const endpoint =
      process.env.AFROMESSAGE_ENDPOINT ||
      "https://api.afromessage.com/api/send";

    if (!apiKey || !senderId) {
      console.warn("[AfroMessage] Missing API key or Sender ID");
      return;
    }

    // Ensure international format
    if (!buyerPhone.startsWith("+251")) {
      console.warn("[AfroMessage] Invalid phone format:", buyerPhone);
      return;
    }

    // Keep SMS concise and single-line to avoid carrier filtering
    // Note: If you see "***" redaction, you MUST register this template in AfroMessage dashboard.
    const message = `Ticket Confirmed. ${eventName}. Ticket #${ticketNumber}. Ref: ${tx_ref}.`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: senderId,   // ✅ IDENTIFIER ID
        to: buyerPhone,   // ✅ +2519XXXXXXXX
        message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AfroMessage] SMS failed:", errorText);
      return;
    }

    const result = await response.json();
    console.log("[AfroMessage] SMS sent successfully:");
  } catch (error) {
    console.error("[AfroMessage] Unexpected error:", error);
  }
}
