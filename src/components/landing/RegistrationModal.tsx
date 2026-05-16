"use client";

import React from "react";
import { X, Shield, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegistrationModal({ isOpen, onClose }: RegistrationModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-card-body/90 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-white leading-none">
                Acceso a la App
              </h2>
              <p className="text-[10px] uppercase font-bold tracking-widest text-primary mt-1">
                Registro de Fundadores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-4 text-white/70 text-sm leading-relaxed font-medium">
            <h3 className="text-white font-bold text-base mb-2">Protocolo de Admisión a la Arena</h3>
            
            <div className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold mt-0.5">1</span>
              <p>
                <strong className="text-white block mb-1">Registro de Identidad</strong>
                Primero vas a tener que validar tu identidad creando tu cuenta segura en la Plataforma.
              </p>
            </div>
            
            <div className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mt-0.5">2</span>
              <p>
                <strong className="text-white block mb-1">Adquisición del Founder Pass</strong>
                Una vez registrado, vas a acceder a la pasarela de pagos segura para activar tu membresía.
              </p>
            </div>

            <div className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold mt-0.5">3</span>
              <p>
                <strong className="text-white block mb-1">Dominio Total</strong>
                Con tu pase activo, vas a recibir el rango oficial de <strong className="text-primary">Capitán (Founder)</strong>. Vas a poder armar tu propia Liga, invitar hasta 9 amigos (que entran gratis) y administrar la competencia.
              </p>
            </div>

            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl my-6">
              <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1">Nota del Oráculo</p>
              <p className="text-white/60 text-xs">
                La gloria es para los pioneros. Solo los Fundadores van a tener acceso al panel de gestión y Creacion de Duelos. Asegurá el liderazgo del grupo antes del incio ofical !!
              </p>
            </div>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => {
              onClose();
              router.push('/login');
            }}
            className="flex-1 px-6 py-4 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(251,191,36,0.2)]"
          >
            Aceptar y Continuar
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="px-6 py-4 bg-white/5 text-white font-bold uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
