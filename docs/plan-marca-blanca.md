# 🏢 Plan de Integración: Marca Blanca Corporativa (Co-Branding)

Este documento detalla el plan de integración, la arquitectura y los pasos paso a paso para implementar la **Marca Blanca Corporativa (Co-Branding)** en **MundiApp26** de manera limpia, modular y robusta.

---

## 1. WHY - ¿Por qué esta solución?

### A. Contexto
Las empresas que patrocinan ligas en MundiApp26 (ej: Globant, Accenture, Mercado Libre) desean una experiencia personalizada para sus colaboradores.
Tradicionalmente, esto requeriría clones de la app, variables de entorno complejas o bases de datos redundantes.

### B. Nuestra Propuesta: Herencia Visual Relacional
Diseñamos un sistema donde **no duplicamos código ni esquemas de bases de datos**:
1. **Bypass de Paywall:** Los Gerentes Corporativos (Founders) se pre-registran mediante sus correos corporativos en la tabla `corporate_relations`. Al crear su cuenta con su correo y una contraseña personalizada, el sistema reconoce el email, les asigna automáticamente el rol de `'founder'` y les permite saltar el paywall de Mercado Pago para crear su liga de forma 100% gratuita.
2. **Herencia Dinámica (Miembros):** Los empleados se registran de forma estándar y se unen a la liga mediante el link normal. Al navegar por la app, el sistema detecta que pertenecen a una liga cuyo creador (Founder) está asociado a una marca patrocinadora en `corporate_relations`. Esto gatilla la carga de estilos dinámicos en caliente desde `brand-themes.json`.
3. **UI Mobile-First No Intrusiva:** La pantalla en celulares se mantiene limpia y libre de banners molestos en Fixtures o Duelos. Implementamos un encabezado estético "Bento" desmontable con `sessionStorage` que reaparece únicamente en una nueva sesión, y teñimos los iconos activos del Sidebar con el color de acento corporativo. En escritorio se despliega una barra lateral con el gradiente de la marca y logotipos co-brandeados.

---

## 2. HOW - Arquitectura del Sistema

### A. Capa de Datos (Híbrida)
1. **Base de Datos (Supabase):**
   - Una única tabla dinámica y liviana `corporate_relations` que mapea `email` (PK) -> `brand_id`.
   - Se puebla a través del panel administrativo `/hq`.
2. **Diccionario Estático (`src/data/brand-themes.json`):**
   - Mantiene los estilos CSS de Tailwind, degradados, textos y rutas de imágenes para cada marca. Esto previene fallas de build en Vercel.

### B. Algoritmo de Resolución de Marca (Dynamic Resolve)
Para cualquier usuario activo en la app:
```typescript
1. Obtener liga activa del usuario (de `league_members`).
2. Obtener el creador (`created_by`) de esa liga (de `leagues`).
3. Obtener el email del creador (de `profiles`).
4. Buscar correspondencia en `corporate_relations` por ese email.
5. Si existe → Retornar el `brandTheme` de `brand-themes.json`.
6. Si no existe o no tiene liga → Retornar `null` (Tema por defecto: Oro & Oscuro).
```

---

## 3. Plan de Implementación Paso a Paso

### Hito 1: Creación de la Carpeta de Assets
- Crear la carpeta física `public/assets/brands` para almacenar los logotipos corporativos.
- Crear un archivo temporal o placeholder para probar con la marca `'globant'`.

### Hito 2: Integración del Rol en el Registro (Sign Up Bypass)
- **Desafío:** Supabase inserta automáticamente en la tabla `profiles` mediante un trigger tras el `signUp`.
- **Solución:** Modificar la Server Action de creación de perfiles o el trigger de Supabase, o en su defecto, en el flujo de `/paywall` y registro del cliente, interceptar si el correo ingresado está pre-aprobado como corporativo.
- **Flujo Específico en Paywall:**
  - Cuando el usuario llega a `/paywall`, consultamos su email en `corporate_relations`.
  - Si coincide, actualizamos su rol a `'founder'` en `profiles` y le habilitamos la creación de liga gratis.

### Hito 3: Proveedor de Contexto de Marca Blanca (`BrandProvider` / `useBrand`)
- Crear un context React en `/src/context/BrandContext.tsx`.
- Este Context/Hook obtendrá la marca correspondiente a la liga activa del usuario al cargar la app y proveerá los tokens visuales a todos los componentes de la interfaz.

### Hito 4: Inyección en el Sidebar (`Shell.tsx` & `Sidebar.tsx`)
- **En Móviles:** Teñir los iconos activos y el hover con el color de acento de la marca (ej: `#8feb16` de Globant) sin agregar logos ruidosos.
- **En Escritorio:** Cambiar el gradiente de fondo de la barra lateral al gradiente del patrocinador, e inyectar el logo corporativo junto al escudo de MundiApp26.

### Hito 5: Bento Header Desmontable en el Dashboard
- Crear un componente `CorporateBentoHeader.tsx` en `src/components/dashboard`.
- Mostrará el banner corporativo de forma elegante con Glassmorphism.
- Si el usuario presiona `"X"`, se oculta y se guarda la preferencia en `sessionStorage` para no molestar la navegación fluida.

### Hito 6: Pruebas con el Email `'test'`
- Usaremos el email `'test@globant.com'` o `'test.founder@globant.com'` inyectados en la base de datos para simular la experiencia completa de bypass de pago y co-branding.

---

## 4. Plan de Verificación y Criterios de Aceptación (Visual Gate)

1. **Prueba de Bypass:** Registrar un usuario con el email `test.founder@globant.com` y verificar que salta el pago de Mercado Pago, permitiéndole fundar su arena de forma gratuita.
2. **Prueba de Herencia:** Registrar un empleado e ingresarlo en la liga del founder corporativo. Confirmar que hereda los colores corporativos.
3. **Prueba de Estética Mobile-First:** Comprobar la visualización en el emulador móvil del navegador. El Bento Header debe ser colapsable y el Tab Bar debe ser elegante e interactivo.
4. **Verificación de Performance:** Cero saltos de layout (Layout Shifts) y feedback instantáneo en el click de colapsado.
