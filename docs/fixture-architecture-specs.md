# Arquitectura de Plataforma Social: Proyecto "Fixture Mundial 2026"

Este documento contiene las especificaciones funcionales (GDD - Game Design Document) para la evolución del Mundial 2026 Dashboard hacia una plataforma social de apuestas deportivas entre amigos.

## 1. El Sistema de Ligas (Squads)
- **Roles:** Cada liga tendrá un `Admin` creador y `Users` invitados.
- **Límites:** Máximo 10 integrantes globales por liga (incluyendo al Admin).
- **Aislamiento Social:** El grupo cuenta con un nombre rándom asignable/modificable por el Admin. Un usuario puede pertenecer a varios grupos bajo el mismo Login.

## 2. Onboarding y Autenticación Fricción Cero
- **Identity Shield (Login Simple):** El acceso se realiza mediante un Alias/Nombre único y una contraseña. Se elimina la recolección de correos electrónicos. Detrás de escena, la arquitectura transformará el 'Nombre' en un seudónimo encriptado compatible con Supabase Auth.
- **Formulario Unificado:** La interfaz no separará 'Login' de 'Registro' con complejidad; una advertencia alertará sobre la necesidad inmutable de recordar la contraseña.
- **Magic Invites:** Links autogenerados por el Admin (`/invite/[squad_id]`). El amigo que toca el link será llevado a esta pantalla de login simple pre-asociada a ese grupo.

## 3. Algoritmo de Puntuación (Leaderboard Core)
El cruce del campeonato real vs. pronósticos alimentará el Leaderboard de manera automática. Lógica de Puntos:
- Acertar Tendencia (Ganador): **3 Puntos**
Empate: **1 Punto**
- Acertar Score Matemático Exacto (Ej: Pronosticó 2-1, terminó 2-1): **Múltiplicador +2 Pts (Suma 5 Puntos Totales)**.

## 4. Reglas de Transparencia e Integridad (Anti-Fraude)
- **Time-Lock Crítico:** Todo formulario de apuesta (`MatchPredictionCard`) se deshabilitará inmutablemente 15 minutos antes del "Kick-off" de la vida real (cruce del timestamp).
- **Blind Reveal (Velo del Secreto):** Los miembros del grupo NO podrán ver los dígitos apostados por sus rivales hasta que el partido comience. En pre-partido, el botón "Apuestas" solo mostrará candados. Al inicio del juego, la información de toda la mesa se revela para generar competitividad.
- **Vista Histórica del Oráculo:** Los partidos resueltos mutarán a un componente oscuro bloqueado mostrando el `Score Oficial` inmutable para contrastar la realidad con los puntajes entregados.

## 5. Implementación de Base de Datos
- Las predicciones estarán alojadas en un sistema asíncrono (DaaS como Supabase/Firebase) integradas al `useEffect`/Hooks bajo un esquema JSON no restrictivo. Funciones en la nube (Cloud Functions/Cron Jobs u operativas de Admin) resolverán los lotes de puntos al cerrarse un partido.
