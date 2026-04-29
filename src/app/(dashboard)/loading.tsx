import { Loader2 } from "lucide-react";

/**
 * Loading state global para las rutas del dashboard.
 * Se muestra automáticamente por Next.js Suspense durante la navegación.
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {/* Skeleton Bento Grid */}
      <div className="w-full max-w-4xl space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="space-y-3">
          <div className="h-8 w-64 bg-white/5 rounded-xl" />
          <div className="h-4 w-40 bg-white/5 rounded-lg" />
        </div>

        {/* Cards skeleton grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/5 bg-card-body/20 p-6 space-y-4"
            >
              <div className="h-4 w-24 bg-white/5 rounded-lg" />
              <div className="flex justify-between items-center">
                <div className="h-6 w-32 bg-white/5 rounded-lg" />
                <div className="h-10 w-12 bg-white/5 rounded-md" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-6 w-28 bg-white/5 rounded-lg" />
                <div className="h-10 w-12 bg-white/5 rounded-md" />
              </div>
              <div className="h-10 w-full bg-white/5 rounded-xl" />
            </div>
          ))}
        </div>
      </div>

      {/* Spinner overlay sutil */}
      <div className="fixed bottom-8 right-8 flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-full shadow-2xl">
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
          Cargando
        </span>
      </div>
    </div>
  );
}
