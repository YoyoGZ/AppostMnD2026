
import KnockoutManager from "@/components/tournament/KnockoutManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin HQ | Gestión de Eliminatorias",
};

export default function AdminKnockoutsPage() {
  return (
    <div className="min-h-screen pt-4 md:pt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <header className="mb-12">
          <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">
            Arena <span className="text-primary">Control</span>
          </h1>
          <p className="mt-2 text-muted-foreground font-medium text-sm">
            Gestión técnica de la Fase Final. Aquí puedes auditar standings y desplegar los cruces oficiales.
          </p>
        </header>

        <KnockoutManager />
      </div>
    </div>
  );
}
