"use client";

import { useState } from "react";
import { Ticket } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReservationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  onSubmit: (data: { buyerName: string; buyerPhone: string; buyerEmail?: string }) => Promise<void>;
}

export function ReservationDrawer({ isOpen, onClose, ticket, onSubmit }: ReservationDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    buyerName: "",
    buyerPhone: "",
    buyerEmail: "",
  });

  if (!ticket && !isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Reservation submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-[2.5rem] shadow-2xl transition-transform duration-300 transform p-8 pb-10",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="max-w-md mx-auto relative cursor-default">
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Reserve Ticket #{ticket?.ticketNumber}
            </h2>
            <p className="text-slate-500 font-medium">
              Enter your details to proceed to secure payment via Chapa.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <Input
                required
                placeholder="Abebe Bikila"
                value={formData.buyerName}
                onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="flex gap-2">
                <div className="flex items-center justify-center px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-bold">
                  +251
                </div>
                <Input
                  required
                  type="tel"
                  placeholder="911223344"
                  className="flex-1"
                  value={formData.buyerPhone}
                  onChange={(e) => setFormData({ ...formData, buyerPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address (Optional)</label>
              <Input
                type="email"
                placeholder="abebe@example.com"
                value={formData.buyerEmail}
                onChange={(e) => setFormData({ ...formData, buyerEmail: e.target.value })}
              />
            </div>

            <Button
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-indigo-200 shadow-lg mt-4"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                "Continue to Pay"
              )}
            </Button>
            
            <p className="text-[10px] text-center text-slate-400 mt-4 px-6 uppercase tracking-widest font-bold">
              Secure payment powered by Chapa
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
