# Plan de Acción - MundiApp26 🏆

## Master Roadmap - Fase Eliminatorias & Conversión

- [x] **Hito 1: Estabilización del HQ (God Mode)**
  - [x] Gestión de Pases VIP (Fábrica de Tokens).
- [x] **Hito 2: Motor de Eliminatorias (Core)**
  - [x] Integración de Cruces Oficiales (R32 a Final).
- [x] **Hito 3: Identidad & Contexto (Brain Phase)**
  - [x] Implementación de `AuthContext` para gestión de roles global.
- [x] **Hito 4: Visual Excellence & UX**
  - [x] Victory Card (Gran Final) y optimización móvil.
- [x] **Hito 5: Fase de Conversión (Landing & Demo Mode)** 🚀
  - [x] **Landing Page Premium**: Diseño de alto impacto en `/` con Bento Grid reordenado y Disclaimer.
  - [x] **Modo Demo (Restricted Access)**: Ruta separada en `/demo` con vista previa de componentes y navegación.
  - [x] **Funnel de Venta**: Integración de CTAs y `RegistrationModal` con instrucciones reales.
  - [x] **Soporte PWA (Progresive Web App)**: Archivo manifest e instalador interactivo nativo (iOS/Android).
    - [x] **Fix de Instalación**: Service Worker registrado e iconos de respaldo configurados.
    - [x] **Íconos Oficiales**: `icon-192x192.png`, `icon-512x512.png` y `favicon.png` generados desde `logo.svg` (basado en la versión definitiva `MdApp26_ico_1.svg`). Se eliminó por completo el contorno blanco gracias a la transparencia vectorial.
  - [x] **Audit de Calidad**: Verificación visual y funcional del funnel de conversión.
  - [x] **Ícono Oficial en Landing**: Medallón `mdapp26` reemplaza al Shield genérico en navbar y disclaimer. Backdoor `/login` preservado.
  - [x] **Sección Sorteo Camiseta Argentina**: Nuevo bloque con 2 cards (imagen placeholder + texto del sorteo) antes del footer. Ancla `#sorteo` con scroll-mt.
  - [x] **Scroll Pill Desktop**: Cápsula "SORTEO 🇦🇷" pegada al borde derecho de la pantalla (Hero full-width). Solo visible en desktop (`md:`).
  - [x] **Mobile Sorteo Banner**: Mini banner `¡Hay Sorteo! ↓` visible solo en mobile (`md:hidden`), debajo del Hero.
- [x] **Hito 6: Integración Realtime API** (CONEXIÓN ESTABLECIDA) 📡
  - [x] Conexión con API-Football verificada (League ID: 1).
  - [x] Sincronización de marcadores en tiempo real (Supabase).
  - [x] Actualización dinámica de tablas de posiciones (FIFA).
  - [x] **Live Match Test (Admin HQ)**: Modal con Glassmorphism conectado al endpoint en vivo real para testear renderizado de escudos, layout numérico y traducción inteligente de estado del partido (1H -> 1T).
- [x] **Hito 6.5: Sistema de Autenticación & Roles** 🔐
  - [x] **Migración a Email Real**: Registro eliminó el sistema alias→pseudo-email. Usa email real en `supabase.auth.signUp()`.
  - [x] **Formulario Mejorado**: Campo email + alias/apodo (solo registro) + sugerencia de clave DNI + validaciones + Eye toggles en ambos campos de clave.
  - [x] **Tabla `profiles`**: Creada en Supabase con campos `id`, `email`, `display_name`, `role` (`super_admin` / `founder` / `member`), RLS activo.
  - [x] **Trigger Auto-Provisioning**: `on_auth_user_created` crea perfil automáticamente en cada nuevo registro.
- [x] **Hito 7: Infraestructura & Seguridad (Shield Protocol)** 🛡️
  - [x] **`requireRole()` Helper**: Validación de roles centralizada en `src/utils/auth/requireRole.ts`.
  - [x] **Supabase Keep-Alive**: Cron Job en `vercel.json` llama `/api/keep-alive` cada 3 días. Protegido con `CRON_SECRET`.
- [x] **Hito 8: Alertas & Retención (Push Protocol)** 🔔
  - [x] **Web Push API**: Service Worker configurado para interceptar eventos silenciosos.
  - [x] **VAPID Keys**: Llaves generadas e instaladas en entorno.
  - [x] **Base de Datos**: Tabla `push_subscriptions` creada con política RLS estricta para guardar el endpoint de cada usuario.
  - [x] **Opt-In Dinámico**: Componente inteligente `PushOptInButton` en el Dashboard que detecta el estado del permiso y bloqueos del navegador.
- [x] **Hito 9: Refactor Funnel de Conversión (One-Shot Onboarding)** 💎
  - [x] **Destrucción de Vistas Obsoletas:** Eliminar el flujo largo actual (6 pasos) y consolidar la experiencia de Onboarding.
  - [x] **Nueva Vista 1 (Registro + Bautismo):** Unificar la creación de cuenta en Supabase con el input "Nombre de tu Liga" para generar el anclaje (Endowment Effect).
  - [x] **Nueva Vista 2 (Paywall Dinámico):** Mostrar el componente de pago inmediatamente después de reservar el nombre ("La liga [Nombre] es tuya. Pagá la franquicia para activarla").
  - [x] **Mejora del Modo `/demo` (Vidriera):** Inyectar un JSON estático en los componentes reales del Dashboard. Interfaz 100% interactiva donde botones bloqueados disparan el CTA de "Comprar Founder Pass". (Mantiene intacto el Shield Protocol).
  - [x] Integración final del Webhook de Mercado Pago para procesar pagos reales.
  - [x] Reemplazar íconos PWA con versión SVG definitiva.
  - [x] **HQ Redesign & Control de Pasarela**: Remoción de la fábrica de tokens obsoleta, integración del Switch de cambio de precio en caliente ($20 vs. $50.000 ARS) y automatización del Censo Global conectado a la API de Mercado Pago en tiempo real.

## Current Trajectory
**Status**: Fase de Conversión y Pasarela de Pagos (Hito 9) COMPLETADA AL 100%. La pasarela de Mercado Pago Checkout Pro fue testeada exitosamente en Producción con dinero real. El Webhook Callback activa automáticamente la membresía "Founder" y crea la Liga en la base de datos sin fricción.

**Próximos Pasos:**
1. Desarrollo del Motor de Duelos Privados (Apuestas Peer-to-Peer).
2. Chat de Liga Realtime (Backlog).

## Squad Status
| Agent | Task | Status |
| :--- | :--- | :--- |
| Builder | One-Shot Onboarding & Guest Auth | ✅ VERIFIED & POLISHED |
| Design Lead | Demo Mode Interceptor UX | ✅ VERIFIED & POLISHED |
| Infrastructure | Web Push Service Worker | ✅ COMPLETED |
| Product | Webhook MP & Checkout Flow | ✅ VERIFIED & POLISHED |
