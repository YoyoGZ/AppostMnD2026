"use client";

import React, { useEffect, useState, useRef } from 'react';
import { 
  Users, 
  Trophy, 
  RefreshCw, 
  Sparkles, 
  Mail, 
  Check, 
  Copy, 
  AlertTriangle, 
  TrendingUp, 
  RotateCcw 
} from 'lucide-react';
import { 
  getProfileCensusAction, 
  runRaffleAction, 
  getRaffleWinnerAction, 
  resetRaffleAction 
} from '@/app/actions/admin';

interface Candidate {
  id: string;
  display_name: string;
  email: string;
  position: number;
}

interface Winner {
  id: string;
  display_name: string;
  email: string;
  created_at: string;
  position: number;
}

interface Census {
  members: number;
  founders: number;
  total: number;
  conversionRate: number;
}

export function RaffleModule() {
  // Censo
  const [census, setCensus] = useState<Census | null>(null);
  const [isLoadingCensus, setIsLoadingCensus] = useState(true);
  const [censusError, setCensusError] = useState<string | null>(null);

  // Sorteo
  const [winner, setWinner] = useState<Winner | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isRaffling, setIsRaffling] = useState(false);
  const [currentNameIdx, setCurrentNameIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [raffleError, setRaffleError] = useState<string | null>(null);
  
  // Confeti nativo
  const [confettiParticles, setConfettiParticles] = useState<{ id: number; left: number; delay: number; color: string; size: number }[]>([]);

  // Referencias para timers de animación
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Carga inicial
  useEffect(() => {
    loadCensus();
    loadWinner();
  }, []);

  const loadCensus = async () => {
    setIsLoadingCensus(true);
    setCensusError(null);
    const res = await getProfileCensusAction();
    if (res.success && res.census) {
      setCensus(res.census);
    } else {
      setCensusError(res.error || "No se pudo cargar el censo");
    }
    setIsLoadingCensus(false);
  };

  const loadWinner = async () => {
    const res = await getRaffleWinnerAction();
    if (res.success && res.winner) {
      setWinner(res.winner);
    }
  };

  const generateConfetti = () => {
    const colors = ['#facc15', '#eab308', '#38bdf8', '#0ea5e9', '#ffffff']; // Trophy Gold, Light Blue, White
    const particles = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // Porcentaje de ancho
      delay: Math.random() * 2, // Segundos de retraso
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 12 + 6 // Pixeles
    }));
    setConfettiParticles(particles);
  };

  const handleStartRaffle = async () => {
    setIsRaffling(true);
    setRaffleError(null);
    setConfettiParticles([]);

    try {
      const res = await runRaffleAction();
      if (!res.success) {
        setRaffleError(res.error || "Error al realizar el sorteo");
        setIsRaffling(false);
        return;
      }

      // Si ya existía un ganador en la BD, lo colocamos directamente sin animación larga
      if (res.alreadyExists && res.winner) {
        setWinner(res.winner);
        setIsRaffling(false);
        return;
      }

      const backendWinner = res.winner!;
      const list = res.candidates || [];
      setCandidates(list);

      // Si por alguna razón la lista vino vacía, fallback de seguridad
      if (list.length === 0) {
        setWinner(backendWinner);
        setIsRaffling(false);
        return;
      }

      // Animación de Ruleta con desenfoque de movimiento (3 segundos total)
      let currentIdx = 0;
      let speed = 40; // velocidad inicial rápida (ms)
      
      const animate = () => {
        setCurrentNameIdx(currentIdx);
        currentIdx = (currentIdx + 1) % list.length;
        
        // Simular desaceleración gradual
        if (speed < 300) {
          speed += 12;
          intervalRef.current = setTimeout(animate, speed);
        } else {
          // Finalizar la animación y develar al ganador real de forma contundente
          // Buscamos si el ganador del backend está en la lista para centrarlo
          const winIdx = list.findIndex(c => c.id === backendWinner.id);
          if (winIdx !== -1) {
            setCurrentNameIdx(winIdx);
          }
          
          setWinner(backendWinner);
          setIsRaffling(false);
          generateConfetti();
          // Sincronizar censo después del sorteo
          loadCensus();
        }
      };

      intervalRef.current = setTimeout(animate, speed);

    } catch (err) {
      setRaffleError("Error inesperado en la conexión.");
      setIsRaffling(false);
    }
  };

  const handleResetRaffle = async () => {
    if (!confirm("🚨 ATENCIÓN: ¿Estás seguro de que deseas anular el sorteo actual? Esto eliminará al ganador registrado y permitirá realizar un nuevo sorteo interactivo.")) {
      return;
    }

    const res = await resetRaffleAction();
    if (res.success) {
      setWinner(null);
      setCandidates([]);
      setConfettiParticles([]);
      loadCensus();
    } else {
      alert("Error al resetear sorteo: " + res.error);
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Limpiar timers
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* TARJETA 1: CENSO Y CONVERSIÓN EN VIVO */}
      <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl -z-10 transition-transform group-hover:scale-150" />
        
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-sky-500/20 p-2.5 rounded-xl border border-sky-500/10">
                <Users className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-white">Métricas de Fundadores</h3>
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Suscripciones en Vivo</p>
              </div>
            </div>
            
            <button 
              onClick={loadCensus}
              disabled={isLoadingCensus}
              className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white p-2 rounded-lg border border-white/5 transition-all disabled:opacity-50"
              title="Actualizar Censo"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCensus ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoadingCensus ? (
            <div className="space-y-4 py-4">
              <div className="h-10 bg-white/5 rounded-xl animate-pulse" />
              <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
            </div>
          ) : censusError ? (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-center text-xs text-red-400">
              <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-red-400" />
              {censusError}
            </div>
          ) : census ? (
            <div className="space-y-6">
              
              {/* Bento de números clave */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block">Miembros Registrados</span>
                  <span className="text-2xl font-black text-white/80 block mt-1">{census.members}</span>
                  <span className="text-[9px] text-white/40 block mt-1">Sin activar liga (Gratis)</span>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-500/5 to-transparent border border-yellow-500/20 rounded-2xl p-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-yellow-500/10 rounded-full blur-xl -z-10" />
                  <span className="text-[9px] font-bold text-yellow-500/60 uppercase tracking-widest block">Founders Activos</span>
                  <span className="text-2xl font-black text-yellow-400 block mt-1">{census.founders}</span>
                  <span className="text-[9px] text-yellow-400/50 block mt-1">Founder Pass completo</span>
                </div>
              </div>

              {/* Conversión Funnel (Embudo) */}
              <div className="bg-black/55 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/70">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    Tasa de Conversión
                  </div>
                  <span className="text-sm font-black text-green-400">{census.conversionRate}%</span>
                </div>
                
                {/* Barra de progreso premium */}
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-500 via-green-400 to-yellow-400 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.min(census.conversionRate, 100)}%` }}
                  />
                </div>

                <p className="text-[10px] text-white/40 mt-3 leading-relaxed">
                  Meta del sorteo de la camiseta: <span className="text-yellow-400 font-bold">Primeros 50 Founders</span> en el sistema. 
                  Progreso actual de la meta: <span className="text-white font-bold">{Math.min(census.founders, 50)}/50</span> ({Math.min(Math.round((census.founders / 50) * 100), 100)}%).
                </p>
              </div>

            </div>
          ) : null}
        </div>

        <div className="border-t border-white/5 pt-4 mt-6 text-[10px] text-white/30 flex items-center justify-between">
          <span>Fuente: profiles (Supabase)</span>
          <span className="flex items-center gap-1 text-green-400/70 font-bold uppercase tracking-wider animate-pulse">
            ● Base de datos conectada
          </span>
        </div>
      </div>

      {/* TARJETA 2: EL ORÁCULO DEL SORTEO DE LA CAMISETA */}
      <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl -z-10" />

        {/* Confeti nativo volando en el fondo si hay ganador */}
        {confettiParticles.map((p) => (
          <div
            key={p.id}
            className="absolute pointer-events-none rounded-sm"
            style={{
              left: `${p.left}%`,
              top: `-20px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              opacity: 0.8,
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `confetti-fall ${Math.random() * 3 + 2}s linear infinite`,
              animationDelay: `${p.delay}s`,
              zIndex: 5
            }}
          />
        ))}

        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500/10 p-2.5 rounded-xl border border-yellow-500/20">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-white">Sorteo de Camiseta</h3>
                <p className="text-[9px] text-yellow-400 font-bold uppercase tracking-widest mt-0.5">La Suerte de los Primeros 50</p>
              </div>
            </div>
            {winner && (
              <button
                onClick={handleResetRaffle}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-1.5 rounded-lg border border-red-500/20 transition-all"
                title="Resetear Sorteo"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {raffleError && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-xs text-red-400 mb-4 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold block">No se pudo realizar el sorteo:</span>
                <span className="mt-0.5 block leading-relaxed">{raffleError}</span>
              </div>
            </div>
          )}

          {/* ESTADO 1: GIRANDO (RULETA ACTIVA) */}
          {isRaffling && candidates.length > 0 && (
            <div className="bg-black/60 border border-white/10 rounded-2xl p-8 text-center flex flex-col justify-center items-center h-[200px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent animate-pulse" />
              <Sparkles className="w-8 h-8 text-yellow-400/40 animate-bounce mb-3" />
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">Seleccionando entre los 50...</span>
              
              {/* Carrusel cinético con blur de movimiento artificial */}
              <div 
                className="text-xl font-black uppercase tracking-wider text-yellow-400 transition-all duration-75 select-none"
                style={{ 
                  filter: 'blur(3px)',
                  transform: 'scale(1.15)',
                  textShadow: '0 0 20px rgba(234, 179, 8, 0.4)'
                }}
              >
                {candidates[currentNameIdx]?.display_name}
              </div>
              <span className="text-[9px] text-white/40 block mt-2 font-mono">
                {candidates[currentNameIdx]?.email}
              </span>
            </div>
          )}

          {/* ESTADO 2: GANADOR DEVELADO */}
          {!isRaffling && winner && (
            <div className="bg-gradient-to-b from-yellow-500/10 to-transparent border border-yellow-500/30 rounded-2xl p-6 relative overflow-hidden text-center group/winner">
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-yellow-500/20 rounded-full blur-2xl" />
              
              <div className="inline-flex bg-yellow-500 text-black px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(250,204,21,0.4)] animate-pulse">
                🏆 Ganador de la Camiseta
              </div>

              <h4 className="text-2xl font-black tracking-tight text-white uppercase mt-1">
                {winner.display_name}
              </h4>
              
              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-white/60 font-mono">
                <Mail className="w-3.5 h-3.5 text-yellow-400" />
                {winner.email}
              </div>

              {/* Posición histórica */}
              <p className="text-[10px] text-yellow-500/60 font-bold uppercase tracking-wider mt-4">
                Miembro Fundador N° {winner.position} registrado en Supabase
              </p>

              {/* Botón de acción rápida: Copiar Email */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => handleCopyEmail(winner.email)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
                    copied 
                      ? 'bg-green-500 text-black border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                      : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-yellow-500/30'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" /> Copiado con éxito
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copiar Email para Contacto
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ESTADO 3: INICIAL (SIN GANADOR NI PROCESO) */}
          {!isRaffling && !winner && (
            <div className="bg-black/30 border border-dashed border-white/10 rounded-2xl p-8 text-center flex flex-col justify-center items-center h-[200px]">
              <Trophy className="w-8 h-8 text-white/20 mb-3" />
              <p className="text-white/50 text-xs max-w-xs mx-auto leading-relaxed">
                Ejecuta el sorteo oficial y transparente entre los primeros 50 fundadores que registraron y activaron su Founder Pass.
              </p>
              
              <button
                onClick={handleStartRaffle}
                className="mt-6 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:scale-105 hover:shadow-[0_0_35px_rgba(245,158,11,0.4)] transition-all duration-300 active:scale-95 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 fill-black" />
                Desvelar Ganador
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-white/5 pt-4 mt-6 text-[10px] text-white/30 flex items-center justify-between">
          <span>Oráculo de la Suerte v1.0</span>
          <span>100% Aleatorio & Justo</span>
        </div>

        {/* Estilo Keyframes CSS inyectado para animación de confeti */}
        <style jsx global>{`
          @keyframes confetti-fall {
            0% {
              transform: translateY(-20px) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(220px) rotate(360deg);
              opacity: 0;
            }
          }
        `}</style>
      </div>

    </div>
  );
}
