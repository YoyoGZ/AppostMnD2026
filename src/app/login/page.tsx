import React from "react";
import { LoginShield } from "@/components/auth/LoginShield";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-center relative">
      {/* Backdoor Return */}
      <Link 
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-white/50 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
      >
        <ChevronLeft className="w-4 h-4" /> Volver a Landing
      </Link>
      
      <div className="w-full max-w-md">
        <LoginShield />
      </div>
    </div>
  );
}
