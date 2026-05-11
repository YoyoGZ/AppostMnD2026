"use client";

import React, { useState } from "react";
import { X, Shield, ChevronRight } from "lucide-react";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegistrationModal({ isOpen, onClose }: RegistrationModalProps) {
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
            <h3 className="text-white font-bold text-base mb-2">Protocolo de Admisión</h3>
            <p>
              En el boton de abajo te conectamos a Whatsapp, nos envias tu Nombre completo y DNI y tu solicitud de Acceso ( Quiero usar la App !!)
            </p>
            <p>
              Transferis el monto de $50.000 al alias "MONDIAL-APP-OK" , nos mandas el comprobante de la transferencia por Whatsapp y una vez recibida, te pasamos el Token de Acceso.
            </p>
            <p>
              Con tu Token de Acceso, ya podes entrar a la App !!. Vas al login y te registras (Guarda con la clave !!) Y pasas directo a la App.
            </p>
            <p>
              El Token de Acceso que recibís es unico e intransferible (es imposible usarlo dos veces).
            </p>
            <p>
              La empresa no se responsabiliza por la obtencion de un nuevo Token de Acceso.
            </p>
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl my-6">
              <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1">Nota del Oráculo</p>
              <p className="text-white/60 text-xs">
                El destino de tu Liga depende de la integridad de tu Token. El Oráculo advierte: un registro fallido es una oportunidad perdida en el tablero del Mundial. Asegura tu lugar antes del pitazo inicial.
              </p>
            </div>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex flex-col sm:flex-row gap-3">
          <button className="flex-1 px-6 py-4 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(251,191,36,0.2)]">
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
