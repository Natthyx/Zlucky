"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Home, Loader2, XCircle, Download, Smartphone, User, Hash, Calendar, Ticket } from "lucide-react";
import Link from "next/link";
import { toPng } from "html-to-image";
import download from "downloadjs";
import { formatCurrency } from "@/lib/utils";

function SuccessContent() {
  const searchParams = useSearchParams();
  const tx_ref = searchParams.get("tx_ref") || searchParams.get("trx_ref");
  const eventId = searchParams.get("eventId");
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptDetails, setReceiptDetails] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

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
        if (!result.success && result.status !== "success") {
          setError(result.error || "Failed to verify payment. Please contact support.");
        } else {
          setReceiptDetails(result.receiptDetails);
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

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(receiptRef.current, {
        cacheBust: true,
        backgroundColor: "#f8fafc",
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      download(dataUrl, `Zlucky_Receipt_${tx_ref}.png`);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to generate receipt image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-none shadow-premium p-12 text-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 uppercase italic tracking-tighter">Finalizing your ticket...</h2>
          <p className="text-slate-500 font-medium tracking-tight">Please wait while we confirm your payment.</p>
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Success Alert */}
        <div className="text-center space-y-2 mb-4">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">Success!</h1>
          <p className="text-slate-500 font-medium">Your ticket is confirmed. Download your receipt below.</p>
        </div>

        {/* Receipt Component */}
        <div ref={receiptRef} className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 p-8 relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-50 rounded-full -ml-12 -mb-12" />
          
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-900 px-2 py-1 rounded text-[10px] font-black text-white italic tracking-tighter">ZLUCKY</div>
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none pt-2">
                  {receiptDetails?.eventName || "Event Receipt"}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                <div className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-full uppercase">PAID</div>
              </div>
            </div>

            {/* Ticket Number Highlight */}
            <div className="bg-indigo-600 rounded-2xl p-6 text-white text-center shadow-lg shadow-indigo-100 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl" />
               <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-1">Your Ticket Number</p>
               <h3 className="text-5xl font-black italic tracking-tighter">#{receiptDetails?.ticketNumber}</h3>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <User className="w-3 h-3" /> Buyer
                </p>
                <p className="font-bold text-slate-900 truncate">{receiptDetails?.buyerName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> Phone
                </p>
                <p className="font-bold text-slate-900">{receiptDetails?.buyerPhone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Ref
                </p>
                <p className="font-mono text-[11px] font-bold text-slate-500 truncate">{tx_ref}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Date
                </p>
                <p className="font-bold text-slate-900">
                  {receiptDetails?.date ? new Date(receiptDetails.date).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>

            {/* Footer / Amount */}
            <div className="pt-6 border-t-2 border-dashed border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</p>
                <p className="text-2xl font-black text-slate-900 italic">
                  {receiptDetails?.amount ? formatCurrency(receiptDetails.amount) : "N/A"}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                  <Ticket className="w-3 h-3" /> Valid Ticket
                </div>
                <p className="text-[8px] text-slate-300 mt-1 uppercase font-bold">System Generated Receipt</p>
              </div>
            </div>
          </div>

          {/* Side Punches (for that "ticket" look) */}
          <div className="absolute top-1/2 -left-3 w-6 h-6 bg-slate-50 rounded-full shadow-inner transform -translate-y-1/2" />
          <div className="absolute top-1/2 -right-3 w-6 h-6 bg-slate-50 rounded-full shadow-inner transform -translate-y-1/2" />
        </div>

        {/* Actions */}
        <div className="space-y-4 pt-4">
          <Button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full h-16 rounded-2xl gap-3 font-black italic uppercase tracking-tight shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95"
          >
            {isDownloading ? (
               <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
               <Download className="w-6 h-6" />
            )}
            {isDownloading ? "Generating..." : "Download Official Receipt"}
          </Button>
          
          <Link href={eventId ? `/event/${eventId}` : "/events"} className="block">
            <Button variant="ghost" className="w-full h-14 rounded-2xl gap-2 font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100">
              <Home className="w-5 h-5" />
              {eventId ? "Back to Event" : "Return to Events"}
            </Button>
          </Link>
        </div>
      </div>
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
