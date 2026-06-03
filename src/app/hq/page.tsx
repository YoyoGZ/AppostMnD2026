"use client";
import React from 'react';
import { 
  ShieldAlert, 
  Users, 
  Activity, 
  LogOut, 
  Swords, 
  FlaskConical, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { LiveMatchTestModal } from './LiveMatchTestModal';
import { RaffleModule } from '@/components/admin/RaffleModule';
import { UserControlModule } from '@/components/admin/UserControlModule';
import { CorporateBrandingModule } from '@/components/admin/CorporateBrandingModule';
import { PromoControlModule } from '@/components/admin/PromoControlModule';
import { SupportTicketsModule } from '@/components/admin/SupportTicketsModule';

import { 
  getTestModeAction, 
  toggleTestModeAction, 
  fetchMpPaymentsAction 
} from '@/app/actions/admin';


export default function HQPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Estados del Modo Test
  const [isTestModeActive, setIsTestModeActive] = React.useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
  const [dbError, setDbError] = React.useState<string | null>(null);

  // Estados del Censo de Pagos (Mercado Pago)
  const [payments, setPayments] = React.useState<any[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = React.useState(true);
  const [paymentsError, setPaymentsError] = React.useState<string | null>(null);

  // Estado del Modal de API
  const [isLiveMatchTestOpen, setIsLiveMatchTestOpen] = React.useState(false);

  // Carga inicial
  React.useEffect(() => {
    // 1. Obtener estado del modo test
    getTestModeAction().then((res) => {
      if (res.success) {
        setIsTestModeActive(res.active);
      }
      setIsLoadingSettings(false);
    });

    // 2. Traer transacciones reales de Mercado Pago
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setIsLoadingPayments(true);
    setPaymentsError(null);
    try {
      const res = await fetchMpPaymentsAction();
      if (res.success && res.payments) {
        setPayments(res.payments);
      } else {
        setPaymentsError(res.error || "No se pudieron obtener las transacciones");
      }
    } catch (err) {
      setPaymentsError("Error de conexión al cargar pagos.");
    }
    setIsLoadingPayments(false);
  };

  const handleToggleTestMode = async () => {
    setIsLoadingSettings(true);
    setDbError(null);
    const targetState = !isTestModeActive;
    
    // UI Optimista
    setIsTestModeActive(targetState);

    try {
      const res = await toggleTestModeAction(targetState);
      if (!res.success) {
        // Rollback en caso de error
        setIsTestModeActive(!targetState);
        setDbError(res.error || "Error al actualizar la configuración.");
      }
    } catch (err) {
      setIsTestModeActive(!targetState);
      setDbError("Ocurrió un error inesperado al conectar con el servidor.");
    }
    setIsLoadingSettings(false);
  };

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col p-4 md:p-8">
      {/* Glow background */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <header className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-red-500">
              Headquarters <span className="text-white/30 hidden md:inline">(God Mode)</span>
            </h1>
            <p className="text-red-500/50 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mt-1">
              Nivel de Acceso: Super Admin
            </p>
          </div>
        </div>

        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2 text-white/40 hover:text-red-500 transition-colors text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-red-500/10 px-4 py-2 rounded-lg border border-white/5"
        >
          <LogOut className="w-4 h-4" /> Salir del Sistema
        </button>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start">
        
        {/* COLUMNA IZQUIERDA: CONFIGURADOR DE PRECIOS */}
        <div className="space-y-6 lg:col-span-1">
          {/* Switch de modo test */}
          <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 ${isTestModeActive ? 'bg-amber-500/10' : 'bg-green-500/10'} rounded-full blur-3xl -z-10 transition-transform group-hover:scale-150`} />
            
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${isTestModeActive ? 'bg-amber-500/20' : 'bg-green-500/20'}`}>
                {isTestModeActive ? (
                  <FlaskConical className="w-5 h-5 text-amber-500" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                )}
              </div>
              <h2 className="text-lg font-black uppercase tracking-wide">Control de Pasarela</h2>
            </div>
            
            <p className="text-white/40 text-sm mb-6 leading-relaxed">
              Alterna en caliente el valor oficial del Founder Pass para realizar pruebas del flujo de compra completo sin costo real.
            </p>

            {dbError && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl mb-4 text-xs text-red-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Acción Requerida:</p>
                  <p className="leading-relaxed mt-0.5">{dbError}</p>
                </div>
              </div>
            )}

            {/* Panel de estado */}
            <div className="bg-black/55 border border-white/5 rounded-2xl p-4 mb-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block">Valor del Founder Pass</span>
                <span className={`text-2xl font-black ${isTestModeActive ? 'text-amber-500' : 'text-green-500'} transition-colors`}>
                  {isTestModeActive ? '$20 ARS' : '$5.000 ARS'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block">Entorno</span>
                <span className={`text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${isTestModeActive ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                  {isTestModeActive ? 'Sandbox Test' : 'Producción'}
                </span>
              </div>
            </div>

            {/* Switch Interactiva Premium */}
            <button 
              onClick={handleToggleTestMode}
              disabled={isLoadingSettings}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border font-black uppercase tracking-wider text-xs transition-all ${
                isTestModeActive 
                  ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:bg-amber-400' 
                  : 'bg-white/5 text-white/90 border-white/10 hover:bg-white/10'
              } disabled:opacity-50 active:scale-[0.98]`}
            >
              <span>{isTestModeActive ? "Modo Test Activo ($20)" : "Activar Modo Test ($20)"}</span>
              <div className={`w-10 h-6 rounded-full p-1 transition-colors relative flex items-center ${
                isTestModeActive ? 'bg-black/40' : 'bg-white/10'
              }`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isTestModeActive ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </div>
            </button>
          </div>

          {/* Co-Branding Manager (Gestión de Bypass de Pago & Marca Blanca) */}
          <CorporateBrandingModule />

          {/* Módulo de Gestión de Códigos Promocionales */}
          <PromoControlModule />

          {/* Motor de Eliminatorias */}
          <div className="bg-gradient-to-b from-primary/5 to-transparent border border-primary/20 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10 transition-transform group-hover:scale-150" />
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Swords className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-wide">Eliminatorias</h2>
            </div>
            <p className="text-white/40 text-sm mb-6 leading-relaxed">
              Gestión de llaves, ranking de mejores terceros y despliegue oficial de la Fase Final.
            </p>
            <button 
              onClick={() => router.push('/hq/knockouts')}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/80 transition-all font-black py-4 rounded-xl uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(251,191,36,0.3)] active:scale-95"
            >
              Abrir Panel de Control
            </button>
          </div>
        </div>

        {/* COLUMNA CENTRAL/DERECHA: CENSO GLOBAL & SYNC AGENTS */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Fila de Controles Secundarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sync Agent */}
            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -z-10 transition-transform group-hover:scale-150" />
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <Activity className="w-5 h-5 text-green-500" />
                </div>
                <h2 className="text-lg font-black uppercase tracking-wide">Sync Agent (MOCK)</h2>
              </div>
              <p className="text-white/40 text-sm mb-6 leading-relaxed">
                Fuerza la inyección de datos simulados para probar los marcadores y tablas de posiciones de los grupos.
              </p>
              <button 
                onClick={async () => {
                  const { forceMockSyncAction } = await import('@/app/actions/sync');
                  const res = await forceMockSyncAction();
                  if (res.success) {
                    alert(`¡Sincronización exitosa! ${res.updatedCount} partidos inyectados en Supabase. Revisa el Dashboard.`);
                  } else {
                    alert("Error sincronizando: " + res.error);
                  }
                }}
                className="w-full bg-green-500/20 text-green-400 hover:bg-green-500/40 transition-colors font-black py-4 rounded-xl uppercase tracking-widest text-xs border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)] active:scale-95"
              >
                Inyectar Resultados Mock
              </button>
            </div>

            {/* Live API Test */}
            <div className="bg-gradient-to-b from-red-500/5 to-transparent border border-red-500/20 rounded-3xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -z-10 transition-transform group-hover:scale-150" />
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-500/20 p-2 rounded-lg">
                  <Activity className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-lg font-black uppercase tracking-wide text-red-500">Live API Test</h2>
              </div>
              <p className="text-white/40 text-sm mb-6 leading-relaxed">
                Verifica la conexión con la API de fútbol en tiempo real abriendo la tarjeta de un partido simulado en curso.
              </p>
              <button 
                onClick={() => setIsLiveMatchTestOpen(true)}
                className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/30 transition-colors font-black py-4 rounded-xl uppercase tracking-widest text-xs border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)] active:scale-95"
              >
                Probar Match Card
              </button>
            </div>
          </div>

          {/* Módulo de Censo & Sorteo de la Camiseta Oficial */}
          <RaffleModule />

          {/* Módulo de Control de Jugadores & Claves Extraviadas */}
          <UserControlModule />

          {/* Módulo de Gestión de Tickets de Soporte */}
          <SupportTicketsModule />

          {/* Censo Global de Transacciones Reales (Mercado Pago) */}
          <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden">

            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -z-10" />
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-wide">Censo Global de Ventas</h2>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Historial en Vivo (Mercado Pago)</p>
                </div>
              </div>
              <button 
                onClick={loadPayments}
                disabled={isLoadingPayments}
                className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white p-2 rounded-xl border border-white/5 transition-all disabled:opacity-50"
                title="Sincronizar con Mercado Pago"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingPayments ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Listado de Pagos */}
            {isLoadingPayments ? (
              <div className="space-y-3 py-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 w-full bg-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : paymentsError ? (
              <div className="bg-red-500/5 border border-red-500/10 text-red-400 p-6 rounded-2xl text-center text-sm">
                <p className="font-bold">⚠️ Error cargando transacciones</p>
                <p className="text-xs text-white/40 mt-1">{paymentsError}</p>
                <button 
                  onClick={loadPayments} 
                  className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/35 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-wider rounded-lg transition-colors"
                >
                  Reintentar Conexión
                </button>
              </div>
            ) : payments.length === 0 ? (
              <div className="border border-dashed border-white/10 p-8 rounded-2xl text-center text-white/40 text-sm">
                No se registraron cobros en el sistema todavía.
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-white/30">
                      <th className="pb-3 pl-2">ID Transacción</th>
                      <th className="pb-3">Pagador (Email)</th>
                      <th className="pb-3">Liga Solicitada</th>
                      <th className="pb-3">Monto</th>
                      <th className="pb-3 text-center">Estado</th>
                      <th className="pb-3 text-right pr-2">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.map((p) => {
                      const isApproved = p.status === 'approved';
                      const isPending = p.status === 'pending' || p.status === 'in_process';
                      
                      return (
                        <tr key={p.id} className="text-xs hover:bg-white/[0.02] transition-colors group">
                          <td className="py-3.5 pl-2 font-mono text-white/70">
                            {p.id}
                          </td>
                          <td className="py-3.5 text-white/80 max-w-[140px] truncate" title={p.email}>
                            {p.email}
                          </td>
                          <td className="py-3.5 font-bold text-white/90">
                            {p.league_name}
                          </td>
                          <td className="py-3.5 font-black text-white">
                            ${parseFloat(p.amount).toLocaleString('es-AR')} {p.currency}
                          </td>
                          <td className="py-3.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              isApproved 
                                ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                : isPending
                                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}>
                              {isApproved ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" /> Aprobado
                                </>
                              ) : isPending ? (
                                <>
                                  <Activity className="w-3 h-3 animate-pulse" /> Pendiente
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" /> Fallido
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-3.5 text-right pr-2 text-white/40 text-[10px]">
                            {new Date(p.date).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* SECCIÓN DEL CODIGO QR PARA FLYER (TEMPORAL) */}
      <footer className="mt-12 pb-12 pt-8 border-t border-white/10 flex flex-col items-center">
        <div className="w-full max-w-md bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden group text-center shadow-[0_0_50px_rgba(255,255,255,0.02)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -z-10" />
          
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <QrCode className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider text-white">Generador de QR Oficial</h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Escaneable en vivo para Publicidad</p>
            </div>
          </div>

          <p className="text-white/60 text-xs mb-6 max-w-sm mx-auto leading-relaxed">
            Código QR de alta definición (5cm x 5cm) generado para <span className="text-amber-500 font-bold">www.mundiapp26.com</span>. Sacale una captura de pantalla e instalalo en tu Word para el flyer impreso.
          </p>

          {/* Contenedor del QR con caja blanca y bordes suaves */}
          <div className="flex justify-center mb-5">
            <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-transform duration-300 hover:scale-105">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://www.mundiapp26.com" 
                alt="QR Code Oficial MundiApp26" 
                className="w-48 h-48 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </div>

          <div className="inline-flex flex-col items-center">
            <span className="text-[11px] font-mono text-white/50 bg-black/40 px-3 py-1 rounded-md border border-white/5">
              https://www.mundiapp26.com
            </span>
            <span className="text-[9px] text-white/30 mt-2 italic font-bold">
              Tamaño aproximado en pantalla: ~5cm x 5cm (192px)
            </span>
          </div>
        </div>
      </footer>

      {isLiveMatchTestOpen && (
        <LiveMatchTestModal onClose={() => setIsLiveMatchTestOpen(false)} />
      )}
    </div>
  );
}
