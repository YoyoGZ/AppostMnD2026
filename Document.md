# Documentación de Integración de Agentes (Squad Antigravity)

Este documento registra los Agentes/Personas especializadas integradas formalmente en el proyecto **MundiApp26** bajo la estructura *The House Way*.

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

---

## 7. Rediseño de Landing Page & Identidad Corporativa (Fusión Bento & Unificación)
**Fecha de Implementación**: 2026-05-23  
**Responsable**: UX/UI Design Architect & Product Engineer (Antigravity Squad)

### Contexto de Negocio
Con el objetivo de agilizar el acceso de usuarios finales en Argentina y mitigar riesgos asociados a derechos de propiedad intelectual por términos registrados de terceros, se reformuló la landing page unificando estrictamente toda identidad bajo el nombre oficial de **MundiAPP26**. Se eliminaron las secciones largas y redundantes para dar paso a un embudo (funnel) minimalista y directo.

### Cambios Clave Realizados
1. **Unificación de Marca**: Reemplazo absoluto de toda marca registrada alternativa por la denominación lícita y protegida **MundiAPP26**.
2. **Logotipo Focalizado**: Rediseño de la barra de navegación (incrementando el logo a `w-16 h-16`) e inyección de un gran Isotipo de la marca (`w-28` móvil / `w-36` desktop) con resplandor Stadium Gold en el Hero para captación instantánea de atención (escaneo QR en 1 segundo).
3. **Fusión Bento Minimalista**: Consolidación del Bento Grid original de características y el manual de funcionamiento en un solo bloque estructurado de 4 tarjetas bento estilizadas con degradados radiales dorados tenues (`bg-gradient-to-br from-[#0d0d0d] via-[#16130d]/30 to-black`):
   - *Card 1 (Founder Pass VIP)*: El ticket de entrada, capitanes y ligas privadas.
   - *Card 2 (Data en Tiempo Real)*: Destacando la conexión directa y de alta fidelidad con **API-Football** para automatizar resultados.
   - *Card 3 (Oráculo Sella el Destino)*: Explicación de pronósticos cerrados y sellados inmutablemente.
   - *Card 4 (Coliseo de Duelos)*: Reglas de enfrentamiento directo y medallas de perfil.
4. **Resaltado de Fair Play & Apuestas Externas**:
   - Reubicación del Disclaimer de Fair Play al Hero para mayor transparencia inicial.
   - Creación de un Banner horizontal inferior dedicado a las apuestas de ligas externas (pizza, asado, fernet) aclarando que la aplicación es 100% gratuita y ajena a la intermediación de activos reales.

---

## 8. Sistema de Códigos Promocionales & Afiliados
**Fecha de Implementación**: 2026-05-23  
**Responsable**: Infrastructure Lead & Builder (Antigravity Squad)

### Arquitectura de Negocio y UX
Con el objetivo de incentivar el crecimiento de usuarios a través de relaciones orgánicas de afinidad, se introdujo un sistema de afiliación de alto impacto y de muy bajo roce.

### Especificaciones Técnicas y de Persistencia
1. **Esquema Relacional**:
   - Tabla `promo_codes`: Almacena de manera atómica el par `code` (8 caracteres alfanuméricos únicos generados aleatoriamente) y `owner_name` (el nombre del amigo/compañero administrador).
   - Columna `profiles.referred_by_code` (relación de clave foránea débil): Guarda el código promocional con el que el usuario se registró en la aplicación.
2. **Validación Reactiva con Debounce**:
   - En el Paywall de Onboarding (`/paywall`), se integró un input de código de promoción estilizado con Glassmorphism.
   - Cuenta con una validación **debounced en caliente de 600ms** en el cliente, evitando consultas excesivas al servidor en cada pulsación de tecla.
   - **Persistencia en Caliente Síncrona**: En el momento exacto de la validación exitosa, se ejecuta la acción `savePromoCodeToProfileAction(code)` para asociar inmediatamente el código promocional al perfil del usuario. Esto previene la pérdida de referencias de afiliación ante interrupciones, abandonos o reintentos posteriores en Mercado Pago.
3. **Fábrica de Promociones y Analíticas en HQ (God Mode)**:
   - Se añadió un módulo Bento interactivo (`PromoControlModule.tsx`) en el `/hq`.
   - Permite la creación atómica de códigos promocionales únicos excluyendo caracteres ambiguos (`I`, `O`, `0`, `1`) para garantizar un Trust UX impecable.
   - **Cruce en Memoria Libre de N+1**: La Server Action `getPromoAnalyticsAction` realiza un bulk fetch de perfiles afiliados y códigos, cruzando la información en memoria del servidor antes de retornar. Esto mitiga latencias extremas.
   - **Acordeón Auditor de Referidos**: Permite desplegar de forma muy elegante el listado exacto de Alias (`display_name`) y correos electrónicos de los usuarios registrados con cada código en vivo.

---

## 9. Arquitectura Multi-Liga, Gestión de Slots y Prevención de Fugas de Branding
**Fecha de Implementación**: 2026-05-28  
**Responsable**: Infrastructure Lead & Builder (Antigravity Squad)

### Especificaciones Técnicas e Implementación
Con el objetivo de flexibilizar el modelo de negocio y resolver el callejón sin salida de los usuarios invitados que quieren fundar su propia liga personal sin fricciones ni pérdidas de seguridad, se re-diseñó la lógica relacional:

1. **Gestión de Slots (`profiles.max_leagues`)**:
   - Se añadió la columna `max_leagues` (entero, default `0` para miembros invitados) en Supabase.
   - Cada pago aprobado incrementa síncronamente el valor en `+1`, permitiendo a los capitanes adquirir múltiples arenas.
   - En `createLeagueAction`, se limita la creación comparando las ligas fundadas (`created_by = user.id`) contra `max_leagues`.

2. **Paywall Inteligente de Slots**:
   - La pantalla `/paywall` evalúa en tiempo real si el usuario logueado posee slots disponibles (`max_leagues > foundedCount`).
   - Si tiene slots libres, renderiza el formulario de creación directa para bautizar la liga gratis; en caso contrario, redirige al Checkout de Mercado Pago de manera obligatoria.

3. **Prevención de Fugas de Marca Blanca**:
   - La resolución de temas visuales (`resolveBrandThemeAction`) opera a nivel de la liga activa y no del perfil.
   - Si un empleado juega en la liga corporativa (creada por un Gerente pre-aprobado en `corporate_relations`), ve los logos y colores de su empresa.
   - Si ese mismo empleado compra un pase y crea una liga personal para amigos, la liga se asocia a su ID (no corporativo) y se renderiza con el tema estándar de MundiApp26 (Oro y Negro), blindando la exclusividad del patrocinio corporativo de forma automática.

4. **Navegación e Interacción Mobile-First**:
   - Se habilitó la apertura del selector de ligas del Sidebar a todos los usuarios.
   - Se inyectó en móviles y escritorio un bloque Bento con acciones directas: `➕ Fundar nueva Liga` y `⚔️ Unirme a otra Liga` en caliente, acelerando la conversión.

---

## 10. Cartel de Bienvenida a Capitanes & Sorteo de Camiseta
**Fecha de Implementación**: 2026-05-28  
**Responsable**: Design Lead & Infrastructure (Antigravity Squad)

### Especificaciones Técnicas e Implementación
Con el objetivo de incrementar la retención y celebrar la conversión de los usuarios Capitanes (Founders) de forma gamificada, se diseñó e integró un cartel interactivo de bienvenida y reconocimiento:

1. **Cálculo de Posición Dinámica Atómico**:
   - En el Server Component `layout.tsx`, si el usuario posee ligas fundadas, se busca la fecha de creación de su primera liga y se cuenta cuántas ligas existen creadas hasta ese instante. Esto nos devuelve su posición secuencial exacta de manera dinámica (ej: Creador de Liga Nro 15).
   - **Optimización de Rendimiento**: Si el usuario ya descartó el cartel (`welcome_sorteo_shown` es true en metadatos), el servidor omite cualquier consulta DDL de conteo, garantizando latencia cero en cargas posteriores del dashboard.

2. **WelcomeSorteoModal (`src/components/dashboard/WelcomeSorteoModal.tsx`)**:
   - Un componente cliente de alta fidelidad con un backdrop de desenfoque absoluto (`backdrop-blur-3xl bg-black/95`) que inhabilita el cierre accidental por tecla `Escape` o clicks externos.
   - Presenta una tarjeta Bento glassmórfica con bordes brillantes y un resplandor dorado holográfico que alberga la leyenda literal de honor:
     `"Sos el Creador de Liga Nro XX, estate atento al sorteo de la camiseta, te lo comunicaremos a tu email"`

3. **Cierre Obligatorio y Persistencia**:
   - Para desbloquear la interfaz, el usuario debe dar click al gran botón dorado `¡VAMOS POR ESA CAMISETA! 🇦🇷` (con animación de pulso).
   - El evento invoca síncronamente `supabase.auth.updateUser({ data: { welcome_sorteo_shown: true } })` para persistir el visto directamente en los metadatos de Supabase Auth, sincronizando el estado entre dispositivos de forma instantánea.

---

## 11. Exclusión de Patrocinadores & Marca de Agua Visual Premium (Fondo Inmersivo)
**Fecha de Implementación**: 2026-05-28  
**Responsable**: Design Lead & Infrastructure (Antigravity Squad)

### Exclusión de Patrocinadores (Raffle Exclusion)
Para evitar conflictos de interés, los Founders que son auspiciados por marcas corporativas pre-aprobadas son discriminados dinámicamente:
1. **Detección en el Servidor**: En `layout.tsx`, si el correo del usuario logueado coincide con un email registrado en la tabla `corporate_relations`, se marcan los flags `isCorporate={true}` y se recupera su nombre de marca amigable desde `brand-themes.json`.
2. **Onboarding Contextualizado**: Si el usuario es corporativo, el modal de bienvenida oculta toda mención al sorteo de la camiseta promocional de Argentina. En su lugar, despliega una tarjeta Bento de felicitación corporativa dedicada: `"Sos el Creador de la Liga Nro XX de tu Empresa, estate atento al fixture interno y competí con tus colegas."`, mutando el CTA final de forma épica e integradora a: `"¡VAMOS POR ESA COPA! ⚽"`.
3. **Impenetrabilidad en el Sorteo de Admin (HQ)**: La Server Action `runRaffleAction` (`src/app/actions/admin.ts`) del panel administrativo fue modificada para consultar y excluir atómicamente todos los emails provenientes de la tabla `corporate_relations` usando una estructura `Set` ultra-rápida. Carga un pool extendido de 200 fundadores y toma los primeros 50 netamente orgánicos, blindando al 100% el sorteo ante conflictos marcarios.

### Marca de Agua Visual Colosal (Visual Polish)
Para romper la tosquedad del fondo negro plano e inyectar profundidad espacial tridimensional digna de una startup de clase mundial:
1. **Logo Colosal en Backdrop**: Se integró una marca de agua gigante del logo oficial de la app (`/assets/logo_oficial.png`), escalada al `200vw` en pantallas móviles y `75vw` en computadoras de escritorio.
2. **Lens Blur de Bajo Contraste**: El logo se diseñó con una opacidad extremadamente sutil (`opacity-[0.035]`), rotado a `12deg` y con un desenfoque profundo (`blur-[25px]`). Adicionalmente, cuenta con un gradiente radial dorado (`bg-primary/5`) detrás de la tarjeta y una animación pulsante de respiración lenta. Esto crea volumen físico, texturiza el espacio vacío y genera una atmósfera inmersiva de estadio nocturno sin interferir en la legibilidad.

---

## 12. Páginas Legales, Soporte HQ y Límites de Marca Blanca
**Fecha de Implementación**: 2026-06-03  
**Responsable**: Antigravity (Senior Product Engineer)

### Especificaciones Técnicas e Implementación
Para refinar y completar la experiencia de marca e institucional de la aplicación:

1. **Metadatos OG Globales de Landing**:
   * Incorporación de metadatos Open Graph y Twitter ricos en `src/app/layout.tsx` apuntando al logotipo dorado oficial y descripción publicitaria atrayente.

2. **Rutas Institucionales y Legales**:
   * **Términos y Condiciones (`/terms`)**: Bento grid de alta legibilidad detallando el aviso de Fair Play (declaración solemne de que la app no intermedia apuestas con activos o dinero real) y políticas de uso de cookies de rendimiento.
   * **Política de Privacidad (`/privacy`)**: Declaración del uso seguro y confidencial de correos electrónicos y la inyección de cookies estrictamente técnicas (sesión Supabase Auth), libre de tracking comercial de marketing de terceros.
   * **Formulario de Soporte (`/support`)**: Componente interactivo que precarga email/alias para usuarios autenticados, incluye placeholders intuitivos, toast de éxito y Server Action segura conectada a base de datos.

3. **Módulo de Tickets de Soporte en el HQ (God Mode)**:
   * Creación de la tabla `support_tickets` en Supabase con RLS de inserción pública (para casos sin sesión o con claves extraviadas).
   * Módulo interactivo `SupportTicketsModule` integrado en la vista super_admin (`/hq`), permitiendo listar, filtrar en caliente por estado (pendientes/todos) y resolver tickets mediante Server Action. La respuesta directa a correos del usuario queda pendiente de desarrollo técnico.

4. **Límite de Capacidad de Ligas Corporativas**:
   * **Control de Capacidad Híbrido**:
     1. **Servidor (Backend)**: En `joinLeagueAction` y `getLeagueByInvite`, se evalúa si el creador de la liga pertenece a la tabla `corporate_relations`. Si es así, se cuenta el total de miembros. Al alcanzar **10 participantes** (1 Capitán Fundador + 9 invitados), la Server Action de unión rechaza la inserción por seguridad de licenciamiento.
     2. **Pre-emptive Block (Frontend)**: Si la liga de Marca Blanca está llena (`isFull`), la página `/join/[code]` deshabilita de inmediato el formulario de registro y la acción de unirse, mostrando una tarjeta roja Bento de capacidad máxima.
   * **Ocultación de Precios de Venta**: Si la invitación es para una liga corporativa, se oculta toda leyenda de cobro de $5.000 ARS y Mercado Pago, reemplazándola por instrucciones de registro patrocinadas por la organización.
   * **Siembra de Test**: Creación del script `scripts/seed-members-test.js` para poblar ligas de prueba dinámicamente hasta el límite de 10 participantes.
