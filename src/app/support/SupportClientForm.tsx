"use client";

import React, { useState } from "react";
import { createSupportTicketAction } from "@/app/actions/support";
import { Mail, User, MessageSquare, Send, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface SupportClientFormProps {
  defaultEmail: string;
  defaultAlias: string;
}

export function SupportClientForm({ defaultEmail, defaultAlias }: SupportClientFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [alias, setAlias] = useState(defaultAlias);
  const [message, setMessage] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await createSupportTicketAction(email, alias, message);

    setLoading(false);
    if (res.success) {
      setSuccess(true);
      setMessage("");
    } else {
      setError(res.error || "Ocurrió un error inesperado al enviar la consulta.");
    }
  };

  if (success) {
    return (
      <div className="bg-black/40 backdrop-blur-xl border border-emerald-500/20 p-8 rounded-2xl text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500/50 via-emerald-500 to-emerald-500/50" />
        
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 drop-shadow-md" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-3">
          ¡Consulta Recibida!
        </h2>

        <p className="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed font-semibold">
          Tu mensaje fue registrado con éxito en nuestro sistema de asistencia de MundiApp26.
        </p>

        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 mb-6 text-left">
          <p className="text-white/60 text-[11px] leading-relaxed font-medium">
            💡 <span className="text-white font-bold">¿Cómo sigue esto?</span> Un administrador del HQ revisará tu caso y te responderá directamente al email <strong className="text-emerald-400 font-bold">"{email}"</strong> a la brevedad.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs sm:text-sm uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Volver al Inicio
          </Link>
          
          <button
            onClick={() => setSuccess(false)}
            className="text-white/40 hover:text-white/60 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors py-2"
          >
            Enviar otra Consulta
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-black/40 backdrop-blur-xl border border-white/5 p-6 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      {/* Línea de brillo superior en color primary */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-xs sm:text-sm font-semibold animate-in fade-in duration-300">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="leading-snug">{error}</p>
        </div>
      )}

      {/* Input de Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[10px] font-black uppercase tracking-wider text-white/50">
          Correo Electrónico
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
            <Mail className="w-4 h-4" />
          </span>
          <input
            id="email"
            type="email"
            required
            disabled={loading || !!defaultEmail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@correo.com"
            className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all disabled:opacity-50"
          />
        </div>
      </div>

      {/* Input de Alias/Nombre */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="alias" className="text-[10px] font-black uppercase tracking-wider text-white/50">
          Nombre o Apodo
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
            <User className="w-4 h-4" />
          </span>
          <input
            id="alias"
            type="text"
            required
            disabled={loading || !!defaultAlias}
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="Ej: JuanGol"
            className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all disabled:opacity-50"
          />
        </div>
      </div>

      {/* Textarea de la Consulta */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-[10px] font-black uppercase tracking-wider text-white/50">
          Tu Consulta
        </label>
        <div className="relative">
          <span className="absolute left-4 top-4 text-white/30">
            <MessageSquare className="w-4 h-4" />
          </span>
          <textarea
            id="message"
            required
            disabled={loading}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ej: Necesito recuperar mi clave"
            className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all resize-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Botón de Enviar */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs sm:text-sm uppercase tracking-widest py-4 rounded-xl shadow-[0_4px_25px_rgba(251,191,36,0.15)] hover:shadow-[0_4px_30px_rgba(251,191,36,0.25)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            Enviar Consulta <Send className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="flex justify-center items-center gap-1.5 mt-2 border-t border-white/5 pt-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-white/30 hover:text-white/50 text-[10px] font-bold uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al Inicio
        </Link>
      </div>
    </form>
  );
}
