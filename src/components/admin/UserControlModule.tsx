"use client";
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Key, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Lock,
  Copy,
  Check,
  UserCheck
} from 'lucide-react';
import { getAllProfilesAction, resetUserPasswordAction } from '@/app/actions/admin';

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string | null;
  created_at: string;
}

export function UserControlModule() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para restablecer contraseña
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [customPassword, setCustomPassword] = useState('ABCD1234');
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{
    success: boolean;
    userId: string;
    newPassword?: string;
    error?: string;
  } | null>(null);

  // Estado de copiado al portapapeles
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (query = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAllProfilesAction(query);
      if (res.success && res.users) {
        setUsers(res.users);
      } else {
        setError(res.error || "No se pudieron cargar los perfiles.");
      }
    } catch (err) {
      setError("Error de conexión al cargar jugadores.");
    }
    setIsLoading(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(searchQuery);
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    setIsResetting(true);
    setResetResult(null);
    try {
      const res = await resetUserPasswordAction(selectedUser.id, customPassword);
      if (res.success) {
        setResetResult({
          success: true,
          userId: selectedUser.id,
          newPassword: res.newPassword
        });
      } else {
        setResetResult({
          success: false,
          userId: selectedUser.id,
          error: res.error || "No se pudo restablecer la clave."
        });
      }
    } catch (err: any) {
      setResetResult({
        success: false,
        userId: selectedUser.id,
        error: err.message || "Error inesperado de comunicación."
      });
    }
    setIsResetting(false);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-3xl -z-10" />

      {/* Header del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/20 p-2 rounded-lg border border-red-500/30">
            <Users className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-wide">Control de Jugadores</h2>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">
              Gestión de Accesos y Claves Extraviadas
            </p>
          </div>
        </div>

        {/* Buscador de usuarios */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar por alias o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 active:scale-95 flex items-center gap-1.5"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Buscar"}
          </button>
        </form>
      </div>

      {/* Alerta o error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-4 text-xs text-red-400 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {/* Contenedor del listado / Grid Bento */}
      {isLoading && users.length === 0 ? (
        <div className="space-y-3 py-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="border border-dashed border-white/10 p-8 rounded-2xl text-center text-white/40 text-sm">
          No se encontraron jugadores registrados.
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar max-h-[380px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-white/30 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-10">
                <th className="pb-3 pl-2">Jugador</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Rol</th>
                <th className="pb-3">Registro</th>
                <th className="pb-3 text-right pr-2">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => {
                const isSuperAdmin = u.role === 'super_admin';
                const isFounder = u.role === 'founder';
                
                return (
                  <tr key={u.id} className="text-xs hover:bg-white/[0.02] transition-colors group">
                    {/* Nombre / Alias */}
                    <td className="py-3 pl-2 font-bold text-white/90">
                      {u.display_name || "Sin Nombre"}
                    </td>
                    {/* Email */}
                    <td className="py-3 text-white/70 max-w-[150px] truncate" title={u.email || ''}>
                      {u.email || "Sin Email"}
                    </td>
                    {/* Rol */}
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        isSuperAdmin 
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                          : isFounder
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}>
                        {u.role === 'super_admin' ? 'Super Admin' : u.role === 'founder' ? 'Founder' : 'Member'}
                      </span>
                    </td>
                    {/* Fecha registro */}
                    <td className="py-3 text-white/40 text-[10px]">
                      {new Date(u.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                    {/* Botón Acción */}
                    <td className="py-3 text-right pr-2">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setResetResult(null);
                          setCustomPassword('ABCD1234');
                        }}
                        className="bg-white/5 border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 p-2 rounded-xl text-white/60 transition-all active:scale-95 inline-flex items-center gap-1.5"
                        title="Restablecer Contraseña"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider">Reset</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Restablecimiento de Contraseña (Glassmorphism Modal) */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0c0c0c] border border-white/10 rounded-3xl p-6 w-full max-w-md relative overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.15)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -z-10" />

            {/* Encabezado */}
            <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
              <div className="bg-red-500/20 p-2.5 rounded-xl border border-red-500/30 text-red-500">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-wide text-white">Resetear Clave</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">
                  Jugador: <span className="text-white/80">{selectedUser.display_name || "Sin Nombre"}</span>
                </p>
              </div>
            </div>

            {/* Contenido / Flujo */}
            {!resetResult ? (
              <div className="space-y-4">
                <div className="bg-yellow-500/5 border border-yellow-500/20 p-3.5 rounded-2xl text-xs text-yellow-500/90 leading-relaxed flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black uppercase tracking-wider block mb-1">¡Advertencia Crítica!</span>
                    Esto forzará inmediatamente un cambio de contraseña en Supabase Auth. El usuario ya no podrá ingresar con su clave anterior.
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                    Nueva Clave Temporal
                  </label>
                  <input
                    type="text"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Clave temporal"
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/60 transition-colors font-mono"
                  />
                  <span className="text-[9px] text-white/30 mt-1.5 block">
                    Por defecto se sugiere <strong>ABCD1234</strong>. Puedes cambiarla por otra clave genérica.
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                  <button
                    onClick={() => setSelectedUser(null)}
                    disabled={isResetting}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 border border-white/5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={isResetting || !customPassword.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.2)] flex items-center justify-center gap-1.5"
                  >
                    {isResetting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Reseteando...
                      </>
                    ) : (
                      "Forzar Cambio"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // Vista de Éxito / Error
              <div className="space-y-4">
                {resetResult.success ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto text-green-500 mb-3 animate-bounce">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-black uppercase tracking-wide text-green-500 mb-1">
                      ¡Cambio Exitoso!
                    </h4>
                    <p className="text-xs text-white/50 leading-relaxed max-w-xs mx-auto mb-6">
                      La contraseña de <strong>{selectedUser.display_name}</strong> ha sido actualizada en Supabase Auth Admin.
                    </p>

                    <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">Clave Provisoria</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-mono font-black text-white tracking-wider">
                          {resetResult.newPassword}
                        </span>
                        <button
                          onClick={() => handleCopyToClipboard(resetResult.newPassword || '')}
                          className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors border border-white/5"
                          title="Copiar Clave"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-500 mb-3">
                      <XCircle className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-black uppercase tracking-wide text-red-500 mb-1">
                      Error en Operación
                    </h4>
                    <p className="text-xs text-red-400/90 leading-relaxed mb-6">
                      {resetResult.error || "Ocurrió un error inesperado al restablecer la contraseña."}
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-white/5">
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setResetResult(null);
                    }}
                    className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                  >
                    Cerrar Diálogo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
