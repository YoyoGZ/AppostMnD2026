"use client";

import React from "react";
import { Settings, Bell, Palette, Globe } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="relative pb-12">
      <header className="mb-8 pt-4 md:pt-0">
        <h2 className="text-3xl font-black tracking-tight mb-2 text-title drop-shadow-[0_2px_10px_rgba(0,212,255,0.3)]">
          Configuración
        </h2>
        <p className="text-white/60 text-sm font-medium">
          Personaliza tu experiencia
        </p>
      </header>

      <section className="max-w-md space-y-4">
        <div className="bento-card flex items-center gap-4 opacity-50 cursor-not-allowed">
          <Bell className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-white font-bold">Notificaciones</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Próximamente</p>
          </div>
        </div>

        <div className="bento-card flex items-center gap-4 opacity-50 cursor-not-allowed">
          <Palette className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-white font-bold">Tema Visual</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Próximamente</p>
          </div>
        </div>

        <div className="bento-card flex items-center gap-4 opacity-50 cursor-not-allowed">
          <Globe className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-white font-bold">Zona Horaria</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Próximamente</p>
          </div>
        </div>
      </section>
    </div>
  );
}
