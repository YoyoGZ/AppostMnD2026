# Flujo Integral de la Aplicación - MundiApp26 🏆

Este documento detalla el "Customer Journey" y la arquitectura funcional de la plataforma. Diseñado para auditoría de producto y alineación técnica.

---

## 1. Etapa de Atracción & Conversión (Landing & Paywall)

### El Punto de Entrada

- **Flujo**: El usuario llega a `/`. Se encuentra con una propuesta visual de alto impacto (Glassmorphism + Bento Grid).
- **Acciones**:
    - Ver la propuesta de valor.
    - Explorar la **Demo** (`/demo`) para ver la interfaz sin registrarse (simula el coliseo de duelos y dashboard).
    - Registrarse/Entrar a través del `RegistrationModal` introduciendo su Email Real (eliminando pseudoEmails obsoletos para asegurar la recuperación de cuentas).
- **Archivos Clave**:
    - `src/app/page.tsx` (Estructura Landing).
    - `src/components/landing/LandingWrapper.tsx` (Contenedor visual).
    - `src/components/landing/RegistrationModal.tsx` (Funnel de conversión).

### El Funnel de Conversión One-Shot & Pasarela de Pagos

- **Flujo**: Al registrarse, el usuario define el nombre de su futura Liga y es redirigido de forma atómica a la pasarela de cobro real (**Mercado Pago Checkout Pro**) para adquirir su **Founder Pass** de **$5.000 ARS** (o $20 ARS en modo test).
- **Pasarela & Webhook**: Una vez procesado el pago real en producción, un webhook seguro y atómico en el backend (`/api/webhooks/mercadopago`) asciende al usuario al rol de `founder` y activa su arena, incrementando su slot de ligas (`max_leagues`), lo que evita fraudes y saltos de paywall de forma resiliente.
- **Archivos Clave**:
    - `src/components/auth/LoginShield.tsx` (Intercepción y redirección al Paywall).
    - `src/app/actions/payments.ts` (Generación de preferencia de pago con URL base autodetectada y parametrización de invitados).
    - `src/app/paywall/page.tsx` (Checkout de cobro a $5.000 ARS con persistencia de liga y bypass para Founders activos).
    - `src/app/api/webhooks/mercadopago/route.ts` (Procesador del Webhook transaccional).

### Sistema de Códigos Promocionales (Afiliados)

- **Flujo**: Durante el Paywall, el usuario final cuenta con un campo opcional y minimalista para ingresar un Código de Promoción. El sistema valida el código en caliente mediante un **debounce de 600ms** contra Supabase. Al ser validado con éxito, se muestra un mensaje interactivo en español coloquial (`✓ Codigo de Promoción Aceptado !`) y **se asocia inmediatamente en caliente** el código al perfil del usuario (`profiles.referred_by_code`) de forma síncrona. Esto blindará la referencia contra cancelaciones o fallos de pago en Mercado Pago.
- **Archivos Clave**:
    - `src/app/actions/promo.ts` (Validación y guardado síncrono).
    - `src/app/paywall/page.tsx` (Campo minimalista integrado al Checkout).

### El Sistema de Invitación (Pivot de Invitado de Pago & Bento Grid)

- **Flujo**: Si el usuario llega con un link de invitación dedicado (`/join/[code]`), el sistema utiliza un bypass de RLS del lado del servidor para consultar la base de datos de manera anónima y mostrar la tarjeta de bienvenida con el alias del capitán fundador.
  - **Identificación**: Si el código no existe o es inválido, en lugar de una redirección ciega, se renderiza una pantalla de error glassmorphic en español muy pulida.
  - **Bento Grid de Captación**: Si el código es válido, se presenta un Bento Grid responsivo de alta fidelidad con el logo oficial (`/assets/logo_oficial.png`), la bienvenida personalizada a la liga del capitán, y las características exclusivas de MundiApp26 (Oráculo en tablas de posiciones, chat en vivo y duelos). La card de sorteo se excluye en este flujo por ser un beneficio exclusivo de Founders.
  - **Bypass de Tarifas Corporativas (Marca Blanca)**: Si la invitación es para una liga corporativa (`isCorporate: true`), la interfaz oculta de forma preventiva toda leyenda de cobro de $5.000 ARS y Mercado Pago. El flujo redirige a una confirmación directa de ingreso patrocinada por la organización sin pasar por la pasarela de pagos.
  - **Límite de Capacidad Corporativa Híbrido**: Solo en el caso de ligas asociadas a marcas corporativas, se aplica un límite de capacidad estricto de **10 participantes** (1 Capitán + 9 invitados). Al alcanzar ese número:
    - **Frontend (Pre-emptive Block)**: Se renderiza una Bento Card roja prominente detallando el límite excedido y se deshabilita por completo el formulario de registro rápido y el botón de unión.
    - **Backend**: La acción `joinLeagueAction` valida la capacidad en el servidor antes de realizar cualquier mutación, devolviendo un error e impidiendo inscripciones concurrentes no deseadas.
  - **Funnel descentralizado**: En ligas normales (gratuitas con pases individuales), al presionar registrarse, el invitado crea su cuenta en Supabase Auth y es redirigido de inmediato al **Paywall de Invitado exclusivo** (`/paywall?join=[code]`) para adquirir su membresía individual de **$5.000 ARS** en Mercado Pago.
  - **Doble Lógica de Éxito**: Tras el pago exitoso (o unión directa en ligas corporativas), la aplicación procesa la Server Action `joinLeagueAction` para insertar de forma segura al miembro en la liga de su amigo y redireccionarlo al Dashboard listo para jugar.
- **Archivos Clave**:
    - `src/app/join/[code]/page.tsx` (Ruta protegida, render de cabecera con logo, error glassmorphic y resolución de metadatos de Marca Blanca).
    - `src/app/join/[code]/JoinClient.tsx` (Bento Grid responsivo, lógica de bloqueo de capacidad corporativa e inhabilitación de formularios).
    - `src/app/actions/leagues.ts` (Bypass RLS `getLeagueByInvite` con conteo de capacidad y validación de unión `joinLeagueAction` con límite de 10 participantes exclusivo para corporativos).
    - `src/app/api/callbacks/mp-success/route.ts` (Callback transaccional que recibe el parámetro `join` e inscribe al gladiador tras el cobro).

### Páginas Legales & Soporte Técnico (Institucional)

- **Flujo**: El usuario puede acceder desde el footer de la landing o el dashboard a las páginas de términos, privacidad y soporte técnico.
  - **Términos y Condiciones (`/terms`)**: Declaración solemne del aviso de Fair Play (la app es ajena a la intermediación o fomento de apuestas por dinero real) y el uso de cookies estrictamente técnicas y de rendimiento.
  - **Política de Privacidad (`/privacy`)**: Detalle sobre el almacenamiento del correo electrónico y el rechazo de rastreadores publicitarios externos o cookies de marketing de terceros.
  - **Formulario de Soporte (`/support`)**: Componente cliente que autocompleta el correo y alias del usuario activo. Al enviar un mensaje, se invoca `createSupportTicketAction` para registrar atómicamente el ticket en la tabla `support_tickets` de Supabase con estado `open` y prioridad calculada.
  - **Bandeja de Entrada HQ (`/hq`)**: El módulo interactivo `SupportTicketsModule.tsx` permite al Super Administrador visualizar en tiempo real los tickets, filtrarlos por estado y marcarlos como resueltos (`resolved`).
- **Archivos Clave**:
    - `src/app/terms/page.tsx` y `src/app/privacy/page.tsx` (Vistas Bento con Glassmorphism para las políticas legales).
    - `src/app/support/page.tsx` y `src/app/support/SupportClientForm.tsx` (Formulario de soporte reactivo con feedback inmediato).
    - `src/components/admin/SupportTicketsModule.tsx` (Bandeja de administración integrada en el HQ).
    - `src/app/actions/support.ts` (Acciones del servidor `createSupportTicketAction` y `resolveSupportTicketAction`).

---

## 2. El Corazón del Usuario (Dashboard & Pronósticos)

### Vista General (Home del Jugador)

- **Flujo**: Al entrar en `/dashboard`, el usuario ve el estado actual de los Grupos y los próximos partidos relevantes.
- **Acciones**:
    - Navegar entre grupos (A-L).
    - Consultar la tabla de posiciones en tiempo real.
    - Realizar pronósticos en partidos activos.
- **Archivos Clave**:
    - `src/app/(dashboard)/dashboard/page.tsx` (Página principal).
    - `src/components/tournament/GroupsCarousel.tsx` (Navegación de grupos).
    - `src/components/tournament/MatchPredictionCard.tsx` (Lógica de guardado de resultados).
    - `src/components/tournament/StandingsClient.tsx` (Renderizado de tablas).

### La Batalla: Fase Eliminatoria (Knockouts)

- **Flujo**: En `/knockouts`, el usuario visualiza el bracket interactivo desde Dieciseisavos hasta la Final.
- **Acciones**: Visualizar cruces, ver quién avanza y (próximamente) pronosticar el campeón.
- **Archivos Clave**:
    - `src/app/(dashboard)/knockouts/page.tsx` (Contenedor).
    - `src/components/tournament/KnockoutBracket.tsx` (Visualización del árbol).

---

## 3. El Rol del Fundador (Capitán de Liga)

### Gestión de Liga & Crecimiento Viral Ilimitado

- **Flujo**: Un usuario que activó su arena vía **Founder Pass** (comprado en Mercado Pago) tiene privilegios de "Capitán/Owner".
- **Acciones & Reglas**:
    - **Capacidad Infinita**: Se eliminó el límite de 10 participantes por liga; ahora la liga admite participantes de forma **infinita y sin topes** para potenciar la viralidad del juego.
    - **Regla del Sorteo de la Camiseta 🇦🇷**: Para calificar de forma válida al sorteo de la camiseta oficial de la selección argentina (confeccionado en el HQ), el Founder debe reclutar de forma activa a **al menos 2 invitados activos (pagados)**. Esto garantiza el compromiso de juego y rentabilidad de la arena.
    - Personalizar el nombre de su Liga Privada.
    - Generar y compartir enlaces de invitación adaptativos (`/join/[code]`).
    - Configurar reglas específicas (Modals de reglas).
- **Archivos Clave**:
    - `src/components/tournament/TournamentCard.tsx` (Header de la Liga).
    - `src/app/actions/leagues.ts` (Lógica de creación de ligas, guardado de capitán, unión ilimitada y bypass RLS).
    - `src/app/actions/admin.ts` (Cruce de base de datos en memoria para validar la elegibilidad de sorteo del Founder con +2 invitados activos).

---

## 4. Administración Central (God Mode / HQ)

### El Puesto de Mando (`/hq`)

- **Flujo**: Acceso restringido con RLS y validación de rol del lado del servidor para el Super Administrador (Tú).
- **Acciones**:
    - **Control de Pasarela (Modo Test)**: Switch interactivo con Optimistic UI para alternar el valor del Founder Pass en caliente entre $20 (Sandbox) y $50.000 (Producción) guardado en la tabla `app_settings` de Supabase.
    - **Fábrica de Promociones**: Formulario Bento para generar atómicamente códigos promocionales de 8 caracteres alfanuméricos únicos asignados a un promotor (amigo/compañero) con copia veloz a portapapeles.
    - **Censo y Auditoría de Referidos**: Tabla analítica en tiempo real que reporta los códigos activos, sus creadores y la cantidad de usos en caliente en el Paywall. Incluye un acordeón interactivo (inspector desplegable) para listar los Alias y correos de las personas que usaron cada código.
    - **Censo Global de Ventas**: Conexión nativa con la API de Mercado Pago (`/v1/payments/search`) para buscar, listar y conciliar cobros reales en producción de forma instantánea.
    - **Sync Agent**: Inyectar resultados de fase de grupos simulados a la base de datos global.
    - **Control de Eliminatorias**: Decidir quién avanza en el bracket oficial.
- **Archivos Clave**:
    - `src/app/hq/page.tsx` (Panel central rediseñado sin tokens obsoletos).
    - `src/components/admin/PromoControlModule.tsx` (Componente de control de promociones).
    - `src/app/actions/admin.ts` (Lectura/escritura de settings y fetch en vivo de Mercado Pago).
    - `src/app/actions/promo.ts` (Lógica e inyección de datos de afiliados).
    - `src/app/actions/sync.ts` (Motor de Sincronización y simulación de partidos).

---

## 5. Perfil y Personalización (`/profile`)

- **Flujo**: Espacio personal del usuario.
- **Acciones**: Ver medallas ganadas, historial de aciertos y cerrar sesión.
- **Archivos Clave**:
    - `src/app/(dashboard)/profile/page.tsx`.

---

## 6. Sistema de Notificaciones Realtime (Notificaciones Push Web)

- **Flujo**: El usuario puede activar las notificaciones desde el Dashboard mediante un Opt-in estético con micro-animaciones.
- **Arquitectura**:
    - **Registro**: Captura del token de suscripción de Web Push y persistencia en la tabla `push_subscriptions` vinculada al `user_id`.
    - **Service Worker**: El script `sw.js` (y `firebase-messaging-sw.js` en producción) intercepta los payloads push emitidos por el servidor, los muestra nativamente en dispositivos móviles/desktop y maneja redirecciones inteligentes a partidos y chats.
- **Archivos Clave**:
    - `public/sw.js` (Interceptor en segundo plano).
    - `src/app/actions/push.ts` (Servicio de almacenamiento de tokens).
    - `src/components/dashboard/PushOptIn.tsx` (Componente UX de suscripción).

---

## 7. Mapa de Seguridad, Datos & PWA (Shield Protocol)

- **Autenticación**: Gestionada por `AuthContext.tsx` con Supabase Auth e inicios de sesión estrictamente basados en Email Real y contraseña, eliminando la deuda técnica de los pseudo-correos de invitados.
- **Seguridad de Acceso (Shield Protocol)**: Validaciones del lado del servidor mediante Server Actions y comprobaciones de roles (`founder` / `member`) directamente sobre la base de datos de Supabase, bloqueando accesos no autorizados a páginas seguras.
- **PWA de Alta Fidelidad**: Totalmente instalable desde dispositivos móviles. Se erradicó el contorno blanco de los iconos mediante el uso de la versión definitiva del logo vectorial (`public/logo.svg`), regenerando los assets PNG (`icon-192x192.png`, `icon-512x512.png`, `favicon.png`) de manera impecable y transparente.
- **Persistencia**: Supabase (Tablas `matches`, `predictions`, `leagues`, `league_members`, `league_duels`, `duel_participants`, `push_subscriptions`).

---

## 8. Backlog & Siguientes Pasos

1. **Fase de Pruebas Masivas y Estrés 🧪**: Ejecutar el plan de pruebas de concurrencia usando el Switch a $20 ARS en el HQ para testear el funnel con beta-testers reales.
2. **Motor de Duelos Privados (Peer-to-Peer) ⚔️**: El coliseo interactivo para apostar cara a cara con amigos en partidos individuales de la Copa del Mundo.
3. **Chat en Tiempo Real de Liga 💬**: Canal de Supabase Realtime para dinamizar la interacción social entre gladiadores de la misma liga.
4. **Social Sharing Kit**: Generar y compartir capturas estéticas de la tabla de posiciones directamente en redes sociales.

---

**Documento actualizado por Antigravity Engine - 2026**
