"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase/client";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Lock, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push("/admin/events");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[grid-slate-100]">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
      
      <Card className="w-full max-w-md border-none shadow-premium relative z-10 overflow-hidden">
        <div className="h-2 w-full bg-indigo-600" />
        <CardHeader className="space-y-2 pt-8 text-center">
          <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Admin {isLogin ? "Login" : "Registration"}
          </CardTitle>
          <p className="text-slate-500 text-sm">
            {isLogin ? "Welcome back! Login to manage your events." : "Create an account to start hosting events."}
          </p>
        </CardHeader>
        
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Mail className="w-3 h-3" /> Email Address
              </label>
              <Input
                type="email"
                required
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Lock className="w-3 h-3" /> Password
              </label>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              className="w-full h-12 rounded-xl mt-4 font-bold tracking-tight shadow-indigo-100 shadow-lg"
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? "Login" : "Create Account"} <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 pb-8 border-t border-slate-50 pt-6">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
            
            <Link href="/" className="text-xs text-slate-400 hover:underline">
              ← Return to public site
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
