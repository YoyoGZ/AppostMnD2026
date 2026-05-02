"use client";
import React from 'react';
import { ShieldAlert, Key, Users, Activity, LogOut } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function HQPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const [tokens, setTokens] = React.useState<any[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [quantity, setQuantity] = React.useState(1);

  React.useEffect(() => {
    import('@/app/actions/admin').then((m) => {
      m.fetchTokensAction().then((res) => {
        if (res.success && res.tokens) {
          setTokens(res.tokens);
        }
      });
    });
  }, []);

  const handleGenerate = async () => {
    if (quantity < 1 || quantity > 50) return;
    setIsGenerating(true);
    const { generateTokensAction } = await import('@/app/actions/admin');
    const res = await generateTokensAction(quantity);
    if (res.success && res.tokens) {
      setTokens((prev) => [...res.tokens, ...prev]);
    } else {
      alert("Error: " + res.error);
    }
    setIsGenerating(false);
  };

  const copyToClipboard = (tokenStr: string) => {
    const baseUrl = window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/vip/${tokenStr}`);
    alert("¡Link de Acceso VIP copiado!");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este token permanentemente?")) return;
    const { deleteTokenAction } = await import('@/app/actions/admin');
    const res = await deleteTokenAction(id);
    if (res.success) {
      setTokens((prev) => prev.filter((t) => t.id !== id));
    } else {
      alert("Error: " + res.error);
    }
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

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Token Factory Card */}
        <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden group col-span-1 md:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -z-10 transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-yellow-500/20 p-2 rounded-lg">
              <Key className="w-5 h-5 text-yellow-500" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-wide">Fábrica de Pases</h2>
          </div>
          <p className="text-white/40 text-sm mb-6 leading-relaxed">
            Generador maestro de Licencias de Capitán. Vende accesos únicos para fundar Arenas.
          </p>

          <div className="flex gap-2 mb-6">
            <input 
              type="number" 
              min="1" max="50"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-20 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-center font-bold text-lg focus:outline-none focus:border-yellow-500/50"
            />
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 bg-yellow-500 text-black hover:bg-yellow-400 transition-colors font-black py-3 rounded-xl uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(234,179,8,0.3)] active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? "Forjando..." : "Generar Tokens"}
            </button>
          </div>

          {/* Mini Tabla de Tokens Generados Recientemente */}
          <div className="mt-6 border-t border-white/5 pt-4">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Pases Disponibles ({tokens.filter(t => !t.is_used).length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {tokens.map((t) => (
                <div key={t.id} className="flex justify-between items-center bg-black/40 border border-white/5 p-3 rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-white/80">{t.token.split('-')[0]}...{t.token.split('-')[4]}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${t.is_used ? 'text-red-500' : 'text-green-500'}`}>
                      {t.is_used ? 'QUEMADO' : 'ACTIVO'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {!t.is_used && (
                      <button 
                        onClick={() => copyToClipboard(t.token)}
                        className="text-[10px] bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1.5 rounded-md uppercase"
                      >
                        Copiar
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(t.id)}
                      className="text-[10px] bg-red-500/10 hover:bg-red-500/30 text-red-400 font-bold px-3 py-1.5 rounded-md uppercase transition-colors"
                      title="Eliminar"
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Censo Global Placeholder */}
        <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-10 transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-wide">Censo Global</h2>
          </div>
          <p className="text-white/40 text-sm mb-8 leading-relaxed">
            Monitorea el consumo de pases, usuarios activos y expulsiones por fraude.
          </p>
          <button className="w-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-black py-4 rounded-xl opacity-50 cursor-not-allowed uppercase tracking-widest text-xs">
            Próximamente...
          </button>
        </div>

        {/* Oráculo Maestro Placeholder */}
        <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -z-10 transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-500/20 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-wide">Oráculo Manual</h2>
          </div>
          <p className="text-white/40 text-sm mb-8 leading-relaxed">
            Estado de la API deportiva. El Botón Rojo para sobreescribir resultados manualmente.
          </p>
          <button className="w-full bg-green-500/10 text-green-500 border border-green-500/20 font-black py-4 rounded-xl opacity-50 cursor-not-allowed uppercase tracking-widest text-xs">
            Próximamente...
          </button>
        </div>

      </main>
    </div>
  );
}
