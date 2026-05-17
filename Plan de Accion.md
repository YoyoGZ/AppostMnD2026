# Plan de Acción - Mundial 2026 🏆

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
    - [x] **Íconos Oficiales**: `icon-192x192.png`, `icon-512x512.png` y `favicon.png` generados desde `mdapp26_ico.jpeg` con fondo negro. Manifest y layout actualizados. Script `scripts/generate-icons.mjs` disponible para regenerar.
    - [!] *Pendiente visual:* Reemplazar íconos con versión SVG definitiva cuando esté disponible (bordes del medallón aún muestran contorno blanco en PNG).
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
- [ ] **Hito 9: Monetización & Visual Polish** 💎
  - [ ] Integración final del Webhook de Mercado Pago para procesar pagos reales.
  - [ ] Pulido general de la Interfaz Visual y optimización de experiencia (UX) en el flujo de registro.
  - [ ] Reemplazar íconos PWA con versión SVG definitiva.

## Current Trajectory
**Status**: Hitos 6, 7 y 8 completados de manera exitosa. Las notificaciones Push (opt-in y guardado de tokens) ya funcionan en la base de datos de producción (Supabase) superando las restricciones de incógnito y Chrome. El modal de API en vivo confirmó que la conexión y el parseo de datos (incluyendo dominios de imágenes) son estables y resisten pantallas AMOLED.

**Próximos Pasos (Próxima Sesión):**
1. Pulido general en las visuales y en el flujo del registro.
2. Integración total y final del Webhook de Mercado Pago.
3. Chat de Liga Realtime (Backlog).

## Squad Status
| Agent | Task | Status |
| :--- | :--- | :--- |
| Builder | Live API Test & Server Actions | ✅ VERIFIED & POLISHED |
| Design Lead | AMOLED Color Fix & Opt-In UX | ✅ VERIFIED & POLISHED |
| Infrastructure | Web Push Service Worker | ✅ COMPLETED |
| Product | Webhook MP & Visual Polish | ⏳ PENDING |
