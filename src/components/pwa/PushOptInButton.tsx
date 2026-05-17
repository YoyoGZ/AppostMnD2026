"use client";

import React, { useEffect, useState } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushOptInButton() {
  const { isSupported, permission, subscription, isSubscribing, subscribeToPush } = usePushNotifications();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isSupported) return null;

  if (subscription || permission === 'granted') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-[9px] font-bold uppercase tracking-widest cursor-default mt-1">
        <BellRing className="w-3 h-3" />
        Alertas ON
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex flex-col items-end gap-1 mt-1">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-[9px] font-bold uppercase tracking-widest cursor-default">
          <Bell className="w-3 h-3" />
          Bloqueadas por Chrome
        </div>
        <span className="text-[8px] text-white/40 uppercase tracking-widest text-right">
          Desbloquéalas en el candado de la URL
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1 origin-right animate-in fade-in slide-in-from-right-4 duration-500">
      <button
        onClick={subscribeToPush}
        disabled={isSubscribing}
        className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-primary text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(251,191,36,0.15)] active:scale-95 disabled:opacity-50"
      >
        {isSubscribing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Bell className="w-4 h-4 animate-bounce" />
        )}
        Activar Alertas
      </button>
      <span className="text-[8px] text-white/40 uppercase tracking-widest font-medium text-right max-w-[150px]">
        Te avisaremos si hay goles en tus pronósticos
      </span>
    </div>
  );
}
