# Documentación Técnica: Motor de Eliminatorias Mundial 2026

Este documento detalla la lógica de negocio y los componentes implementados para la gestión de la fase final.

## 1. Arquitectura de Identidad (`AuthContext`)
Se ha implementado un contexto global (`AuthContext.tsx`) que permite a la aplicación identificar el rol del usuario en tiempo real:
- **super_admin**: Acceso al HQ y herramientas de auditoría masiva.
- **captain**: Gestión de ligas privadas.
- **player**: Vista de bracket y pronósticos.

## 2. Componentes Principales

### `KnockoutManager.tsx` (Componente Dual)
Gestiona la lógica de proyección y despliegue de partidos.
- **Modo Admin**: Muestra el ranking de mejores terceros y el botón "Desplegar a la Arena".
- **Modo User**: Muestra la previsualización de cruces y botones de "Ir a Pronóstico".

### `KnockoutBracket.tsx`
Renderiza el cuadro interactivo del mundial por rondas.
- **Optimización Móvil**: Tarjetas "Slim" para las primeras rondas.
- **Victory Card**: Diseño especial (ID 104) para la Gran Final con realce visual premium.

## 3. Lógica de Promoción (FIFA Standard)
La promoción de equipos se basa en:
1. Puntos.
2. Diferencia de Goles (DG).
3. Goles a Favor (opcional en motor actual).
4. Ranking de Mejores Terceros: Selección de los 8 mejores de entre los 12 grupos.

## 4. Flujo de Auditoría (Human-in-the-Loop)
1. El sistema proyecta los cruces en base a `standings` calculados.
2. El Super Admin verifica la integridad en `/hq/knockouts`.
3. El Super Admin pulsa **"Desplegar"**, inyectando los partidos oficiales en `match_results`.
4. Los usuarios reciben la notificación y pueden comenzar a pronosticar en `/knockouts/bracket`.
