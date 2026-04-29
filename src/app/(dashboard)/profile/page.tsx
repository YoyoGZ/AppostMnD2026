"use client";

import React from "react";
import { User, Shield, Trophy, Calendar } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";

export default function ProfilePage() {
  const [alias, setAlias] = useState<string>("Cargando...");
  const [email, setEmail] = useState<string>("");
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAlias(user.user_metadata?.display_name || user.email?.split("@")[0] || "Gladiador");
        setEmail(user.email || "");
      }
    };
    fetchUser();
  }, [supabase]);

  return (
    <div className="relative pb-12">
      <header className="mb-8 pt-4 md:pt-0 relative z-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(251,191,36,0.15)]">
          <User className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-black tracking-tight mb-1 text-white">
          {alias}
        </h2>
        <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">
          Gladiador Registrado
        </p>
      </header>

      <section className="max-w-md mx-auto space-y-4">
        {/* Info Cards */}
        <div className="bento-card flex items-center gap-4">
          <Shield className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Identidad</p>
            <p className="text-sm text-white font-bold">{email || "Anónimo"}</p>
          </div>
        </div>

        <div className="bento-card flex items-center gap-4 opacity-50">
          <Trophy className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Ligas Activas</p>
            <p className="text-sm text-white/70 italic">Próximamente</p>
          </div>
        </div>

        <div className="bento-card flex items-center gap-4 opacity-50">
          <Calendar className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Historial de Pronósticos</p>
            <p className="text-sm text-white/70 italic">Próximamente</p>
          </div>
        </div>
      </section>
    </div>
  );
}
