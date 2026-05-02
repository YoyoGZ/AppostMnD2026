# Plan de Acción

## Master Roadmap
- [x] Fase 0: Setup Inicial (Layout, Bento Grid, Sistema de Diseño)
- [x] Fase 0.5: Motor de Partidos y Navegación Móvil Filtra (UX de Grupos)
- [x] Fase 1: Arquitectura de Autenticación (1-Click Login)
- [x] Fase 1.5: **Audit Remediation** — Middleware Auth, Error/Loading Boundaries, Toasts, Login Isolation
- [x] Fase 2: **Motor de Ligas Privadas** (Onboarding Admin, Magic Invites, Aislamiento de Ligas)
- [x] Fase 3: **Integridad de Pronósticos** (5 pts Score, Time-locks & 10min Reveal)
- [x] Fase 4: **Oráculo y Leaderboards** (Cruce de resultados en tiempo real)
- [x] Fase 5: **Monetización y God Mode** (Pases Premium de Uso Único y Panel Admin)
- [ ] Fase 6: **Motor de Duelos (Side-Quests)** (Competiciones H2H internas por Honor)
- [ ] Fase 7: **Motor de Pronósticos Eliminatorios** (Llaves Knockout y Alargue/Penales)

## Current Trajectory
**Paso Activo**: **Fase 6: Motor de Duelos (Side-Quests)** — Creación de la arquitectura de datos y flujos UI para habilitar los enfrentamientos directos entre miembros de la liga.

## Último Audit (2026-05-02) - **Pre-Fase 6 Verification**

| Categoría | Score | Target |
|-----------|-------|--------|
| Visual | 9.5/10 | 9/10 |
| Functional | 8/10 | 9/10 |
| Trust | 8.5/10 | 9/10 |

### Critical Fails & Bugs (Blocking Fase 6)
- **Functional**: Faltan mensajes de error (toasts) al intentar hacer login con credenciales incorrectas o vacías.
- **Trust / Logic**: El botón de "REGISTRARME" no tiene acción ni redirección configurada.
- **Visual / Trust**: Faltan estados de carga (loading states / skeletons) durante la navegación de la autenticación.

## Squad Status

| Agent | Task | Status |
|-------|------|--------|
| Antigravity | God Mode (/hq) y Generador de Tokens | ✅ Done |
| Shield & Integrity Specialist | Combustión Segura de Tokens (RLS) | ✅ Done |
| Design Lead | Golden Ticket Visual UX (/vip) | ✅ Done |
| Builder | Fix: Mensajes de error (Toasts) en Login y Loading States | ✅ Done |
| UX/UI Design Architect | Fix: Flujo del botón REGISTRARME (Color y Alertas) | ✅ Done |
| Data Architect | Motor de Duelos: Tablas Supabase (league_duels, duel_participants) y RLS | ✅ Done |
| Builder | Motor de Duelos: Server Actions (createDuel, getLeagueDuels) | ✅ Done |
| Design Lead | Motor de Duelos: UI Modal Creador | ✅ Done |
| Design Lead | Motor de Duelos: UI del "Coliseo" (Bento Cards en Posiciones) | 🚧 In Progress |
