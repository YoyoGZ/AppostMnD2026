# Plan de Acción

## Master Roadmap
- [x] Fase 0: Setup Inicial (Layout, Bento Grid, Sistema de Diseño)
- [x] Fase 0.5: Motor de Partidos y Navegación Móvil Filtra (UX de Grupos)
- [x] Fase 1: Arquitectura de Autenticación (1-Click Login)
- [x] Fase 1.5: **Audit Remediation** — Middleware Auth, Error/Loading Boundaries, Toasts, Login Isolation
- [x] Fase 2: **Motor de Ligas Privadas** (Onboarding Admin, Magic Invites, Aislamiento de Ligas)
- [ ] Fase 3: **Integridad de Pronósticos** (5 pts Score, Time-locks & 10min Reveal)
    *   Implementar "Sello" de apuesta (No-Edit)
    *   Lógica de visibilidad diferida (10 min post-inicio)
    *   Componente "Reglas de la Arena"

- [ ] Fase 4: Oráculo y Leaderboards (Cruce de resultados en tiempo real)
- [ ] Fase 5: Motor de Pronósticos Eliminatorios (Llaves Knockout y Alargue/Penales)

## Current Trajectory
**Paso Activo**: **Fase 3: Integridad de Pronósticos** — Configurando sistema de 5 puntos, Sello de apuestas y Blind Reveal (10 min).

## Último Audit (2026-04-29)

| Categoría | Score | Target |
|-----------|-------|--------|
| Visual | 10/10 | 9/10 |
| Functional | 10/10 | 9/10 |
| Trust | 10/10 | 9/10 |

## Squad Status

| Agent | Task | Status |
|-------|------|--------|
| Antigravity | Auditoría `/audit` completa | ✅ Done |
| Design Lead | Aislar Login + Loading States + Toasts + Kinetic Typography | 🔜 Next |
| Builder | Middleware Auth + Error Boundaries + Rutas Placeholder + Optimistic UI | 🔜 Next |
| Data Tournament Architect | Lógica de puntos y Oracle debug | ⏸️ Pausado |
| Shield & Integrity Specialist | Ciberseguridad de Apuestas (Time-locks) | 📋 Pipeline |
