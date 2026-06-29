# 📦 Módulos Deprecados y Respaldo Técnico (HQ)
## MundiApp26 - Historial de Módulos Removidos de la Consola Central (HQ)

Este documento sirve como registro y respaldo técnico (Code Archive) de las funcionalidades y componentes que fueron retirados del Headquarters (`/hq`) en la actualización del 29 de junio de 2026 para simplificar la interfaz y adaptarla a las nuevas decisiones de negocio.

---

## 1. 🎫 Tickets de Soporte (`SupportTicketsModule`)
* **Propósito original:** Permitir al Super Administrador recibir, visualizar y marcar como resueltos los tickets de soporte enviados por los usuarios.
* **Componente de UI:** `src/components/admin/SupportTicketsModule.tsx`
* **Lógica del Servidor Asociada:**
  - `getSupportTicketsAction` y `updateSupportTicketStatusAction` (definidas en `src/app/actions/support.ts`).
  - Las colecciones en Supabase leen/escriben de la tabla `support_tickets`.

### Código del Componente Resguardado:
```tsx
"use client";
import React, { useState, useEffect } from "react";
import { getSupportTicketsAction, updateSupportTicketStatusAction, SupportTicket } from "@/app/actions/support";
import { MessageSquare, RefreshCw, CheckCircle, Clock, Mail, User } from "lucide-react";

export function SupportTicketsModule() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpenOnly, setFilterOpenOnly] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { loadTickets(); }, []);

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
    // Renderizado Bento Grid con cabecera y listado filtrado de tickets...
  );
}
```

---

## 2. 🎁 Fábrica de Promociones (`PromoControlModule`)
* **Propósito original:** Administrar códigos promocionales autogenerados para referidos, permitiendo asociarlos a promotores o influencers y visualizar la cantidad de conversiones (usos reales en el Paywall) cruzando datos con `profiles`.
* **Componente de UI:** `src/components/admin/PromoControlModule.tsx`
* **Lógica del Servidor Asociada:**
  - `getPromoAnalyticsAction` y `generatePromoCodeAction` (definidas en `src/app/actions/promo.ts`).
  - Escribe en la tabla `promo_codes` y lee relaciones analíticas agregadas de `profiles`.

### Código del Componente Resguardado:
```tsx
"use client";
import React, { useState, useEffect } from "react";
import { Gift, Plus, Loader2, CheckCircle, AlertTriangle, Copy, Users, ChevronDown, ChevronUp } from "lucide-react";
import { getPromoAnalyticsAction, generatePromoCodeAction } from "@/app/actions/promo";

export function PromoControlModule() {
  const [analytics, setAnalytics] = useState<PromoAnalytic[]>([]);
  const [ownerNameInput, setOwnerNameInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const loadPromoAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await getPromoAnalyticsAction();
      if (res.success && res.analytics) {
        setAnalytics(res.analytics as PromoAnalytic[]);
      }
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  useEffect(() => { loadPromoAnalytics(); }, []);

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await generatePromoCodeAction(ownerNameInput.trim());
      if (res.success) {
        setOwnerNameInput("");
        await loadPromoAnalytics();
      }
    } catch (err) { console.error(err); }
    setIsSubmitting(false);
  };

  return (
    // Renderizado Bento Grid de Fabrica de Promociones con formulario de creacion y subtabla de usos...
  );
}
```

---

## 3. 🎫 Generador de Código QR para Flyer (Sección Footer de `/hq`)
* **Propósito original:** Generar un código QR en pantalla de 5cm x 5cm de alta fidelidad apuntando al dominio oficial o IP local para descargarse e imprimirse directamente sobre flyers publicitarios locales.
* **Ubicación:** Footer del archivo `src/app/hq/page.tsx`.
* **Código de Implementación:**
```tsx
const localIp = process.env.NEXT_PUBLIC_LOCAL_IP;
const qrDataUrl = localIp ? `http://${localIp}:3000` : 'https://www.mundiapp26.com';

// ...
<footer className="mt-12 pb-12 pt-8 border-t border-white/10 flex flex-col items-center">
  <div className="w-full max-w-md bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden text-center">
    <h2>Generador de QR Oficial</h2>
    <img 
      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrDataUrl)}`} 
      alt="QR Code" 
    />
  </div>
</footer>
```

---

## 4. 🔑 Generador de Tokens (Golden Pass / Access Tokens)
* **Propósito original:** En las fases iniciales de desarrollo de MundiApp26, los usuarios se registraban utilizando tokens pre-generados llamados "Golden Passes". Esta política de acceso físico fue reemplazada por la integración fluida con Mercado Pago (Founder Pass) y bypass dinámico por co-branding corporativo.
* **Estado actual:** Removido de la lógica de onboarding y de las vistas del HQ. Conservado únicamente como parte de la tabla estática `access_tokens` en la base de datos de Supabase para compatibilidad con perfiles históricos de etapa Alfa.
