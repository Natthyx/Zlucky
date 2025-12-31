"use client";

import { useState, useRef } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, CheckCircle2, Download, Ticket, User, Hash, AlertCircle, Smartphone, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toPng } from "html-to-image";
import download from "downloadjs";

export function TicketVerificationDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [txRef, setTxRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const [error, setError] = useState("");
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txRef.trim()) return;

    setLoading(true);
    setError("");
    setTicketData(null);

    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx_ref: txRef.trim() }),
      });

      const data = await res.json();

      if (data.success || data.status === "success") {
        setTicketData(data.receiptDetails || data.chapaDetails); // Fallback if structure varies
      } else {
        setError(data.error || "Invalid or Unpaid Transaction Reference.");
      }
    } catch (err) {
      setError("Failed to verify. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(receiptRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        style: { transform: 'scale(1)' }
      });
      download(dataUrl, `Ticket_Receipt_${txRef}.png`);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReset = () => {
    setTicketData(null);
    setError("");
    setTxRef("");
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" className="text-white hover:text-white/80 hover:bg-white/10">
          Verify Ticket
        </Button>
      </DrawerTrigger>
      
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-sm flex flex-col max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="text-center text-xl font-bold uppercase tracking-tight">
              {ticketData ? "Ticket Verified" : "Verify Ticket Status"}
            </DrawerTitle>
          </DrawerHeader>

          <div className="p-4 pb-0 overflow-y-auto flex-1">
            {!ticketData ? (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500">Transaction Reference</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="tx-123456..." 
                      className="pl-9 h-12 text-lg font-mono"
                      value={txRef}
                      onChange={(e) => setTxRef(e.target.value)} 
                    />
                  </div>
                  <p className="text-xs text-slate-400">Enter the reference code sent to your phone via SMS.</p>
                </div>

                {error && (
                  <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Check Status"}
                </Button>
              </form>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                 {/* Receipt Card */}
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
                            {ticketData.eventName || "Event Receipt"}
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
                         <h3 className="text-5xl font-black italic tracking-tighter">#{ticketData.ticketNumber}</h3>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <User className="w-3 h-3" /> Buyer
                          </p>
                          <p className="font-bold text-slate-900 truncate">{ticketData.buyerName}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Smartphone className="w-3 h-3" /> Phone
                          </p>
                          <p className="font-bold text-slate-900">{ticketData.buyerPhone}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Hash className="w-3 h-3" /> Ref
                          </p>
                          <p className="font-mono text-[11px] font-bold text-slate-500 truncate">{txRef}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Date
                          </p>
                          <p className="font-bold text-slate-900">
                            {ticketData.date ? new Date(ticketData.date).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* Footer / Amount */}
                      <div className="pt-6 border-t-2 border-dashed border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</p>
                          <p className="text-2xl font-black text-slate-900 italic">
                            {ticketData.amount ? formatCurrency(ticketData.amount) : "N/A"}
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

                    {/* Side Punches */}
                    <div className="absolute top-1/2 -left-3 w-6 h-6 bg-slate-50 rounded-full shadow-inner transform -translate-y-1/2" />
                    <div className="absolute top-1/2 -right-3 w-6 h-6 bg-slate-50 rounded-full shadow-inner transform -translate-y-1/2" />
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleDownload} 
                    disabled={isDownloading} 
                    className="w-full h-12 font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100"
                  >
                    {isDownloading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />}
                    Download Receipt
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="w-full">
                    Check Another
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DrawerFooter className="mb-4">
            <DrawerClose asChild>
              <Button variant="ghost">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
