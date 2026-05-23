"use client";

import React, { useState, useEffect } from "react";
import { 
  Gift, 
  Plus, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Copy,
  Users,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { 
  getPromoAnalyticsAction, 
  generatePromoCodeAction 
} from "@/app/actions/promo";
import Image from "next/image";

interface ReferredUser {
  display_name: string;
  email: string;
}

interface PromoAnalytic {
  code: string;
  ownerName: string;
  createdAt: string;
  usesCount: number;
  users: ReferredUser[];
}

export function PromoControlModule() {
  const [analytics, setAnalytics] = useState<PromoAnalytic[]>([]);
  const [ownerNameInput, setOwnerNameInput] = useState("");
  
  // Estados de control
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Control de fila expandida para ver los detalles de los usuarios referidos
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const loadPromoAnalytics = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getPromoAnalyticsAction();
      if (res.success && res.analytics) {
        setAnalytics(res.analytics as PromoAnalytic[]);
      } else {
        setErrorMsg(res.error || "No se pudieron cargar las analíticas promocionales.");
      }
    } catch (err) {
      setErrorMsg("Error de conexión al cargar códigos promocionales.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadPromoAnalytics();
  }, []);

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerNameInput.trim()) return;
    
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const ownerName = ownerNameInput.trim();

    try {
      const res = await generatePromoCodeAction(ownerName);
      if (res.success && res.code) {
        setSuccessMsg(`¡Código '${res.code}' generado para '${res.ownerName}'!`);
        setOwnerNameInput("");
        await loadPromoAnalytics();
      } else {
        setErrorMsg(res.error || "Error al generar el código");
      }
    } catch (err) {
      setErrorMsg("Error inesperado al intentar guardar en la base de datos.");
    }
    setIsSubmitting(false);

    // Limpiar mensaje de éxito tras 4 segundos
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleExpandCode = (code: string) => {
    if (expandedCode === code) {
      setExpandedCode(null);
    } else {
      setExpandedCode(code);
    }
  };

  return (
    <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10" />
      
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/20 p-2.5 rounded-xl border border-primary/20">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-black uppercase tracking-wide">Fábrica de Promociones</h2>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Gestión de Afiliados y Auditoría de Referidos</p>
        </div>
      </div>

      <p className="text-white/40 text-xs mb-6 leading-relaxed">
        Generá códigos aleatorios únicos de 8 dígitos para asociar a tus amigos o compañeros. Vas a poder auditar de forma precisa quién usó qué código en el Paywall.
      </p>

      {/* Alertas */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl mb-4 text-xs text-red-400 flex items-start gap-2 animate-in fade-in duration-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/20 p-3.5 rounded-xl mb-4 text-xs text-green-400 flex items-start gap-2 animate-in fade-in duration-300">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Formulario de Generación */}
      <form onSubmit={handleGenerateCode} className="space-y-4 mb-8 bg-black/40 border border-white/5 p-4 rounded-2xl">
        <div>
          <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1.5 pl-1">Asignar a (Nombre del Amigo/Compañero)</label>
          <div className="relative">
            <input 
              type="text" 
              required
              placeholder="Ej: Carlos Tevez, Juan Perez"
              value={ownerNameInput}
              onChange={(e) => setOwnerNameInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-white/20 font-bold"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !ownerNameInput.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Generar y Guardar Código
        </button>
      </form>

      {/* Listado de Códigos y Analíticas */}
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 pl-1 flex items-center gap-1.5">
          Códigos Generados ({analytics.length})
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin opacity-55" />
          </div>
        ) : analytics.length === 0 ? (
          <div className="border border-dashed border-white/10 p-6 rounded-2xl text-center text-xs text-white/30">
            No se generaron códigos promocionales aún.
          </div>
        ) : (
          <div className="border border-white/5 rounded-2xl divide-y divide-white/5 overflow-hidden">
            {analytics.map((item) => (
              <div key={item.code} className="bg-white/[0.005] hover:bg-white/[0.015] transition-colors">
                <div className="flex items-center justify-between p-3.5 group">
                  <div className="min-w-0 pr-3">
                    <span className="text-xs font-bold text-white/90 block">{item.ownerName}</span>
                    <span className="text-[9px] text-white/30 font-medium block uppercase tracking-wider mt-0.5">
                      Creado el {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyCode(item.code)}
                      className={`text-[10px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded-md border flex items-center gap-1 transition-all ${
                        copiedCode === item.code 
                          ? "bg-green-500/10 text-green-500 border-green-500/30" 
                          : "bg-white/5 text-primary border-primary/20 hover:border-primary/50"
                      }`}
                      title="Copiar código al portapapeles"
                    >
                      {item.code}
                      <Copy className="w-2.5 h-2.5" />
                    </button>

                    {/* Contador de usos en Paywall */}
                    <button
                      onClick={() => toggleExpandCode(item.code)}
                      disabled={item.usesCount === 0}
                      className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border flex items-center gap-1 transition-all ${
                        item.usesCount > 0
                          ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer"
                          : "bg-white/5 text-white/20 border-white/5 cursor-not-allowed"
                      }`}
                      title={item.usesCount > 0 ? "Ver usuarios registrados" : "Nadie usó este código aún"}
                    >
                      <Users className="w-2.5 h-2.5" />
                      {item.usesCount} {item.usesCount === 1 ? 'uso' : 'usos'}
                      {item.usesCount > 0 && (
                        expandedCode === item.code ? <ChevronUp className="w-2.5 h-2.5 ml-0.5" /> : <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Subtabla / Inspector Desplegable con usuarios registrados */}
                {expandedCode === item.code && item.usesCount > 0 && (
                  <div className="bg-black/50 p-4 border-t border-white/5 animate-in slide-in-from-top-1 duration-200">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest block mb-2">Gladiadores Registrados con este Código:</span>
                    <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                      {item.users.map((user, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                          <span className="text-xs font-bold text-white/95">{user.display_name}</span>
                          <span className="text-[10px] text-white/40 font-mono">{user.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
