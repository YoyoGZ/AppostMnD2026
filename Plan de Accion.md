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
  - [x] **Live Hub (En Vivo)**: Módulo de visualización en vivo para el usuario final. Permite abrir una tarjeta de partido en tiempo real con marcadores, goles y eventos en vivo mediante suscripciones realtime de Supabase y notificaciones push.
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
  - [ ] **Despliegue Masivo Push**: Lanzar alertas.
- [x] **Hito 11: Cartel de Bienvenida a Founders & Sorteo Camiseta** 🇦🇷 *(Verificado y Pulido)*
  - [x] Cálculo dinámico de número de liga global y verificación de metadatos en `layout.tsx`.
  - [x] Creación de componente `WelcomeSorteoModal.tsx` with estética Bento Glassmorphic y botón dorado.
  - [x] Integración y persistencia en Supabase Auth.
  - [x] Exclusión corporativa en caliente (Raffle Exclusion) en el onboarding e inmunidad en sorteo del HQ (`runRaffleAction`).
  - [x] Marca de agua colosal en backdrop con logo difuminado y opacidad ultra-sutil para profundidad 3D.
- [x] **Hito 12: Co-Branding & Cromática de Marcas Blancas (Hy Brokers)** 🏢💎
  - [x] **Corrección del Logotipo**: Corrección del asset del logo de Hy Brokers a `/assets/brands/hy-logo.png` en `brand-themes.json`.
  - [x] **Rediseño Cromático**: Sustitución del fondo blanco plano roto por un degradado elegante de azul noche a negro corporativo.
  - [x] **Optimización de Interfaz (Desktop & Mobile)**: Unificación del título de ligas a "Acciones", eliminación de nombres duplicados de liga en celulares, y select premium con mayor padding.
  - [x] **Volumen y Escala de Marca Responsiva**: Transición de contenedor cuadrado a maquetación elástica rectangular (`w-28 h-10` en móvil, `w-36 h-10` en Desktop) con filtro solar `brightness-115` y `drop-shadow` de color de acento de marca con opacidad del 80%, dotándole de un volumen colosal.
  - [x] **Invitaciones Inteligentes en Redes (WhatsApp OG Link)**: Integración de metadatos dinámicos asíncronos (`generateMetadata`) en `/join/[code]` para que WhatsApp renderice una hermosa preview con título, descripción explicativa de la liga y logo dorado oficial, eliminando el "limbo informativo" de compartir enlaces.
  - [x] **Instrucciones UX de Invitación**: Redacción instruccional interactiva en el alert/prompt de unión de liga, guiando al usuario a copiar y pegar su código.
  - [x] **Accesibilidad Outdoor**: Contraste elevado y peso tipográfico intenso en la pantalla de Eliminatorias, y descompresión de celdas a w-16 en Standings (Duelos y Puntos).
  - [x] **Robustecimiento Multimarca**: Incorporación del tema completo de Accenture en la configuración estática.

- [x] **Hito 13: Páginas Legales, Soporte HQ y Capacidad Corporativa** ⚖️📞🔒
  - [x] **Metadatos OG Globales**: Incorporación de meta tags rich-graph en `layout.tsx` para mejorar el SEO y las previsualizaciones de la Landing.
  - [x] **Páginas Legales**: Creación de `/terms` y `/privacy` con estructura Bento, cubriendo el disclaimer de apuestas no-monetarias y política de cookies de rendimiento/técnicas (sin trackers publicitarios).
  - [x] **Formulario de Soporte**: Creación de `/support` con formulario interactivo y la Server Action `createSupportTicketAction` para persistencia en Supabase.
  - [x] **Bandeja de Tickets en HQ**: Módulo `SupportTicketsModule` integrado en `/hq` para auditar, filtrar y marcar como resueltos los tickets de soporte.
  - [x] **Límite de 10 Miembros Corporativos**: Lógica en `joinLeagueAction` y `getLeagueByInvite` para calcular la capacidad y bloquear el acceso si una liga Marca Blanca excede los 10 participantes (1 Capitán + 9 invitados).
  - [x] **UI Preventiva**: Bento card roja e inhabilitación de formularios en `/join/[code]` si el límite está al 100%.
  - [x] **Scripts de Aprovisionamiento y Siembra**: Desarrollo de scripts locales robustos con bypass SSL/WS para poblar ligas de prueba (`seed-members-test.js`).

## 🛡️ Políticas de Datos y Decisiones de Arquitectura

***Erradicación Total de Mocks y Simulaciones (2026-06-13)**:

 Debido a colisiones de lógica y corrupción silenciosa de datos en la tabla de posiciones y el Oráculo durante el transcurso real de la Copa del Mundo 2026, se determinó eliminar de forma permanente todo el sistema de generación/inyección de datos mock y simulaciones artificiales del `SportsSyncAgent` y paneles administrativos. La base de datos de producción es 100% sagrada y debe alimentarse única y exclusivamente de la API real.

## Current Trajectory

**Status**:

Hito 13 & Estabilización de Fixture **VERIFIED & POLISHED** localmente.

  **Corregido el orden cronológico y de jornadas en `/matches` y Dashboard.
  **Base de datos de Supabase saneada (limpieza de datos de prueba) y re-hidratada automáticamente con los resultados oficiales reales de   ayer (sincronizados 72 partidos de grupos).
  **El proyecto compila al 100% en producción de forma limpia (`npm run build` exitoso).

**Próximos Pasos:**
1.Diseñar e implementar el motor o flujo de respuesta a consultas de soporte directamente al correo registrado del usuario desde el panel HQ.
2. Iniciar el sprint de **Hito 10: Pruebas de Estrés & Beta Testing Masivo** cuando el usuario lo solicite.

## Squad Status

| Agent | Task | Status |
| :--- | :--- | :--- |
| Builder | Saneamiento de BD, Alineación de Fechas del Fixture y Ordenamiento de Jornadas | ✅ VERIFIED & POLISHED |
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
| Design & Infra | Hito 11: Cartel de Bienvenida & Exclusión de Marcas | ✅ VERIFIED & POLISHED |
| Design Lead | Hito 12: Co-Branding Cromática & Logotipo Hy Brokers | ✅ VERIFIED & POLISHED |
| Builder | Hito 12: Robustecimiento Multimarca (Accenture Theme) | ✅ VERIFIED & POLISHED |
| Builder | Hito 13: Páginas Legales, Soporte HQ y Capacidad Corporativa | ✅ VERIFIED & POLISHED |
