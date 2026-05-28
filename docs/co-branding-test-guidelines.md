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

## 4. Configuración para Pruebas (Email "test")

Para realizar las pruebas de extremo a extremo sin intervenir datos reales, utilizaremos la siguiente configuración en nuestra base de datos:

### A. Estructura de Datos en Supabase

El sistema se apoya en la tabla `corporate_relations` para identificar a los founders asociados a marcas corporativas.

```sql
-- Tabla de relaciones corporativas
CREATE TABLE IF NOT EXISTS public.corporate_relations (
  email text PRIMARY KEY,
  brand_id text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas RLS
ALTER TABLE public.corporate_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de relaciones corporativas"
  ON public.corporate_relations FOR SELECT USING (true);
```

### B. Registros de Prueba Inyectados

Para simular el flujo, vinculamos correos de prueba a la marca patrocinadora `'globant'`:

1. **Email del Founder Corporativo:** `test.founder@globant.com`
   - *Rol esperado:* Al ingresar al `/paywall`, el sistema lo promoverá a `'founder'` automáticamente. Podrá crear su Arena Corporativa de forma 100% gratuita.
2. **Email del Empleado/Miembro Invitado:** `test@globant.com` (o cualquier email que se una a la liga creada por el Founder Corporativo).
   - *Resultado visual esperado:* Al ingresar a la aplicación, heredará dinámicamente el tema visual de **Globant** (Verde brillante y fondo degradado oscuro).

---

## 5. Comprobación Paso a Paso de la Integración

### Paso 1: Inicializar la carpeta de Assets

Crearemos la carpeta `public/assets/brands` para almacenar los logotipos corporativos.

### Paso 2: Modificación del Dashboard (`dashboard/page.tsx`)

Inyectaremos el componente `<CorporateBentoHeader />` de forma dinámica:

- Consultamos en un `useEffect` asíncrono la Server Action `resolveBrandThemeAction()`.
- Guardamos el tema retornado en el estado local de React.
- Renderizamos el banner bento bajo el header principal si el tema corporativo está presente.

### Paso 3: Flujo de Pruebas

1. **Paso 3.1: Registro de Cuenta de Prueba**
   - Registrarse con el correo `test.founder@globant.com`.
2. **Paso 3.2: Omisión del Paywall**
   - Ir a la ruta `/paywall`. El sistema detectará que es un email corporativo pre-aprobado y cambiará su rol a `'founder'`. Se habilitará de inmediato la creación de liga gratuita.
3. **Paso 3.3: Creación de la Liga**
   - Crear una liga (ej: "Globant Premium Cup"). Esto vincula la liga al ID de este usuario creador.
4. **Paso 3.4: Verificación Visual**
   - Entrar al Dashboard. Comprobar que el Sidebar de PC y móvil se tiñe con la identidad corporativa de Globant (verde `#8feb16`).
   - Comprobar que aparece el Bento Banner: "Copa Globant 2026 🟢".
   - Probar el botón de colapso `"X"` del Bento Banner y verificar que desaparece con transición y que no se vuelve a mostrar al recargar (gracias a `sessionStorage`).

---

## 6. Control de Calidad Visual (`/audit`)

El sistema debe cumplir con los siguientes estándares de calidad:

- **Modularidad:** El banner Bento debe respetar los espacios del grid y no descuadrar la interfaz móvil.
- **Micro-animaciones:** La transición de salida al hacer clic en la `"X"` debe ser suave y durar exactamente 400ms (`slide-up`).
- **Mobile First:** El Tab Bar inferior móvil no debe contener logos ruidosos, solo pintar el icono activo del color de la marca.
- **Rendimiento:** Cero saltos bruscos de diseño al resolver el tema en caliente.
