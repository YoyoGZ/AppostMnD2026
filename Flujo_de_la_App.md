# Flujo Integral de la Aplicación - Mundial 2026 🏆

Este documento detalla el "Customer Journey" y la arquitectura funcional de la plataforma. Diseñado para auditoría de producto y alineación técnica.

---

## 1. Etapa de Atracción & Conversión (Landing)

### El Punto de Entrada
*   **Flujo**: El usuario llega a `/`. Se encuentra con una propuesta visual de alto impacto (Glassmorphism + Bento Grid).
*   **Acciones**: 
    *   Ver la propuesta de valor.
    *   Explorar la **Demo** (`/demo`) para ver la interfaz sin registrarse.
    *   Registrarse/Entrar a través del `RegistrationModal`.
*   **Archivos Clave**:
    *   `src/app/page.tsx` (Estructura Landing).
    *   `src/components/landing/LandingWrapper.tsx` (Contenedor visual).
    *   `src/components/landing/RegistrationModal.tsx` (Funnel de conversión).

### El Sistema de Invitación
*   **Flujo**: Si el usuario llega con un link de invitación (`/?invite=CODE`), la Landing personaliza el mensaje mostrando el nombre de la Liga a la que se unirá.
*   **Acciones**: Unión automática a la liga tras el registro.
*   **Archivos Clave**:
    *   `src/app/actions/leagues.ts` (Función `getLeagueByInvite`).

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

## 6. Oportunidades de Mejora e Integraciones Sugeridas

Como **Senior Product Engineer**, detecto estas áreas para potenciar el producto:

1.  **Notificaciones Push (Alertas de Gol)**: 
    *   Aprovechar el `sw.js` que ya instalamos para enviar alertas al móvil cuando un partido sincronizado por la API cambie de marcador.
2.  **Social Sharing Kit**: 
    *   Generar un botón "Compartir mi Tabla" que cree una imagen dinámica para Instagram/WhatsApp con la posición del usuario en su Liga.
3.  **Real-time Chat de Liga**:
    *   Integrar un canal de Supabase Realtime para que los miembros de una misma Liga puedan "picarse" o charlar sobre los resultados dentro del Dashboard.
4.  **Gráfica de Performance**:
    *   En el Perfil, mostrar una línea de tiempo con la evolución de puntos del usuario.

---

## 7. Mapa de Seguridad & Datos

*   **Autenticación**: Gestionada por `AuthContext.tsx` usando Supabase Auth.
*   **Persistencia**: Supabase (Tablas de `matches`, `predictions`, `leagues`, `profiles`).
*   **PWA**: Instalable desde el Dashboard gracias a `InstallAppButton.tsx` y `sw.js`.

---
**Documento generado por Antigravity Engine - 2026**
