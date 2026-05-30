# 🏢 Guía de Integración y Pruebas de Marca Blanca Corporativa (Co-Branding)

Este documento detalla el plan de integración, la configuración de la base de datos, la estructura de archivos gráficos requeridos (Assets), y la metodología de arquitectura recomendada para escalar a múltiples empresas en MundiApp26.

---

## 1. Contexto y Objetivos

La experiencia de **Marca Blanca** permite que empresas patrocinadoras tengan su propio branding en la aplicación de forma dinámica.

### Objetivos Clave

- **Bypass de Paywall:** Los Gerentes de las empresas (Founders) registrados con un correo pre-aprobado saltan la pasarela de pagos automáticamente y son promovidos a `'founder'` al pasar por el `/paywall`.
- **Branding Dinámico en Caliente:** Al detectar que la liga activa del usuario fue creada por un founder corporativo, el sistema tiñe visualmente la interfaz de acuerdo al tema cargado desde `brand-themes.json`.
- **Modularidad Bento en Dashboard:** Mostrar un banner corporativo estético, colapsable, y que guarde la preferencia en `sessionStorage` para no perturbar la experiencia de usuario.

---

## 2. Inventario de Assets y Tipos de Archivos Requeridos

Para que un convenio corporativo funcione óptimamente en MundiApp26, necesitas cargar tanto los **recursos visuales** de la empresa como sus **definiciones cromáticas y de configuración**.

### Resumen de Ubicaciones y Tipos de Archivos

| Tipo de Recurso | Formato Recomendado | Ruta Física / Ubicación en la App | Identificador / Regla de Nombre |
| :--- | :--- | :--- | :--- |
| **Logotipo Principal** | `.svg` (vectorial transparente) o `.png` (HD transparente, 32-bit) | `public/assets/brands/` | `[brand_id]-logo.svg` (Ej: `globant-logo.png`) |
| **Configuración de Marca** | Bloque JSON estructurado | `src/data/brand-themes.json` | Clave única coincidente con `brand_id` (Ej: `"globant"`) |

| **Confguración de Marca2** | Agregar Marca en src/components/admin/CorporateBrandingModule.tsx| 

| **Bypass de Paywall** | Registro en Base de Datos | Tabla `corporate_relations` (Supabase) | Clave primaria: `email` del directivo o empleado corporativo |

---

### A. Recursos Gráficos (Logotipos)

Para mantener una UX premium, limpia y adaptativa en celulares y computadoras:
 **Formato Preferido:** **SVG vectorial** con fondos transparentes. Los gráficos vectoriales garantizan una nitidez absoluta en pantallas de alta densidad (Retina) y pesan menos de 10 KB.
  **Formato Alternativo:** **PNG en alta definición** con transparencia (canal alfa de 24 o 32 bits).
  **Dimensiones y Relación de Aspecto:**
    **Layout Cuadrado:** `~256x256 píxeles`.
    **Layout Rectangular/Horizontal (Recomendado):** `~512x128 píxeles` con márgenes internos proporcionales para evitar recortes bruscos.
**Ubicación Física:**
  Los logotipos estáticos de la marca deben subirse en la subcarpeta dedicada a marcas:
  `public/assets/brands/`
  **Nomenclatura Estándar:**
  Identificar el archivo usando el identificador único de la marca (`brand_id`) en minúsculas y sin espacios:
  `[brand_id]-logo.svg` o `[brand_id]-logo.png`
  *(Ejemplo para Globant:* `public/assets/brands/globant-logo.png`*)*

### B. Declaración Cromática y de Textos (JSON)

Cada marca requiere una definición en el archivo de temas ubicado en:
`src/data/brand-themes.json`

Cada bloque debe estar mapeado con la estructura cromática de Tailwind y la información contextual del Bento Grid:

```json
"brand_id_ejemplo": {
  "name": "Nombre Público",
  "logo": "/assets/brands/brand_id_ejemplo-logo.svg",
  "accentColor": "#HexadecimalColor",
  "sidebarBg": "bg-gradient-to-b from-[#GradienteInicio] via-[#GradienteMedio] to-[#GradienteFin]",
  "sidebarText": "text-[#HexadecimalColor]",
  "accentText": "text-[#HexadecimalColor]",
  "accentBorder": "border-[#HexadecimalColor]/30",
  "dashboardBanner": {
    "title": "Título Bento Banner 🟢",
    "description": "Texto descriptivo de motivación interna para los empleados de la empresa.",
    "accentBg": "bg-[#HexadecimalColor]/10 border-[#HexadecimalColor]/20"
  }
}
```

---

## 3. Escenario de Crecimiento: Soporte para Múltiples Empresas (Globant, Accenture, MercadoLibre, etc.)

Cuando el volumen comercial crece y necesitas desplegar la App para **tres o más empresas auspiciantes de forma simultánea**, existen dos metodologías de alojamiento de información dependiendo de tus necesidades de mantenimiento:

### Metodología A: Alojamiento Estático Local (Hasta 5 Convenios)

Es ideal para proyectos pequeños y rápidos (Speed-to-Market). No requiere modificar la base de datos.

1. Guardas los logotipos estáticos en la carpeta `public/assets/brands/` con sus respectivos nombres (`globant-logo.png`, `accenture-logo.png`, `mercadolibre-logo.svg`).
2. Declaras cada bloque correspondiente dentro de `src/data/brand-themes.json` bajo las llaves `"globant"`, `"accenture"` y `"mercadolibre"`.
3. Desde el panel del HQ, vinculas el email del Gerente correspondiente al `brand_id` establecido.

### Metodología B: Arquitectura Dinámica en la Nube (Más de 5 Convenios - Altamente Recomendada) 🚀

Para un escalamiento masivo sin necesidad de redesplegar el código de Next.js ni tocar archivos JSON en Git ante cada nuevo cliente:

1. **Supabase Storage (CDN):**
   Creamos un **Bucket público en Supabase** llamado `brand-logos`. Los logos de las empresas se suben directamente a este bucket desde el panel del HQ en tiempo de ejecución. Esto nos provee una URL de CDN optimizada.

2. **Tabla de Base de Datos `brand_themes`:**
   En lugar de usar un archivo local `.json`, migramos la estructura a una tabla en Supabase:

   ```sql
   CREATE TABLE public.brand_themes (
     id text PRIMARY KEY, -- ej: 'mercadolibre'
     name text NOT NULL,
     logo_url text NOT NULL,
     accent_color text NOT NULL,
     sidebar_bg text NOT NULL,
     sidebar_text text NOT NULL,
     dashboard_title text NOT NULL,
     dashboard_description text NOT NULL,
     created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
   );

   ```

3. **Flujo Autogestionable en HQ:**
   Se diseña un panel administrativo de marca blanca en el HQ para que puedas arrastrar el logo de la empresa y configurar los colores de acento y gradientes mediante inputs de selección cromática, guardando todo directamente en la base de datos de producción.

---

## 4. Flujo de Configuración Rápido (Creación de una Nueva Marca)

Integrar un nuevo convenio corporativo toma exactamente **3 pasos sencillos**:

### Paso 1: Guardar el Logo de la Marca

Sube el logotipo en la carpeta física de assets con formato transparente:
`public/assets/brands/[brand_id]-logo.png` (o `.svg`)

### Paso 2: Declarar el Diseño en `brand-themes.json`

Define el bloque de colores y textos en `src/data/brand-themes.json` usando el `brand_id` como clave: json

"mi-marca": {
  "name": "Mi Marca Premium",
  "logo": "/assets/brands/mi-marca-logo.png",
  "accentColor": "#COLOR_HEX",
  "sidebarBg": "bg-gradient-to-b from-[#111] to-[#000] border-r border-[#COLOR_HEX]/20",
  "sidebarText": "text-[#COLOR_HEX]",
  "accentText": "text-[#COLOR_HEX]",
  "accentBorder": "border-[#COLOR_HEX]/30",
  "dashboardBanner": {
    "title": "Liga Mi Marca 🟢",
    "description": "¡Demostrá tu nivel en el fixture interno y competí con tus colegas!",
    "accentBg": "bg-[#COLOR_HEX]/10 border-[#COLOR_HEX]/20"
  }
}

### Paso 3: Registrar la Marca en el HQ Manager

 1. Abre CorporateBrandingModule.tsx (/src/components/admin/CorporateBrandingModule.tsx) y agrega tu marca al array `availableBrands` para verla en el selector visual:

{ id: "mi-marca", label: "Mi Marca Premium 🔵", color: "text-[#COLOR_HEX]" }
2. Entra al panel de administración del **HQ (God Mode)**.
3. Escribe el correo del founder de pruebas (ej: `test@mi-marca.com`), selecciona la marca en el desplegable y haz clic en **"Asociar Founder Corporativo"**. ¡El sistema inyectará la relación en Supabase automáticamente sin tocar código SQL!

---

## 5. Protocolo de Pruebas de Extremo a Extremo (Test Run)

> [!IMPORTANT]
> **REGLA DE ORO DEL LOGIN:**
> Por seguridad de Supabase Auth, los correos corporativos creados en el HQ **NO existen en el sistema de claves** hasta que se registran por primera vez. **SIEMPRE debes ingresar por la pestaña "Crear Cuenta" (Registro)** en el formulario de acceso y nunca por "Ingresar" directo.

### Paso 1: Registro Inicial de Pruebas

1. Abre MundiApp26 y ve a la sección de **Crear Cuenta (Registro)**.
2. Ingresa el nombre de liga de prueba, tu apodo, el correo corporativo registrado en el HQ (ej: `test@mi-marca.com`) y una contraseña de al menos 8 caracteres (ej. `test12345`).
3. Presiona **"Crear Cuenta"**.

### Paso 2: Validación Automática y Bypass del Paywall

1. Al registrarte, el sistema te redirigirá automáticamente a la vista de `/paywall`.
2. En microsegundos, la Server Action detectará tu correo corporativo, te auto-ascenderá al rol `'founder'` y te asignará `max_leagues: 1`.
3. El Paywall se transformará eliminando toda opción de cobro o pasarela de Mercado Pago. Solo verás el formulario de confirmación con el botón **"CREAR MI LIGA"** (sin textos que mencionen palabras como "gratis" o "gratuita").
4. Bautiza tu liga y haz clic en crear.

### Paso 3: Verificación Visual en Caliente

1. Tras crear tu liga, pasarás por la **Card de Bienvenida** estilizada (donde el logo de fondo es perfectamente visible y las transiciones son fluidas e instantáneas).
2. Entrarás al **Dashboard**. Comprueba que:
   - El Sidebar responsivo se tiñe de inmediato con la identidad, logo y colores de tu nueva marca.
   - El Bento Banner corporativo personalizado se muestra correctamente y se colapsa reteniendo la preferencia en la sesión.

---

## 6. Estándares de Calidad Visual (`/audit`)

- **Legibilidad:** El logo de fondo en modales debe mantener un blur sutil (2px-4px) y opacidad (18%) para acompañar sin interferir con la lectura.
- **Bypass Limpio:** El paywall de socios corporativos debe mostrar exclusivamente la tarjeta de creación de liga de forma centrada y elegante, omitiendo la columna informativa lateral de usuarios estándar.
- **Rendimiento:** Cero saltos de diseño abruptos y carga de assets en menos de 100ms.
