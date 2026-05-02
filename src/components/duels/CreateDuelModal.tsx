"use client";

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Swords, UserPlus, CalendarDays, Loader2 } from 'lucide-react';
import tournamentData from '@/data/world-cup-2026.json';
import { createDuelAction } from '@/app/actions/duels';

type CreateDuelModalProps = {
  isOpen: boolean;
  onClose: () => void;
  leagueId: string;
  members: { userId: string; alias: string }[];
};

export function CreateDuelModal({ isOpen, onClose, leagueId, members }: CreateDuelModalProps) {
  const [selectedMatch, setSelectedMatch] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extraer todos los partidos
  const matches = React.useMemo(() => {
    const teamMap = new Map();
    tournamentData.equipos.forEach(t => teamMap.set(t.id, t.nombre));

    const allMatches = tournamentData.partidos.map(match => ({
      id: match.id.toString(),
      label: `${teamMap.get(match.local) || match.local} vs ${teamMap.get(match.visitante) || match.visitante} (${match.fase})`,
      date: match.fecha
    }));

    // Ordenar por fecha cronológica
    return allMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, []);

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    setError(null);
    if (!selectedMatch) {
      setError("Debes seleccionar un partido para el duelo.");
      return;
    }
    if (selectedParticipants.length < 2) {
      setError("Debes seleccionar al menos 2 gladiadores para combatir.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createDuelAction(leagueId, selectedMatch, selectedParticipants);
      if (result.error) {
        setError(result.error);
      } else {
        // Exito
        onClose();
        setSelectedMatch('');
        setSelectedParticipants([]);
      }
    } catch (err: any) {
      setError("Error de conexión al Coliseo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Forjar Nuevo Duelo">
      <div className="flex flex-col gap-6 text-white pb-2">
        
        {/* Paso 1: Seleccionar Partido */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-black uppercase text-primary mb-4 flex items-center gap-2">
            <CalendarDays className="w-5 h-5" /> 1. Elige el Campo de Batalla
          </h3>
          <select 
            className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-sm font-medium text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
            value={selectedMatch}
            onChange={(e) => setSelectedMatch(e.target.value)}
          >
            <option value="">-- Seleccionar Partido del Fixture --</option>
            {matches.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Paso 2: Seleccionar Gladiadores */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black uppercase text-primary flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> 2. Seleccionar Gladiadores
            </h3>
            <span className="text-xs font-bold text-white/50 bg-black/40 px-3 py-1 rounded-full">
              {selectedParticipants.length} Seleccionados
            </span>
          </div>
          <p className="text-xs text-white/40 mb-4 font-medium leading-relaxed">
            El sistema usará automáticamente los pronósticos que cada gladiador ya cargó en su tablero. 
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
            {members.map(member => {
              const isSelected = selectedParticipants.includes(member.userId);
              return (
                <button
                  key={member.userId}
                  onClick={() => toggleParticipant(member.userId)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                    isSelected 
                      ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(251,191,36,0.15)] text-white' 
                      : 'bg-black/40 border-white/5 text-white/50 hover:bg-white/5 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span className="text-sm font-bold truncate pr-2">{member.alias}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-primary bg-primary' : 'border-white/20'}`}>
                    {isSelected && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-bold uppercase tracking-widest text-center animate-in fade-in zoom-in duration-300">
            {error}
          </div>
        )}

        {/* Botón de Acción Principal */}
        <button
          onClick={handleCreate}
          disabled={isLoading || !selectedMatch || selectedParticipants.length < 2}
          className="w-full mt-2 bg-primary hover:bg-primary/90 disabled:bg-white/5 disabled:text-white/20 text-black font-black uppercase tracking-[0.2em] p-5 rounded-xl flex justify-center items-center gap-3 transition-all disabled:cursor-not-allowed shadow-[0_0_30px_rgba(251,191,36,0.1)] hover:shadow-[0_0_40px_rgba(251,191,36,0.25)]"
        >
          {isLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Forjando Combate...</>
          ) : (
            <><Swords className="w-6 h-6" /> Iniciar Duelo</>
          )}
        </button>
      </div>
    </Modal>
  );
}
