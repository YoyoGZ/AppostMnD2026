# Flujo Integral de la Aplicación - MundiApp26 🏆

Este documento detalla el "Customer Journey" y la arquitectura funcional de la plataforma. Diseñado para auditoría de producto y alineación técnica.

---

## 1. Etapa de Atracción & Conversión (Landing & Paywall)
 
### El Punto de Entrada
*   **Flujo**: El usuario llega a `/`. Se encuentra con una propuesta visual de alto impacto (Glassmorphism + Bento Grid).
*   **Acciones**: 
    *   Ver la propuesta de valor.
    *   Explorar la **Demo** (`/demo`) para ver la interfaz sin registrarse (simula el coliseo de duelos y dashboard).
    *   Registrarse/Entrar a través del `RegistrationModal` introduciendo su Email Real (eliminando pseudoEmails obsoletos para asegurar la recuperación de cuentas).
*   **Archivos Clave**:
    *   `src/app/page.tsx` (Estructura Landing).
    *   `src/components/landing/LandingWrapper.tsx` (Contenedor visual).
    *   `src/components/landing/RegistrationModal.tsx` (Funnel de conversión).

### El Funnel de Conversión One-Shot & Pasarela de Pagos
*   **Flujo**: Al registrarse, el usuario define el nombre de su futura Liga y es redirigido de forma atómica a la pasarela de cobro real (**Mercado Pago Checkout Pro**).
*   **Pasarela & Webhook**: Una vez procesado el pago real en producción, un webhook seguro y atómico en el backend (`/api/webhooks/mercadopago`) asciende al usuario al rol de `founder` y activa su arena, evitando fraudes y saltos de paywall.
*   **Archivos Clave**:
    *   `src/components/auth/LoginShield.tsx` (Intercepción y redirección al Paywall).
    *   `src/app/actions/payments.ts` (Generación de preferencia de pago con URL dinámica de Vercel).
    *   `src/app/api/webhooks/mercadopago/route.ts` (Procesador del Webhook).

### El Sistema de Invitación
*   **Flujo**: Si el usuario llega con un link de invitación dedicado (`/join/[code]`), el sistema lo identifica, personaliza el onboarding mostrando el nombre de la liga anfitriona y automatiza su ingreso como `member` tras registrarse con su correo real.
*   **Archivos Clave**:
    *   `src/app/join/[code]/page.tsx` (Ruta dedicada indestructible contra redirecciones de middleware).
    *   `src/components/landing/JoinClient.tsx` (Formulario unificado para invitados).

---

## 2. El Corazón del Usuario (Dashboard & Pronósticos)

### Vista General (Home del Jugador)
*   **Flujo**: Al entrar en `/dashboard`, el usuario ve el estado actual de los Grupos y los próximos partidos relevantes.
*   **Acciones**: 
    *   Navegar entre grupos (A-L).
    *   Consultar la tabla de posiciones en tiempo real.
    *   Realizar pronósticos en partidos activos.
*   **Archivos Clave**:
    *   `src/app/(dashboard)/dashboard/page.tsx` (Página principal).
    *   `src/components/tournament/GroupsCarousel.tsx` (Navegación de grupos).
    *   `src/components/tournament/MatchPredictionCard.tsx` (Lógica de guardado de resultados).
    *   `src/components/tournament/StandingsClient.tsx` (Renderizado de tablas).

### La Batalla: Fase Eliminatoria (Knockouts)
*   **Flujo**: En `/knockouts`, el usuario visualiza el bracket interactivo desde Dieciseisavos hasta la Final.
*   **Acciones**: Visualizar cruces, ver quién avanza y (próximamente) pronosticar el campeón.
*   **Archivos Clave**:
    *   `src/app/(dashboard)/knockouts/page.tsx` (Contenedor).
    *   `src/components/tournament/KnockoutBracket.tsx` (Visualización del árbol).

---

## 3. El Rol del Fundador (Capitán de Liga)

### Gestión de Liga
*   **Flujo**: Un usuario que entró vía **VIP Pass** tiene privilegios de "Owner".
*   **Acciones**: 
    *   Personalizar el nombre de su Liga.
    *   Generar invitaciones para sus amigos.
    *   Configurar reglas específicas (Modals de reglas).
*   **Archivos Clave**:
    *   `src/components/tournament/TournamentCard.tsx` (Header de Liga).
    *   `src/app/actions/leagues.ts` (Lógica de creación y edición).

---

## 4. Administración Central (God Mode / HQ)

### El Puesto de Mando (`/hq`)
*   **Flujo**: Acceso restringido para el Super Administrador (Tú).
*   **Acciones**: 
    *   **Fábrica de Pases**: Generar links VIP para nuevos Fundadores.
    *   **Sync Agent**: Inyectar resultados reales o simulados a la base de datos global.
    *   **Control de Eliminatorias**: Decidir quién avanza en el bracket oficial.
*   **Archivos Clave**:
    *   `src/app/hq/page.tsx` (Panel central).
    *   `src/app/actions/admin.ts` (Funciones de generación de tokens).
    *   `src/app/actions/sync.ts` (Motor de sincronización con la API).

---

## 5. Perfil y Personalización (`/profile`)

*   **Flujo**: Espacio personal del usuario.
*   **Acciones**: Ver medallas ganadas, historial de aciertos y cerrar sesión.
*   **Archivos Clave**:
    *   `src/app/(dashboard)/profile/page.tsx`.

---

## 6. Sistema de Notificaciones Realtime (Notificaciones Push Web)
 
*   **Flujo**: El usuario puede activar las notificaciones desde el Dashboard mediante un Opt-in estético con micro-animaciones.
*   **Arquitectura**:
    *   **Registro**: Captura del token de suscripción de Web Push y persistencia en la tabla `push_subscriptions` vinculada al `user_id`.
*   **Service Worker**: El script `sw.js` (y `firebase-messaging-sw.js` en producción) intercepta los payloads push emitidos por el servidor, los muestra nativamente en dispositivos móviles/desktop y maneja redirecciones inteligentes a partidos y chats.
*   **Archivos Clave**:
    *   `public/sw.js` (Interceptor en segundo plano).
    *   `src/app/actions/push.ts` (Servicio de almacenamiento de tokens).
    *   `src/components/dashboard/PushOptIn.tsx` (Componente UX de suscripción).

---

## 7. Mapa de Seguridad, Datos & PWA (Shield Protocol)

*   **Autenticación**: Gestionada por `AuthContext.tsx` con Supabase Auth e inicios de sesión estrictamente basados en Email Real y contraseña, eliminando la deuda técnica de los pseudo-correos de invitados.
*   **Seguridad de Acceso (Shield Protocol)**: Validaciones del lado del servidor mediante Server Actions y comprobaciones de roles (`founder` / `member`) directamente sobre la base de datos de Supabase, bloqueando accesos no autorizados a páginas seguras.
*   **PWA de Alta Fidelidad**: Totalmente instalable desde dispositivos móviles. Se erradicó el contorno blanco de los iconos mediante el uso de la versión definitiva del logo vectorial (`public/logo.svg`), regenerando los assets PNG (`icon-192x192.png`, `icon-512x512.png`, `favicon.png`) de manera impecable y transparente.
*   **Persistencia**: Supabase (Tablas `matches`, `predictions`, `leagues`, `league_members`, `league_duels`, `duel_participants`, `push_subscriptions`).

---

## 8. Backlog & Siguientes Pasos
1.  **Motor de Duelos Privados (Peer-to-Peer) ⚔️**: El coliseo interactivo para apostar cara a cara con amigos en partidos individuales de la Copa del Mundo.
2.  **Chat en Tiempo Real de Liga 💬**: Canal de Supabase Realtime para dinamizar la interacción social entre gladiadores de la misma liga.
3.  **Social Sharing Kit**: Generar y compartir capturas estéticas de la tabla de posiciones directamente en redes sociales.

---
**Documento actualizado por Antigravity Engine - 2026**
