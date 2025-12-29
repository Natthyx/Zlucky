"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy, Sparkles, UserCheck } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Winner } from "@/lib/types";

interface WinnerGeneratorProps {
  eventId: string;
  isGenerated: boolean;
  onSuccess: (winners: Winner[]) => void;
  soldCount: number;
}

export function WinnerGenerator({ eventId, isGenerated, onSuccess, soldCount }: WinnerGeneratorProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [winnerCount, setWinnerCount] = useState(1);

  const generateWinners = async () => {
    if (!user) return;
    if (winnerCount > soldCount) {
      alert("Cannot generate more winners than tickets sold.");
      return;
    }

    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/admin/events/${eventId}/winners`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ numberOfWinners: winnerCount }),
      });

      const result = await response.json();
      if (result.success) {
        onSuccess(result.data);
        setWinners(result.data);
      } else {
        alert(result.error || "Failed to generate winners");
      }
    } catch (error) {
      console.error("Winner generation error:", error);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (isGenerated) {
    return (
      <div className="space-y-4">
        <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <Sparkles className="absolute top-4 right-4 text-white/20 w-12 h-12" />
          <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3">
             Winners Picked
          </h3>
          
          <div className="space-y-3 relative z-10">
            {winners.length > 0 ? winners.map((winner) => (
              <div key={winner.id} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black">
                    #{winner.position}
                   </div>
                   <div>
                     <p className="font-bold text-sm uppercase">{winner.buyerName}</p>
                     <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest leading-none">Ticket #{winner.ticketNumber}</p>
                   </div>
                </div>
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
            )) : (
              <p className="text-sm font-medium opacity-80 italic">Winners have been successfully generated for this event.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-none shadow-premium bg-white overflow-hidden">
      <CardHeader className="text-center pt-8">
        <div className="mx-auto w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
          <Trophy className="w-8 h-8 text-indigo-600" />
        </div>
        <CardTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
          Pick Winners
        </CardTitle>
        <p className="text-slate-500 text-sm font-medium">Random selection from {soldCount} sold tickets.</p>
      </CardHeader>
      
      <CardContent className="p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Number of Winners</label>
          <div className="flex gap-4">
            <input
              type="number"
              min="1"
              max={soldCount}
              value={winnerCount}
              onChange={(e) => setWinnerCount(Number(e.target.value))}
              className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex-1 font-bold text-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button 
              className="h-14 px-8 rounded-2xl font-black italic uppercase tracking-tight shadow-indigo-100 shadow-xl"
              onClick={generateWinners}
              disabled={loading || soldCount === 0}
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Roll It!"}
            </Button>
          </div>
        </div>

        {soldCount === 0 && (
          <p className="text-[10px] text-rose-500 font-bold uppercase text-center italic">
            Waiting for first ticket sales...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
