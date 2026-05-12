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
    - [ ] *Pendiente visual:* Generar y ubicar las imágenes oficiales finales (`icon-192x192.png` y `icon-512x512.png`) para remover placeholders externos.
  - [x] **Audit de Calidad**: Verificación visual y funcional del funnel de conversión.
- [x] **Hito 6: Integración Realtime API** (COMPLETADO MOCK)
  - [x] Conexión con fuente de datos externa (Resultados Mundial): `SportsSyncAgent` creado y listo con Mock Mode.
  - [x] Sincronización de marcadores en tiempo real (Supabase).
  - [x] Actualización dinámica de tablas de posiciones (FIFA).
- [ ] **Hito 7: Infraestructura & Seguridad (Shield Protocol)** 🛡️
  - [ ] Implementar **Supabase Keep-Alive** (Ping automático cada 48h).
  - [ ] Reforzar Server Actions con validación de roles en servidor (Admin/Owner).
- [ ] **Hito 8: Social & Engagement (Comunidad)** 💬
  - [ ] **Chat de Liga Realtime**: Mensajería instantánea para miembros de una liga.
  - [ ] **Social Share Kit**: Generación de tarjetas para compartir en redes.

## Current Trajectory
**Status**: Hito 6 (Mock) finalizado y validado con éxito. El flujo completo (HQ -> Supabase -> Dashboard Reactivo) funciona a la perfección. Adicionalmente, se realizó una refactorización global segura renombrando "Arena" a "Liga" en toda la plataforma para lograr coherencia total en el producto. El soporte PWA ha sido corregido y validado localmente.
**Próximo Paso (Mañana):**
1. Inyectar llave de API-Football y apagar el "Mock Mode".
2. Buscar un partido real en curso esta semana y sincronizarlo directo desde la API al Dashboard.
3. Remover/adaptar el botón temporal de Mock en `/hq`.
4. Pulir detalles visuales menores para el lanzamiento oficial.

## Squad Status
| Agent | Task | Status |
| :--- | :--- | :--- |
| Builder | Vercel Deployment Fixes | ✅ RESOLVED |
| Design Lead | Landing Page & Demo Route | ✅ VERIFIED & POLISHED |
| Integrity | Restricted Access Rules | ✅ PLANNING COMPLETED |
| Product | Conversion Funnel | ✅ INTEGRATED |
