# Plan de Implementación - Cartel de Bienvenida a Capitanes & Sorteo de Camiseta 🇦🇷

Este documento detalla el plan técnico y de diseño para integrar un cartel (modal) interactivo de bienvenida y reconocimiento para los Capitanes (Founders) de **MundiApp26**. Informará de manera gamificada qué número de liga global han creado y los habilitará explícitamente para el sorteo de la camiseta oficial de la Selección Argentina.

## User Review Required

> [!IMPORTANT]
> **Interrupción de Flujo Intencionada:** El modal de bienvenida **no tendrá botón "X" en la esquina superior derecha** ni se cerrará al hacer click fuera de él. Esto obligará al usuario a leer el mensaje y presionar un gran botón de acción dorado ("¡VAMOS POR ESA CAMISETA! 🇦🇷") para cerrarlo.
> **Persistencia sin sobrecarga (Supabase Auth):** La marca de que el usuario ya leyó el cartel se guardará en los metadatos de autenticación del usuario en Supabase (`user_metadata.welcome_sorteo_shown`). Esto evita tener que agregar columnas a la base de datos y garantiza que el modal aparezca solo una vez, sincronizándose entre todos sus dispositivos (celular y PC).

---

## Proposed Changes

Proponemos la creación de un nuevo componente y la modificación del layout principal para inyectar esta lógica relacional en caliente:

### 1. Backend / Cálculo Dinámico del Número de Liga

#### [MODIFY] [layout.tsx](file:///c:/Users/triun/AFlexe_Project/Mundial2026/src/app/(dashboard)/layout.tsx)
* En el Layout de rutas protegidas (Server Component), si el usuario actual es creador de alguna liga, calcularemos de forma matemáticamente exacta qué número de liga global fundó.
* **El algoritmo dinámico:**
  1. Buscamos la fecha de creación (`created_at`) de su primera liga fundada en la tabla `leagues`.
  2. Contamos cuántas ligas existen globalmente en la base de datos cuya fecha de creación sea menor o igual a la de su liga (`lte`).
  3. Esto nos devuelve su posición secuencial exacta (ej: 14 ligas previas + la suya = Creador Nro 15).
* Pasaremos este número dinámico y el estado del flag (`welcome_sorteo_shown`) al nuevo componente cliente.

---

### 2. Frontend / Componente de Alta Fidelidad

#### [NEW] [WelcomeSorteoModal.tsx](file:///c:/Users/triun/AFlexe_Project/Mundial2026/src/components/dashboard/WelcomeSorteoModal.tsx)
* Diseñar un modal premium e interactivo con estética **Estadio Nocturno**:
  * **Overlay:** Fondo negro con un blur ultra-profundo (`backdrop-blur-2xl bg-black/85`) para tapar completamente el dashboard de fondo y focalizar la atención.
  * **Tarjeta Bento Glassmorphism:** Caja flotante con degradado radial dorado tenue, bordes brillantes de contraste (`border-white/10`) y destellos solares.
  * **El Contenido:**
    * Un mensaje de bienvenida caluroso en español coloquial.
    * Una mini-card Bento elegante que contiene la leyenda literal requerida:
      `"Sos el Creador de Liga Nro XX, estate atento al sorteo de la camiseta, te lo comunicaremos a tu email"`
  * **El Botón de Acción Obligatorio:** Un gran botón dorado brillante (`bg-primary hover:bg-primary/95 text-black font-black tracking-widest uppercase rounded-2xl animate-pulse`) con el texto: **`¡VAMOS POR ESA CAMISETA! 🇦🇷`**.
  * Al hacer click en el botón:
    * Se llama a `supabase.auth.updateUser({ data: { welcome_sorteo_shown: true } })` para guardar el estado permanentemente en Supabase.
    * Se cierra el modal con una animación suave de desvanecimiento (`fade-out`).

---

### 3. Integración en el Dashboard Layout

#### [MODIFY] [layout.tsx](file:///c:/Users/triun/AFlexe_Project/Mundial2026/src/app/(dashboard)/layout.tsx)
* Importar e inyectar el componente `<WelcomeSorteoModal leagueNumber={leagueNumber} alreadyShown={alreadyShown} />` justo dentro del renderizado, para que actúe como guardián de entrada a cualquier ruta protegida del dashboard.

---

## Plan de Verificación

### Pruebas Manuales y de Caja Negra
1. **Verificación de Cálculo de Posición:**
   * Crear una liga en una cuenta nueva y verificar en consola o base de datos que el conteo de ligas creadas antes que ella coincide exactamente con su número asignado.
2. **Prueba de Persistencia Unica (One-Shot):**
   * Al ingresar al dashboard tras realizar la simulación del pago, el modal debe aparecer tapando toda la pantalla de forma majestuosa.
   * Intentar presionar la tecla `Escape` o hacer click fuera del modal. El cartel debe permanecer inalterado en pantalla (cierre bloqueado).
   * Hacer click en el botón "¡VAMOS POR ESA CAMISETA! 🇦🇷". El modal debe cerrarse con una animación fluida.
   * Recargar la página o ingresar desde otro navegador. El modal **no debe volver a aparecer**, validando la persistencia de metadatos de Supabase.
3. **Prueba de Miembros Invitados (Seguridad de Trato):**
   * Un usuario invitado normal (`member`) no debe ver este modal al ingresar al dashboard, ya que está reservado exclusivamente para los Founders que fundan ligas.
