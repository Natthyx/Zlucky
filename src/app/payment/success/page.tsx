"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Home, Loader2, XCircle, Download } from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const tx_ref = searchParams.get("tx_ref") || searchParams.get("trx_ref");
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chapaData, setChapaData] = useState<any>(null);

  useEffect(() => {
    async function verifyPayment() {
      if (!tx_ref) {
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tx_ref }),
        });

        const result = await response.json();
        if (!result.success) {
          setError(result.error || "Failed to verify payment. Please contact support.");
        } else {
          setChapaData(result.chapaDetails);
        }
      } catch (err) {
        console.error("Verification error:", err);
        setError("An unexpected error occurred during verification.");
      } finally {
        setVerifying(false);
      }
    }

    verifyPayment();
  }, [tx_ref]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-none shadow-premium p-12 text-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 uppercase italic tracking-tighter">Finalizing your ticket...</h2>
          <p className="text-slate-500 font-medium tracking-tight">Please wait while we confirm your payment with Chapa.</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-none shadow-premium overflow-hidden">
          <div className="bg-rose-500 h-2 w-full" />
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-10 h-10 text-rose-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Verification Failed</h1>
              <p className="text-rose-500 font-medium tracking-tight leading-relaxed">{error}</p>
            </div>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full h-12 rounded-xl font-bold">Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-none shadow-premium overflow-hidden">
        <div className="bg-emerald-500 h-2 w-full" />
        <CardContent className="p-8 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">Payment Successful!</h1>
            <p className="text-slate-500 font-medium tracking-tight">Your ticket has been confirmed and is now yours.</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transaction Ref</p>
              <p className="text-sm font-mono font-bold text-indigo-600 truncate">{tx_ref}</p>
            </div>
            {chapaData?.reference && chapaData.reference !== tx_ref && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Chapa Reference</p>
                <p className="text-sm font-mono font-bold text-slate-600 truncate">{chapaData.reference}</p>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-2">
            {(() => {
              const receiptUrl = chapaData?.receipt_url || (chapaData?.reference ? `https://checkout.chapa.co/checkout/test-payment-receipt/${chapaData.reference}` : null);
              
              if (!receiptUrl) return null;

              return (
                <a 
                  href={receiptUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  download={`Receipt_${tx_ref}.html`}
                  className="block"
                >
                  <Button variant="outline" className="w-full h-14 rounded-2xl gap-2 font-black italic uppercase tracking-tight border-indigo-100 hover:bg-indigo-50 text-indigo-600">
                    <Download className="w-5 h-5" />
                    Download Receipt
                  </Button>
                </a>
              );
            })()}
            
            <Link href="/" className="block">
              <Button className="w-full h-14 rounded-2xl gap-2 font-black italic uppercase tracking-tight shadow-indigo-100 shadow-xl bg-indigo-600">
                <Home className="w-5 h-5" />
                Return to Events
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-400 font-bold uppercase tracking-widest">
        Loading...
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
