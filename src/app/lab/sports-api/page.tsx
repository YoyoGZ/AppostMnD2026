'use client'

import React, { useState, useEffect } from 'react';
import { triggerManualSync } from './actions';
import { MatchResult } from '@/types/sports-api';
import { Loader2, RefreshCw, Zap, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SportsApiLab() {
  const [result, setResult] = useState<MatchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // REQUISITO: Auto-Sync ACTIVO por defecto al entrar
  const [autoSync, setAutoSync] = useState(true);
  
  // REQUISITO: Botón APARTE para detener (Parada de Emergencia)
  const [isEmergencyStopped, setIsEmergencyStopped] = useState(false);

  const handleSync = async () => {
    if (isEmergencyStopped) return;
    setIsLoading(true);
    // Usamos el match ID 1 (México vs Sudáfrica) como conejillo de indias
    const data = await triggerManualSync(1);
    if (data) setResult(data);
    setIsLoading(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoSync && !isEmergencyStopped) {
      interval = setInterval(handleSync, 5000); // Sincroniza cada 5 segundos en el lab
    }
    return () => clearInterval(interval);
  }, [autoSync, isEmergencyStopped]);

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center gap-12">
      
      {/* Header Estilo Premium */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-b from-foreground to-foreground/40 bg-clip-text text-transparent">
          SPORTS API <span className="text-primary text-xl align-top">LAB</span>
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Panel de control de sincronización en tiempo real. 
          <span className="block text-primary/80 font-bold mt-1 text-xs uppercase tracking-widest">Estado: {isEmergencyStopped ? '⚠️ BLOQUEADO' : '✅ OPERATIVO'}</span>
        </p>
      </div>

      {/* Control Panel: Tres niveles de control */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-4 p-2 bg-muted/50 rounded-2xl border border-border/50 backdrop-blur-xl">
          {/* 1. Sync Manual */}
          <button 
            onClick={handleSync}
            disabled={isLoading || isEmergencyStopped}
            className="flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-30"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            Sync Now
          </button>
          
          {/* 2. Toggle Auto-Sync */}
          <button 
            onClick={() => setAutoSync(!autoSync)}
            disabled={isEmergencyStopped}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border-2 disabled:opacity-30",
              autoSync 
                ? "bg-primary/10 border-primary text-primary" 
                : "bg-transparent border-border text-muted-foreground"
            )}
          >
            <Zap className={cn("w-5 h-5", autoSync && "fill-current")} />
            {autoSync ? "Auto-Sync ON" : "Auto-Sync OFF"}
          </button>
        </div>

        {/* 3. PARADA DE EMERGENCIA (Boton Aparte) */}
        <button 
          onClick={() => {
            setIsEmergencyStopped(!isEmergencyStopped);
            if (!isEmergencyStopped) setAutoSync(false); // Al detener, apagamos el auto-sync por seguridad
          }}
          className={cn(
            "flex items-center gap-4 px-12 py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all border-2 text-sm shadow-2xl",
            isEmergencyStopped 
              ? "bg-red-600 border-red-500 text-white animate-pulse" 
              : "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
          )}
        >
          <ShieldAlert className="w-6 h-6" />
          {isEmergencyStopped ? "REANUDAR AGENTE" : "PARADA DE EMERGENCIA"}
        </button>
      </div>

      {/* Live Card: El "Conejillo de Indias" */}
      <div className="relative group">
        {/* Glow Effect */}
        <div className={cn(
          "absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-[2.5rem] blur transition duration-1000",
          isEmergencyStopped ? "from-red-600 to-orange-600 opacity-40" : "opacity-25 group-hover:opacity-40"
        )}></div>
        
        <div className="relative w-[400px] bg-card border border-border/50 rounded-[2rem] p-8 shadow-2xl backdrop-blur-2xl">
          
          <div className="flex flex-col gap-8">
            {/* Match Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                GRUPO A • J1
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase flex items-center gap-2",
                result?.status === 'live' ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"
              )}>
                {result?.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
                {result?.status === 'live' ? `EN VIVO • ${result.elapsed}'` : result?.status || 'Scheduled'}
              </div>
            </div>

            {/* Teams & Score */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col items-center gap-3 flex-1">
                <span className="text-5xl drop-shadow-lg">🇲🇽</span>
                <span className="font-bold text-sm">MEXICO</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-6xl font-black tabular-nums">{result?.home_score ?? 0}</span>
                <span className="text-2xl font-black text-muted-foreground/30">:</span>
                <span className="text-6xl font-black tabular-nums">{result?.away_score ?? 0}</span>
              </div>

              <div className="flex flex-col items-center gap-3 flex-1">
                <span className="text-5xl drop-shadow-lg">🇿🇦</span>
                <span className="font-bold text-sm">SUDÁFRICA</span>
              </div>
            </div>

            {/* Sync Status Info */}
            <div className="pt-6 border-t border-border/50 flex justify-between items-center text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              <span>Match ID: #001</span>
              <span>Last Sync: {result ? new Date(result.last_sync).toLocaleTimeString() : 'Never'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="w-full max-w-2xl bg-muted/30 rounded-3xl p-6 border border-border/30">
        <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest">Database State (match_results)</h3>
        <pre className="text-[10px] font-mono overflow-auto max-h-40 bg-black/20 p-4 rounded-xl text-primary/80">
          {result ? JSON.stringify(result, null, 2) : '// No sync data available yet'}
        </pre>
      </div>

    </div>
  );
}
