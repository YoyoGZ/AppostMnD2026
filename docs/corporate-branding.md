# 🏢 Marca Blanca Corporativa (Co-Branding White-Label)

Este documento detalla la arquitectura, el flujo de negocio y las especificaciones de diseño para la personalización dinámica de ligas corporativas patrocinadas (Marca Blanca) en **MundiApp26**.

---

## 1. Visión del Producto

La app permite a organizaciones y empresas patrocinadoras (ej: Globant, Accenture, Mercado Libre) contratar ligas privadas premium para sus colaboradores.
Para ofrecer una experiencia exclusiva ("VIP") sin generar fricción en el registro tradicional ni duplicar el código, se ha diseñado una **arquitectura híbrida de herencia visual**:

1. **Branding Dinámico en Caliente:** Los usuarios normales experimentan el diseño estándar premium (dorado y negro) de MundiApp26. Los miembros de ligas corporativas heredan dinámicamente un tema visual personalizado (degradados de fondo en Sidebar, logotipo de co-branding, colores de acento y banners motivacionales).
2. **Registro sin Fricciones:** Los empleados corporativos se registran con el formulario estándar de la aplicación y heredan la marca automáticamente al unirse a la liga de su gerente (Founder), sin necesidad de que la aplicación conozca sus correos de antemano.
3. **Omisión de Paywall (Bypass):** Los Gerentes (Founders corporativos) pre-registrados en el panel de HQ por el Administrador pueden crear su cuenta y fundar su liga de forma gratuita, salteando la pasarela de pagos de Mercado Pago.

---

## 2. Flujo de Datos y Secuencia

[HQ Admin (Yoyo)]
       │ (1) Pre-registra email del Gerente
       ▼
[Tabla: corporate_relations] ──► (ej: gerente@ globant.com -> brand_id: 'globant')
       │
       ▼ (2) Gerente se registra en la App
[Server Action: Sign Up] ──► Consulta si el email está pre-registrado
       │                     ├── SÍ: Asigna role: 'founder' en profiles
       │                     └── NO: Asigna role: 'member' en profiles (flujo normal)
       ▼
[Pantalla: /paywall] ──► Detecta role: 'founder' corporativo
       │                 └── Muestra botón: "Crear mi Arena Corporativa Gratis"
       ▼
[Tabla: leagues] ──► Crea la liga corporativa y genera invite_code (ej: GLB26)
       │
       ▼ (3) Gerente comparte el link /join/GLB26 con sus 9 empleados
[Invitados (Empleados)] ──► Se registran con emails normales y se unen a la liga
       │
       ▼ (4) Al entrar al Dashboard / Standings / Shell
[Consulta en Servidor] ──► Obtiene la liga activa ──► Obtiene el creador (Gerente)
                           ──► Consulta brand_id en corporate_relations
                           ──► Carga brand-themes.json (Globant)
                           ──► Tiñe la interfaz en caliente

---

## 3. Arquitectura Técnica (Data & Assets)

### A. Estructura de Base de Datos (Supabase)

Tabla liviana `corporate_relations` para asociar correos electrónicos con marcas pre-aprobadas.

```sql
CREATE TABLE public.corporate_relations (
  email text PRIMARY KEY,                       -- El email del Founder corporativo
  brand_id text NOT NULL,                       -- ID del patrocinador (ej: 'globant')
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.corporate_relations ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Lectura pública de relaciones corporativas" 
  ON public.corporate_relations FOR SELECT USING (true);

CREATE POLICY "Modificación exclusiva de super admins" 
  ON public.corporate_relations FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );
```

### B. Diccionario Estático de Temas (`src/data/brand-themes.json`)

Almacena de forma centralizada y segura los assets y tokens de diseño para las marcas patrocinantes, blindando al servidor frente a problemas de compilación en Vercel.

```json
{
  "globant": {
    "name": "Globant",
    "logo": "/assets/brands/globant-logo.png",
    "accentColor": "#8feb16",
    "sidebarBg": "bg-gradient-to-b from-[#111111] via-[#203316] to-[#0a0a0a]",
    "sidebarText": "text-[#8feb16]",
    "accentText": "text-[#8feb16]",
    "accentBorder": "border-[#8feb16]/30",
    "dashboardBanner": {
      "title": "Copa Globant 2026 🟢",
      "description": "¡Demostrá tu nivel en el fixture interno, competí contra tus compañeros de celda y ganá premios corporativos de Globant!",
      "accentBg": "bg-[#8feb16]/10 border-[#8feb16]/20"
    }
  },
  "accenture": {
    "name": "Accenture",
    "logo": "/assets/brands/accenture-logo.png",
    "accentColor": "#a100ff",
    "sidebarBg": "bg-gradient-to-b from-[#111111] via-[#211432] to-[#0a0a0a]",
    "sidebarText": "text-[#a100ff]",
    "accentText": "text-[#a100ff]",
    "accentBorder": "border-[#a100ff]/30",
    "dashboardBanner": {
      "title": "Arena Accenture 2026 🟣",
      "description": "El fixture exclusivo donde la estrategia, el análisis predictivo y el fútbol se cruzan para coronar al gladiador tecnológico.",
      "accentBg": "bg-[#a100ff]/10 border-[#a100ff]/20"
    }
  }
}
```

---

## 4. Lineamientos de Diseño UI/UX (Mobile-First)

1. **La Pantalla de Celular es Sagrada:** Para evitar sobrecargar la vista vertical ultra-comprimida en celulares, **no mostramos banners corporativos fijos gigantes**.
2. **Corporate Bento Header (Dashboard):** Se renderiza un banner Glassmorphism de tan solo 80px de alto en el Dashboard. Contiene una cruz `"X"` que colapsa el banner suavemente y almacena su estado en `sessionStorage` para no volver a aparecer durante la sesión actual del usuario. En la pantalla de Partidos (Fixture) y Duelos, el banner está ausente para asegurar la concentración en las apuestas.
3. **Tab Bar Inferior Reactiva (Móvil):** El Sidebar inferior en móvil no lleva logos de la empresa contratante para no generar ruido. Sin embargo, el icono activo de la barra cambia sutilmente su color de selección al color de acento corporativo de la marca (ej: verde brillante para Globant).
4. **Sidebar Completo (Escritorio PC):** En la versión de escritorio, el Sidebar vertical se tiñe elegantemente con el degradado Glassmorphism oscuro del patrocinador y despliega una cabecera de co-branding que une el logotipo de MundiApp26 con el logo de la empresa.

---

## 5. Matriz de Roles y Accesos

| Rol | ¿Paga Franquicia? | ¿Funda Liga? | ¿Invita Empleados? | ¿Hereda Branding? |
| :--- | :--- | :--- | :--- | :--- |
| **Founder Corporativo (Gerente)** | ❌ No (Pre-Aprobado) | ✅ Sí | ✅ Sí (Hasta 9) | ✅ Sí (100%) |
| **Empleado Invitado** | ❌ No | ❌ No | ❌ No | ✅ Sí (Heredado de su Liga) |
| **Gladiador Normal** | ✅ Sí ($50.000 ARS) | ✅ Sí | ✅ Sí (Hasta 9) | ❌ No (Tema clásico dorado) |
