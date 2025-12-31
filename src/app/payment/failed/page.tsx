"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function FailedContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const eventId = searchParams.get("eventId");

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-none shadow-premium overflow-hidden">
        <div className="bg-rose-500 h-2 w-full" />
        <CardContent className="p-8 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-10 h-10 text-rose-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Payment Failed</h1>
            <p className="text-slate-500 font-medium">
              We couldn't process your payment. {error || "Please check your balance or try a different method."}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <p className="text-xs text-slate-500 italic">
              Don't worry, your ticket reservation is safe for 10 minutes. You can try again now.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button 
              onClick={() => window.history.back()}
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-indigo-100 shadow-lg gap-2"
            >
              <RefreshCcw className="w-5 h-5" />
              Try Again
            </Button>
            
            <Link href={eventId ? `/event/${eventId}` : "/"} className="block">
              <Button variant="ghost" className="w-full h-12 rounded-xl text-slate-500 gap-2">
                <Home className="w-4 h-4" />
                {eventId ? "Back to Event" : "Go to Homepage"}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FailedContent />
    </Suspense>
  );
}
