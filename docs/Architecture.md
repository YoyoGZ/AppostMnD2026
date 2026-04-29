# 🏛️ Architecture & Infrastructure (Mundial 2026)

Este documento centraliza las decisiones arquitectónicas clave del proyecto y sus componentes estructurales para garantizar mantenibilidad.

## The House Way - Core Stack
- **Framework**: Next.js App Router (React Server Components)
- **Styling**: Tailwind CSS + Variables HSL (Sistema Bento Grid)
- **Base de datos**: Supabase (PostgreSQL + RLS + GoTrue Auth)

## Componentes Críticos del Sistema

### 1. Protección de Rutas (El Guardia Fronterizo)
- **Archivo**: `src/middleware.ts`
- **Función**: Intercepta todas las peticiones a rutas protegidas (ej: `/dashboard`, `/matches`, `/standings`). Valida la sesión criptográfica de Supabase. Si no hay sesión válida, aborta la navegación y redirige al Landing (`/`).
- **Seguridad**: Evita filtraciones de datos y renderizados rotos por falta de usuario.

### 2. Error Boundaries (La Red Anti-Caídas)
- **Archivo**: `src/app/(dashboard)/error.tsx`
- **Función**: Si ocurre una excepción en runtime (ej: timeout de DB o bug de render), este Boundary evita el "White Screen of Death". 
- **UX**: Presenta un diseño amigable alineado a la paleta "Night Stadium", informando al usuario que hubo un inconveniente de red y ofreciendo un botón de recuperación sin culparlo. Mantiene el Trust Score en alto.

### 3. Suspense & Loading States (La Ilusión de Velocidad)
- **Archivo**: `src/app/(dashboard)/loading.tsx`
- **Función**: Durante la resolución de promesas del lado del servidor (ej: cálculo del Oráculo), renderiza instantáneamente un esqueleto de la UI (Skeletons).
- **UX**: Reduce la percepción de lentitud al mostrar la estructura de la página antes de que lleguen los datos.

### 4. El Oráculo (Motor de Cálculo)
- **Archivo**: `src/app/actions/oracle.ts`
- **Arquitectura**: Server Action (Node.js). Recalcula y audita los puntos obtenidos de todas las predicciones contra los resultados oficiales (`src/data/world-cup-2026.json`).
- **Data Flow**: Opera de Server a BD, sin pasar la carga matemática al navegador del usuario.

## Database Security: RLS
Todo el sistema confía en el Row Level Security de Postgres. Ningún cliente puede leer/modificar predicciones de otros ni corromper puntuaciones ajenas gracias a las políticas que atan las operaciones a `auth.uid()`.
