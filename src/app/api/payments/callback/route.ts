import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trx_ref = searchParams.get("trx_ref");
  const status = searchParams.get("status");

  console.log(`[Chapa Callback GET] Ref: ${trx_ref}, Status: ${status}`);

  return new NextResponse("OK", { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log(`[Chapa Callback POST Webhook] Body:`, JSON.stringify(body, null, 2));
  } catch (e) {
    console.log(`[Chapa Callback POST] Received non-JSON body`);
  }

  return new NextResponse("OK", { status: 200 });
}
