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
  - [x] **Rediseño Táctico & Minimalismo**: Fusión Bento de 'Cómo Jugar', logotipo focalizado en Hero y unificación absoluta a **MundiAPP26**.
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
  - [x] **Control de Claves Extraviadas (HQ)**: Implementación del restablecimiento manual de claves temporales mediante Supabase Auth Admin API (`updateUserById`). Módulo de control visual interactivo en `/hq` con búsqueda en caliente y copia de claves provisorias.
  - [x] **Validación de Apodos Únicos**: Verificación en tiempo de registro que evita la colisión de alias (`display_name`) duplicados en el leaderboard global y salas de chat.

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
  - [x] **Estabilización de Flujo (LT-5)**: Eliminar el bucle infinito de redirecciones al retornar del pago fallido y hacer el paywall dinámico (soporte a url limpia + creación directa a founders activos).

- [x] **Hito 9.5: Gamificación & Social Core (Duelos & Chat Realtime)** ⚔️💬
  - [x] **Motor de Duelos Privados (Apuestas Peer-to-Peer)**: Diseño de tablas `league_duels` y `duel_participants`, RLS robustas y resolución segura a través del Oráculo sin fallos N+1.
  - [x] **El Coliseo de Duelos**: Bento Grid estético en `/standings` con soporte offline y visualización de ganadores en tiempo real.
  - [x] **Chat de Liga en Tiempo Real**: Panel lateral Drawer en el Shell integrado a los canales de Supabase Realtime para interacción instantánea y trash-talk.

- [x] **Hito 9.7: Purificación del Censo de Ventas & Saneamiento TypeScript** 🛡️💸
  - [x] **Cruce Atómico de Ventas**: Conexión cruzada en caliente entre la API de Mercado Pago y la tabla `profiles` en Supabase para erradicar el 100% de transacciones fantasmas ajenas a la app.
  - [x] **Filtros Temporales y de Producto**: Descarte de cobros huérfanos anteriores al lanzamiento del proyecto (`2026-05-01`) y validación de descripciones de producto.
  - [x] **Saneamiento TypeScript**: Limpieza exhaustiva de errores de tipado implícito (`noImplicitAny`) en el componente de login y flujo de onboarding.
  - [x] **Manual de Operaciones del HQ**: Compilación de la guía oficial de administración del HQ en `/docs/hq-admin-manual.md` con diagramas de flujo y bypass.

- [x] **Hito 9.9: Sistema de Códigos Promocionales & Afiliados** 🎁📈
  - [x] **Esquema de Base de Datos**: Migración SQL (`promo-codes.sql`) ejecutada con RLS activado y permisos restringidos.
  - [x] **Server Actions**: Validación reactiva (`validatePromoCodeAction`), persistencia en caliente (`savePromoCodeToProfileAction`), fábrica de 8 dígitos únicos (`generatePromoCodeAction`) y agregación analítica grupal en memoria libre de bucles N+1.
  - [x] **Funnel del Paywall**: Campo sutil con debounce de 600ms, validación interactiva sin término "Embajador" de cara al usuario final y guardado inmediato a prueba de fallos de pasarela.
  - [x] **Centro de Mando (HQ)**: Módulo Bento interactivo con control del promotor, copiado veloz y visor acordeón de correos/alias referidos.

- [ ] **Hito 10: Pruebas de Estrés & Beta Testing Masivo** 🧪 *(Próximo Sprint)*
  - [ ] **Simulación Concurrente de Pagos**: Activar el Switch a $20 ARS en el HQ y lanzar una convocatoria privada con 15-20 beta-testers reales. Evaluar velocidad del Webhook, creación automática de ligas y despliegue del historial en el Censo Global en vivo.
  - [ ] **Stress Test de Tabla de Posiciones**: Forzar la inyección masiva de resultados (a través de "Sync Agent" en el HQ) con 50+ usuarios conectados de forma concurrente en `/dashboard` para verificar cálculo y ordenamiento de grupos.
  - [ ] **Control de Colisión SSR Lock**: Evaluar que no existan bloqueos de sesión en Supabase (validando las lecciones del incidente del candado SSR Lock Collision) durante el guardado intensivo de predicciones en listas de partidos activos.
  - [ ] **Despliegue Masivo Push**: Lanzar alertas de goles y cambio de estado de partidos en background desde el HQ hacia todos los dispositivos suscritos para verificar la reactividad y retención del Service Worker.

## Current Trajectory
**Status**: Sistema de Códigos Promocionales y Afiliados para **MundiAPP26** **VERIFIED & POLISHED** localmente en el workspace. Se consolidaron con total éxito todas las especificaciones de diseño y lógica de backend: persistencia síncrona en caliente del código al perfil del usuario autenticado, debounce de 600ms en la validación reactiva del Paywall bajo español coloquial argentino ("Acá ingresás el código"), fábrica atómica de generación de códigos únicos de 8 dígitos libre de caracteres confusos, e inspector de auditoría detallado en formato acordeón para monitorear Alias y correos electrónicos de los referidos directamente en el HQ.

**Próximos Pasos:**
1. **Despliegue a Producción**: Realizar el push del código a GitHub para disparar el despliegue automático en Vercel.
2. **Sesión de Pruebas de Estrés y Beta Testing Masivo** (Hito 10) utilizando el valor de prueba a $20 ARS en Mercado Pago.
3. Desplegar logos definitivos de marcas en `public/assets/brands/`.

## Squad Status
| Agent | Task | Status |
| :--- | :--- | :--- |
| Builder | Sistema de Afiliados, Fábrica de Códigos en HQ & Onboarding | ✅ VERIFIED & POLISHED |
| Builder | Refinamientos de Fair Play y remoción de 5ª card Bento | ✅ VERIFIED & POLISHED |
| Builder | Co-Branding Bypass & Onboarding | ✅ VERIFIED & POLISHED |
| Design Lead | Mobile Navbar Colors & Welcome Toast | ✅ VERIFIED & POLISHED |
| Infrastructure | Context Proviser Global & SSR Lock Resolution | ✅ VERIFIED & POLISHED |
| Product | Purificación de Ventas & Censo Cruzado | ✅ VERIFIED & POLISHED |
| Builder | Saneamiento TypeScript & Manual HQ | ✅ VERIFIED & POLISHED |
| Infrastructure | Web Push Service Worker | ✅ COMPLETED |
| Product | Webhook MP & Checkout Flow | ✅ VERIFIED & POLISHED |
| Builder | Peer-to-Peer Duelos Motor & UI | ✅ VERIFIED & POLISHED |
| Design Lead | Chat de Liga Realtime Panel | ✅ VERIFIED & POLISHED |
