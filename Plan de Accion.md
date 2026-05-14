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
  - [!] *Limitación de Fuente:* La temporada 2026 está detectada pero el proveedor aún no ha cargado los Fixtures oficiales.
  - [x] Sincronización de marcadores en tiempo real (Supabase).
  - [x] Actualización dinámica de tablas de posiciones (FIFA).
- [x] **Hito 6.5: Sistema de Autenticación & Roles** 🔐
  - [x] **Migración a Email Real**: Registro eliminó el sistema alias→pseudo-email. Usa email real en `supabase.auth.signUp()`.
  - [x] **Formulario Mejorado**: Campo email + alias/apodo (solo registro) + sugerencia de clave DNI + validaciones + Eye toggles en ambos campos de clave.
  - [x] **Tabla `profiles`**: Creada en Supabase con campos `id`, `email`, `display_name`, `role` (`super_admin` / `founder` / `member`), RLS activo.
  - [x] **Trigger Auto-Provisioning**: `on_auth_user_created` crea perfil automáticamente en cada nuevo registro.
  - [!] *Pendiente:* Asignar `role = 'founder'` al crear una Liga (integrar en Server Action de creación de Liga).
- [ ] **Hito 7: Infraestructura & Seguridad (Shield Protocol)** 🛡️
  - [ ] Implementar **Supabase Keep-Alive** (Ping automático cada 48h).
  - [ ] Reforzar Server Actions con validación de roles en servidor (Admin/Owner).
- [ ] **Hito 8: Social & Engagement (Comunidad)** 💬
  - [ ] **Chat de Liga Realtime**: Mensajería instantánea para miembros de una liga.
  - [ ] **Social Share Kit**: Generación de tarjetas para compartir en redes.

## Current Trajectory
**Status**: Sistema de autenticación migrado a email real con tabla `profiles` y roles formales (`super_admin` / `founder` / `member`). Landing page enriquecida con íconos oficiales del medallón, sección de sorteo de camiseta argentina y elementos de navegación diferenciados por viewport. PWA con íconos propios generados desde el asset oficial. El flujo de registro y login está operativo y validado.

**Próximos Pasos:**
1. Asignar `role = 'founder'` en el Server Action de creación de Liga.
2. Inyectar llave de API-Football y apagar el "Mock Mode".
3. Reemplazar íconos PWA con versión SVG definitiva cuando esté disponible.
4. Pulir detalles visuales menores para el lanzamiento oficial.

## Squad Status
| Agent | Task | Status |
| :--- | :--- | :--- |
| Builder | Vercel Deployment Fixes | ✅ RESOLVED |
| Design Lead | Landing Page & Demo Route | ✅ VERIFIED & POLISHED |
| Integrity | Auth Email + Roles DB | ✅ COMPLETED |
| Product | Conversion Funnel + Sorteo | ✅ INTEGRATED |
| Builder | PWA Icons & Manifest | ✅ COMPLETED |
