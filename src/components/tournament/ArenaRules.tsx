"use client";

import React from 'react';
import { Trophy, Clock, Lock, Eye, AlertCircle } from 'lucide-react';

const ArenaRules = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mx-auto p-4">
      {/* Card Principal: Puntuación */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300 group">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-yellow-500/20 rounded-2xl group-hover:scale-110 transition-transform">
            <Trophy className="text-yellow-500 w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white uppercase tracking-wider">Sistema de Puntos</h3>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm font-black text-primary/80 mb-2 uppercase tracking-wide">
            SOLO tienes a otros 9 contrincantes !! (10 por cada Liga en la App)
          </p>
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
            <span className="text-gray-400">Pronostico (Ganador o Empate)</span>
            <span className="text-2xl font-black text-yellow-500">+2</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
            <span className="text-gray-400">Resultado Exacto</span>
            <span className="text-2xl font-black text-yellow-400">+3</span>
          </div>
          <p className="text-sm text-yellow-500/60 font-medium italic">
            * Puntaje máximo por partido: 5 puntos
          </p>
        </div>
      </div>

      {/* Card: El Sello */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300 group">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-500/20 rounded-2xl group-hover:scale-110 transition-transform">
            <Lock className="text-blue-500 w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white uppercase tracking-wider">Sello de Apuesta</h3>
        </div>
        <p className="text-gray-300 leading-relaxed mb-4">
          Una vez confirmado tu pronóstico, la apuesta queda <span className="text-blue-400 font-bold uppercase">SELLADA</span>. 
          NO podras editarlo o cambiarlo de ningún modo.
        </p>
        <div className="flex items-center gap-2 text-blue-300 text-sm bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
          <AlertCircle size={16} />
          <span>Piensa bien ANTES de cerrar la apuesta !!</span>
        </div>
      </div>

      {/* Card: Time-locks */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300 group">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-red-500/20 rounded-2xl group-hover:scale-110 transition-transform">
            <Clock className="text-red-500 w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white uppercase tracking-wider">Cierre de Arena</h3>
        </div>
        <p className="text-gray-300 leading-relaxed">
          Las apuestas se cierran automáticamente <span className="text-red-400 font-bold">5 minutos antes</span> del inicio del horario del partido.
        </p>
      </div>

      {/* Card: Blind Reveal */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300 group">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-purple-500/20 rounded-2xl group-hover:scale-110 transition-transform">
            <Eye className="text-purple-500 w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white uppercase tracking-wider">Hype Reveal</h3>
        </div>
        <p className="text-gray-300 leading-relaxed">
          Las apuestas de tus amigos se mantendrán ocultas hasta el <span className="text-purple-400 font-bold">Minuto 10</span> del partido para añadir suspenso a los primeros goles.
        </p>
      </div>
    </div>
  );
};

export default ArenaRules;
