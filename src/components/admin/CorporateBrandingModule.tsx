"use client";
import React, { useState, useEffect } from "react";
import { 
  Building, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Mail,
  HelpCircle
} from "lucide-react";
import { 
  getCorporateRelationsAction, 
  addCorporateRelationAction, 
  deleteCorporateRelationAction 
} from "@/app/actions/admin";

interface Relation {
  email: string;
  brand_id: string;
  created_at: string;
}

export function CorporateBrandingModule() {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [brandInput, setBrandInput] = useState("globant");
  
  // Estados de control
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selector de marcas disponibles
    // Selector de marcas disponibles
  const availableBrands = [
    { id: "globant", label: "Globant 🟢", color: "text-[#8feb16]" },
    { id: "accenture", label: "Accenture 🟣", color: "text-[#a100ff]" },
    { id: "honesty", label: "Honesty Brokers 🔵", color: "text-[#3A80F5]" } // <-- Añade esta línea
  ];

  const loadRelations = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getCorporateRelationsAction();
      if (res.success && res.relations) {
        setRelations(res.relations as Relation[]);
      } else {
        setErrorMsg(res.error || "No se pudieron cargar las relaciones corporativas");
      }
    } catch (err) {
      setErrorMsg("Error de conexión al cargar relaciones corporativas.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadRelations();
  }, []);

  const handleAddRelation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const email = emailInput.trim().toLowerCase();

    try {
      const res = await addCorporateRelationAction(email, brandInput);
      if (res.success) {
        setSuccessMsg(`¡Correo '${email}' asociado exitosamente a '${brandInput}'!`);
        setEmailInput("");
        await loadRelations();
      } else {
        setErrorMsg(res.error || "Error al asociar el correo");
      }
    } catch (err) {
      setErrorMsg("Error inesperado al intentar guardar en la base de datos.");
    }
    setIsSubmitting(false);

    // Limpiar mensaje de éxito tras 4 segundos
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleDeleteRelation = async (email: string) => {
    if (!confirm(`¿Estás seguro de desvincular el correo '${email}'? Perderá el bypass de pago de inmediato.`)) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await deleteCorporateRelationAction(email);
      if (res.success) {
        setSuccessMsg("Relación corporativa eliminada.");
        await loadRelations();
      } else {
        setErrorMsg(res.error || "Error al eliminar");
      }
    } catch (err) {
      setErrorMsg("Error al conectar con el servidor.");
    }

    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10" />
      
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/20 p-2.5 rounded-xl border border-primary/20">
          <Building className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-black uppercase tracking-wide">Co-Branding Manager</h2>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Gestión de Marca Blanca & Bypass de Paywall</p>
        </div>
      </div>

      <p className="text-white/40 text-xs mb-6 leading-relaxed">
        Pre-registrá correos corporativos (Founders o empleados especiales) para permitirles fundar su Arena de forma **100% gratuita** y teñir dinámicamente su UI.
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

      {/* Formulario de Alta */}
      <form onSubmit={handleAddRelation} className="space-y-4 mb-8 bg-black/40 border border-white/5 p-4 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1.5 pl-1">Email del Founder</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input 
                type="email" 
                required
                placeholder="ej: nombre@empresa.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-white/20"
              />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1.5 pl-1">Marca Patrocinadora</label>
            <select
              value={brandInput}
              onChange={(e) => setBrandInput(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-primary/50 transition-colors"
            >
              {availableBrands.map((b) => (
                <option key={b.id} value={b.id} className="bg-neutral-900 text-white">
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !emailInput.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Asociar Founder Corporativo
        </button>
      </form>

      {/* Listado de Relaciones */}
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 pl-1 flex items-center gap-1.5">
          Relaciones Activas ({relations.length})
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin opacity-55" />
          </div>
        ) : relations.length === 0 ? (
          <div className="border border-dashed border-white/10 p-6 rounded-2xl text-center text-xs text-white/30">
            No hay fundadores corporativos asociados aún.
          </div>
        ) : (
          <div className="max-h-[220px] overflow-y-auto custom-scrollbar border border-white/5 rounded-2xl divide-y divide-white/5">
            {relations.map((rel) => {
              const brand = availableBrands.find(b => b.id === rel.brand_id);
              return (
                <div key={rel.email} className="flex items-center justify-between p-3.5 hover:bg-white/[0.01] transition-colors group">
                  <div className="min-w-0 pr-3">
                    <span className="text-xs font-bold text-white/90 block truncate">{rel.email}</span>
                    <span className="text-[9px] text-white/30 font-medium block uppercase tracking-wider mt-0.5">
                      Registrado el {new Date(rel.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/5 border border-white/5 ${brand?.color || 'text-white'}`}>
                      {brand?.label || rel.brand_id.toUpperCase()}
                    </span>
                    <button
                      onClick={() => handleDeleteRelation(rel.email)}
                      className="p-2 text-white/20 hover:text-red-500 bg-white/5 hover:bg-red-500/10 rounded-lg border border-white/5 transition-all active:scale-90 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Eliminar relación"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
