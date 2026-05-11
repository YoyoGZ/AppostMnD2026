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
  - [x] **Audit de Calidad**: Verificación visual y funcional del funnel de conversión.
- [ ] **Hito 6: Integración Realtime API** (EN PROGRESO)
  - [x] Conexión con fuente de datos externa (Resultados Mundial): `SportsSyncAgent` creado y listo con Mock Mode.
  - [x] Sincronización de marcadores en tiempo real (Supabase).
  - [ ] Actualización dinámica de tablas de posiciones (FIFA).

## Current Trajectory
**Status**: Hito 6 en progreso. Se ha inyectado un Botón "Sync Agent (MOCK)" en el HQ (`/hq`) para forzar la sincronización de datos falsos de Fase de Grupos a Supabase. 
**[PAUSA DE SESIÓN] Pendiente:** Yoyo realizará pruebas cross-device (Admin en celular, vista en desktop) para verificar la reactividad de las tablas. 
**NOTA:** El botón en `/hq` es temporal para testing y debe ser removido/adaptado antes de producción. Próximo paso post-pruebas: Conectar este motor con el Oráculo y validar recálculo de posiciones.

## Squad Status
| Agent | Task | Status |
| :--- | :--- | :--- |
| Builder | Vercel Deployment Fixes | ✅ RESOLVED |
| Design Lead | Landing Page & Demo Route | ✅ VERIFIED & POLISHED |
| Integrity | Restricted Access Rules | ✅ PLANNING COMPLETED |
| Product | Conversion Funnel | ✅ INTEGRATED |
