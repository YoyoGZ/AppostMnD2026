# Documentación de Integración de Agentes (Squad Antigravity)

Este documento registra los Agentes/Personas especializadas integradas formalmente en el proyecto **Mundial 2026** bajo la estructura *The House Way*.

---

## 1. UX/UI Design Architect
**Ubicación de la Skill**: `.agents/skills/ux-architect/SKILL.md`  
**Rol Principal**: Arquitecto de Front-end asegurando la excelencia visual, la consistencia atómica y la accesibilidad (A11y) bajo el paradigma de desarrollo *Mobile-First*.

### Principios Fundamentales
- **Estándares Visuales**: Utilizar *Bento Grids* (12 columnas), la *Regla de los 8px*, *Glassmorphism* (con moderación en móviles) e iconografía unificada (`Lucide-React`).
- **Arquitectura de Variables CSS Nativas**: Construcción con directivas estrictas conectadas al `globals.css` (Tailwind V4); eliminando los colores hardcodeados de los componentes.
- **Micro-interacciones y UI Optimista**: Asegurar validación contextual en cada componente creado, manejando las transiciones de estados (*Pendiente*, *En Juego*, *Finalizado*).  

---

## 2. Data Tournament Architect
**Ubicación de la Skill**: `.agents/skills/data-architect/SKILL.md`  
**Rol Principal**: Product Engineer Senior orientado a la estructura de base de datos normalizada (JSON), y al desarrollo y depuración reactiva de los algoritmos de torneo.

### Principios Fundamentales
- **Lógica Predictiva y Precisa**: Implementación rigurosa de las reglas FIFA Oficiales para Fase de Grupos (Desempates por Pts, DG, GF, Resultado directo).  
- **Reactividad Instantánea**: Garantizar recalculación total del JSON de posiciones con cada latido de la base de datos de manera atómica (tiempos bajo 100ms).
- **Proyecciones (Eliminación Directa)**: Calcular mediante llaves asincrónicas a los contendientes de Octavos y Cuartos de modo imperativo una vez concluida matemáticamente la Fase de Grupos.
- **Arquitectura Future-Proof**: Proyectar los JSON priorizando un traspaso futuro asintomático hacia bases de datos documentales como *Google Firestore*.

---

## 3. Infrastructure & Realtime Specialist (Backend)
**Ubicación de la Skill**: `.agents/skills/infrastructure-architect/SKILL.md`  
**Rol Principal**: Product Engineer Senior orientado a Sistemas Distribuidos, manejo de Next.js Server Actions y control de mutaciones de datos (Optimistic UI / Security).

### Principios Fundamentales
- **Persistencia y Server Actions**: Creación de un backend robusto capaz de interceptar inputs, validarlos mediante barreras de seguridad rigurosas y volcarlos a un JSON concurrente simulando esquemas relacionales o documentales escalables (usuarios vs pronósticos).
- **Shield Protocol (Seguridad)**: Instauración del principio de privilegio mínimo, garantizando que un usuario solo intervenga y mute localmente sus pronósticos individuales sin envenenar o falsear el *Fixture* maestro.
- **Transparencia y Recovery (Trust Score)**: Aplicación profunda del modelo *Optimistic UI*, devolviendo feedback de guardado silente ante el usuario (<100ms). Proveer rollback automático (recuperación de estado) en caso de que alguna escritura IO o concurrencia falle, previniendo fuga o pérdida capilar de datos.

---

## 4. Shield & Integrity Specialist (Seguridad)
**Ubicación de la Skill**: `.agents/skills/integrity-specialist/SKILL.md`  
**Rol Principal**: Product Engineer Senior orientado a la Ciberseguridad de la infraestructura, estableciendo aduanas lógicas rígidas, validación perimetral estricta de esquemas vía Zod/Joi y protección criptográfica antifraude.

### Principios Fundamentales
- **Gatekeeper de Datos (Data Guard)**: Despliegue de contratos de validación estrictos en tiempo de ejecución para cada Server Action, impidiendo la inyección de tipos corruptos (ej. goles negativos o strings anómalos). Todo payload no catalogado se intercepta y destruye.
- **Micro-segmentación de Sesión (Middleware)**: Implementación de guardianes de ruta y chequeo orgánico del `userID` subyacente. Cada petición asume intrusión hasta que firma cripto que el usuario es dueño lícito de la tabla de *Apuestas* a modificar.
- **Inmutabilidad Cronológica**: Cierre de bóveda hermético dependiente del `Time System`. Un intento de inserción/mutación sobre un partido cuyo horario límite fue traspasado resultará sin miramientos en un `403 Forbidden`, sin negociaciones de opacidad descriptiva al cliente.

---

## 5. System Architecture & Project Structure (Architectural Cleanup)
**Fecha de Implementación**: 2026-04-04  
**Responsable**: Antigravity (Senior Product Engineer)

### Descripción de la Reestructuración
Se ha realizado una limpieza arquitectónica profunda para eliminar la deuda técnica técnica acumulada por el uso de carpetas temporales y estructuras de componentes dispersas. El proyecto ha pasado de una fase de prototipado rápido en `app_temp/` a una estructura de producción en la raíz del repositorio.

### Pilares de la Nueva Estructura
1. **Unificación en la Raíz**: El proyecto Next.js ahora reside en la raíz del espacio de trabajo (`/Mundial2026`). Esto garantiza que todas las herramientas de desarrollo, scripts de `package.json` y configuraciones de TypeScript funcionen de manera nativa sin necesidad de saltos de directorio.
2. **Organización por Dominios (Tournament Domain)**:
   - Se ha consolidado la lógica de visualización del mundial en `src/components/tournament/`.
   - Componentes clave como `GroupsCarousel.tsx`, `TournamentCard.tsx` y `MatchCard.tsx` han sido reubicados para asegurar que la lógica de negocio y la UI de la competición estén acopladas en su propio contexto.
3. **Centralización de Tipos (Type Safety)**: 
   - Implementación de `src/types/tournament.ts`. Todas las interfaces clave (`Team`, `MatchStatus`, `TournamentCardProps`, `DashboardMatchProps`) están ahora centralizadas, eliminando definiciones duplicadas e inconsistencias de tipado entre componentes.
4. **Estandarización de Rutas (Path Aliases)**:
   - Se ha migrado el uso de importaciones relativas complejas (`../../`) hacia alias de ruta absolutos (`@/`). Esto facilita el refactor futuro y mejora la legibilidad del código.
5. **Branding de Aplicación**:
   - El proyecto ha sido formalmente nombrado como `mundial-2026-dashboard` en el manifiesto de la aplicación.

### Mapa de Carpetas Actualizado
- `src/app/`: Enrutamiento y Layouts principales (App Router).
- `src/components/tournament/`: Componentes de lógica de competición y visualización de datos.
- `src/components/layout/`: Estructura base de la aplicación (Sidebar, Shell).
- `src/components/ui/`: Elementos atómicos y componentes de diseño genéricos.
- `src/types/`: Definiciones de TypeScript globales y por dominio.
- `src/data/`: Fuente de verdad estática (JSON) para equipos y partidos.
- `src/lib/`: Utilidades compartidas y funciones de ayuda (`cn`, etc.).

---

## 6. Visual Brand & "Night Stadium" Palette
**Fecha de Implementación**: 2026-04-04  
**Responsable**: UX/UI Design Architect

### Concepto Visual
El diseño se aleja del blanco y negro básico para adoptar una estética de "Estadio Nocturno Premium". El objetivo es recrear la atmósfera de un partido inaugural de la Copa del Mundo bajo los reflectores.

### Paleta de Colores (Tokens de Diseño)
- **Primary (Trophy Gold)**: `#fbbf24` - Utilizado para acentos críticos, ganadores y estados activos.
- **Background (Night Sky)**: `#05070a` - Un azul-negro profundo que sirve de base para toda la aplicación.
- **Sidebar (Deep Stone)**: `#030406` - Tono sólido más oscuro que el fondo principal para dar profundidad estructural.
- **Cards (Dual Tone Architecture)**:
  - **Header**: `#161a24` - Tono sólido con mayor contraste para separar títulos y fases.
  - **Body**: `#0d1117` - Tono sólido base para el contenido de datos.
- **Success (Stadium Green)**: `#10b981` - Basado en el color del césped iluminado.

### Implementación Técnica
- Los colores se gestionan a través de variables CSS en `globals.css` bajo la capa `@layer base`.
- Se han registrado como utilidades de Tailwind en el bloque `@theme` (`bg-card-header`, `bg-sidebar`, etc.).
- Se implementó la clase `.bg-stadium` como un overlay fijo que prepara la interfaz para la futura imagen de fondo.
