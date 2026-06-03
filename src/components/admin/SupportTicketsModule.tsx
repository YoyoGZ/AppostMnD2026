"use client";

import React, { useState, useEffect } from "react";
import { 
  getSupportTicketsAction, 
  updateSupportTicketStatusAction, 
  SupportTicket 
} from "@/app/actions/support";
import { 
  MessageSquare, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  Mail, 
  User, 
  Trash2,
  AlertCircle
} from "lucide-react";

export function SupportTicketsModule() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpenOnly, setFilterOpenOnly] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSupportTicketsAction();
      if (res.success && res.tickets) {
        setTickets(res.tickets);
      } else {
        setError(res.error || "No se pudieron cargar los tickets de soporte.");
      }
    } catch (err) {
      setError("Error de red al conectar con el servidor.");
    }
    setLoading(false);
  };

  const handleResolveTicket = async (id: string) => {
    setUpdatingId(id);
    try {
      const res = await updateSupportTicketStatusAction(id, "resolved");
      if (res.success) {
        // Actualizar estado localmente
        setTickets(prev => prev.map(t => t.id === id ? { ...t, status: "resolved" } : t));
      } else {
        alert(res.error || "No se pudo actualizar el estado del ticket.");
      }
    } catch (err) {
      alert("Error de conexión al resolver el ticket.");
    }
    setUpdatingId(null);
  };

  const filteredTickets = tickets.filter(t => !filterOpenOnly || t.status === "open");

  return (
    <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -z-10" />

      {/* Cabecera del Módulo */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
            <MessageSquare className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-wide">Tickets de Soporte</h2>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Asistencia al Usuario</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch de filtro */}
          <button
            onClick={() => setFilterOpenOnly(!filterOpenOnly)}
            className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all ${
              filterOpenOnly 
                ? 'bg-red-500/10 text-red-400 border-red-500/30' 
                : 'bg-white/5 text-white/40 border-white/10 hover:text-white'
            }`}
          >
            {filterOpenOnly ? "Pendientes" : "Todos"}
          </button>
          
          <button 
            onClick={loadTickets}
            disabled={loading}
            className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white p-2 rounded-xl border border-white/5 transition-all disabled:opacity-50"
            title="Recargar tickets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="space-y-3 py-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-20 w-full bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/5 border border-red-500/10 text-red-400 p-6 rounded-2xl text-center text-xs">
          <p className="font-bold">⚠️ Error al cargar tickets</p>
          <p className="text-white/40 mt-1">{error}</p>
          <button 
            onClick={loadTickets} 
            className="mt-3 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/35 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="border border-dashed border-white/10 p-8 rounded-2xl text-center text-white/40 text-xs font-semibold">
          No hay tickets de soporte {filterOpenOnly ? "abiertos" : "registrados"} en el sistema.
        </div>
      ) : (
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredTickets.map((ticket) => {
            const isOpen = ticket.status === "open";
            const dateStr = new Date(ticket.created_at).toLocaleString("es-AR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <div 
                key={ticket.id} 
                className={`p-4 rounded-2xl border transition-all ${
                  isOpen 
                    ? 'border-red-500/20 bg-red-500/[0.02]' 
                    : 'border-white/5 bg-white/[0.01]'
                }`}
              >
                {/* Info superior */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-white leading-none">
                      <User className="w-3.5 h-3.5 text-white/40" /> {ticket.alias}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-white/50 leading-none">
                      <Mail className="w-3.5 h-3.5 text-white/30" /> {ticket.email}
                    </span>
                  </div>
                  
                  {/* Badge de estado */}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                    isOpen 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/25' 
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                  }`}>
                    {isOpen ? <Clock className="w-2.5 h-2.5" /> : <CheckCircle className="w-2.5 h-2.5" />}
                    {isOpen ? "Pendiente" : "Resuelto"}
                  </span>
                </div>

                {/* Mensaje */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-3 mb-3 text-slate-300 text-xs leading-relaxed font-medium">
                  {ticket.message}
                </div>

                {/* Acciones del Ticket */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">{dateStr}</span>
                  
                  {isOpen && (
                    <button
                      onClick={() => handleResolveTicket(ticket.id)}
                      disabled={updatingId === ticket.id}
                      className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/25 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {updatingId === ticket.id ? (
                        <div className="w-2.5 h-2.5 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle className="w-3 h-3" />
                      )}
                      Marcar Resuelto
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
