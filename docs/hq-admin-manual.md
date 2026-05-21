# 👑 Manual de Operaciones y Referencia - Headquarters (God Mode)
## MundiApp26 - Consola Central del Administrador

Este documento es la **Guía Maestra y Técnica** definitiva de todas las herramientas instaladas en el panel de control exclusivo **Headquarters (HQ)** de MundiApp26. Diseñado para ofrecer control absoluto al Super Administrador (Yoyo), permitiendo auditar, ajustar parámetros en vivo, inyectar simulaciones y gestionar relaciones comerciales bajo políticas de seguridad militar y resiliencia total.

---

## 🗺️ Mapa de Arquitectura del HQ

El panel de control `/hq` centraliza la lógica de negocio comercial y técnica de la aplicación. Está estrictamente restringido mediante políticas RLS (Row Level Security) y validaciones del lado del servidor al rol de `'super_admin'`. Si un usuario convencional o atacante intenta acceder, el sistema lo bloquea y lo redirige automáticamente.

La interfaz está construida mediante un **Bento Grid de Alta Densidad** y visuales premium de **Glassmorphism**, organizada de la siguiente manera:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HEADQUARTERS (GOD MODE)                         │
├───────────────────────────────────────┬────────────────────────────────┤
│  COLUMNA IZQUIERDA (Negocio & Marca)  │  COLUMNA DERECHA (Operaciones) │
├───────────────────────────────────────┼────────────────────────────────┤
│  1. Control de Pasarela (Modo Test)   │  4. Sync Agent (Inyector Mock) │
│  2. Co-Branding Manager (Marca Blanca)│  5. Live API Test (Diagnóstico)│
│  3. Motor de Eliminatorias (Llaves)   │  6. Sorteo de Camiseta (Raffle)│
│                                       │  7. Control de Jugadores & Pwds│
│                                       │  8. Censo Global de Ventas     │
└───────────────────────────────────────┴────────────────────────────────┘
```

---

## 🛠️ Detalle de Módulos e Instructivos de Operación

### 1. Control de Pasarela (Modo Test) 💸
* **Propósito:** Permitir alternar el costo del *Founder Pass* en tiempo real para realizar simulaciones de compra y registros de prueba sin gastar dinero real.
* **Flujos y Parámetros:**
  * **Modo Producción:** El costo oficial es de **$50.000 ARS** (cobro real con dinero de producción).
  * **Modo Sandbox / Test:** El costo baja a **$20 ARS**, permitiendo pasar tarjetas de prueba de Mercado Pago para verificar la pasarela de punta a punta.
* **Mecanismo de Resiliencia (Circuit Breaker):** 
  El Server Action que valida los precios en caliente realiza una consulta a la tabla `app_settings` de Supabase bajo la clave `founder_pass_test_mode`. En caso de que la base de datos no responda, la tabla no exista o haya un error de latencia, el sistema **silenciosamente ignora el fallo y aplica $50.000 ARS como fallback seguro**. Así se garantiza que jamás se cobren montos de prueba por un fallo técnico temporal.

---

### 2. Co-Branding Manager (Marca Blanca) 🏢 ✨
* **Propósito:** Gestionar en caliente el bypass de pago para los gerentes de las empresas que auspician o contratan la plataforma corporativa de apuestas (ej. Globant, Accenture).
* **Flujos de Bypass de Pago:**
  1. El Administrador escribe el correo del Gerente (ej: `gerente@globant.com`) y asocia su marca.
  2. Al pulsar **Asociar**, se guarda el registro de forma instantánea en la tabla `corporate_relations` de Supabase.
  3. Cuando dicho Gerente ingresa a la App a registrarse, el sistema intercepta su correo, le otorga de forma automática el rol de `'founder'` y **le permite saltarse el pago de Mercado Pago**, dándole acceso directo para fundar su liga gratis.
* **Herencia Estética de Marca (Co-Branding):**
  Todos los empleados que se unan a esa liga mediante el código de invitación heredarán en sus dispositivos la paleta de colores de la empresa auspiciante (gradientes de marca, sombras y banner superior visible) de manera 100% reactiva.

---

### 3. Motor de Eliminatorias 🏆
* **Propósito:** Administrar la transición matemática y deportiva de la fase de grupos a la Fase Final de Eliminación Directa.
* **Algoritmo de Desempate (Mejores Terceros):**
  El motor parsea los 12 grupos de la copa y calcula con precisión milimétrica la tabla de los mejores terceros según los criterios oficiales de la FIFA (puntos, diferencia de goles, goles a favor).
* **Despliegue Atómico:**
  Al pulsar **Desplegar a la Liga**, el Server Action promueve a los 32 clasificados en el esquema de base de datos, genera las llaves de octavos/dieciseisavos y **habilita las apuestas para la Fase Final** para todos los usuarios de la plataforma en tiempo real.

---

### 4. Sync Agent (Simulador en Vivo) 🤖
* **Propósito:** Inyectar goles y resultados ficticios en caliente a los partidos jugados para verificar la reactividad de la tabla de posiciones y las apuestas de los usuarios.
* **Operación:**
  Al pulsar **Inyectar Resultados Mock**, un agente en segundo plano actualiza los partidos activos con marcadores aleatorios realistas, permitiendo simular cómo se mueven los puntajes de la "Arena de Gladiadores" y los Duelos interactivos en tiempo real.

---

### 5. Live API Test (Diagnóstico de Proveedor) 📡
* **Propósito:** Auditar la latencia y la salud de la API externa de fútbol (`API-Football`) antes de que comience el torneo oficial.
* **Operación:**
  Abre una interfaz modal interactiva que consulta el ping con el proveedor deportivo y renderiza el parseo de eventos de gol crudos. Sirve para asegurar que las credenciales y el canal de datos estén 100% operativos.

---

### 6. Sorteo de Camiseta Oficial (Raffle Module) 👕 🎲
* **Propósito:** Dinamizar la comunidad de fundadores realizando un sorteo transparente y auditable entre los primeros 50 fundadores que activaron su Founder Pass.
* **Persistencia Atómica Antifraude:**
  Al iniciar el sorteo, se despliega una ruleta cinética que gira con desenfoque de movimiento sobre los candidatos cargados. Una vez seleccionado el ganador al azar, el sistema **persiste de forma atómica y permanente** los datos de dicho ganador en la tabla `app_settings` bajo la clave `raffle_winner`. De esta forma, el ganador queda sellado y protegido contra recargas accidentales o intentos de alterar el sorteo. Solo el Super Admin puede anular el sorteo de forma manual mediante el botón "Limpiar Sorteo".

---

### 7. Control de Jugadores & Claves Extraviadas 🔑
* **Propósito:** Proporcionar soporte técnico inmediato a gerentes y usuarios con problemas de ingreso sin necesidad de flujos de email de recuperación complejos.
* **Acciones Clínicas:**
  * **Buscador Reactivo:** Filtra en tiempo real a los jugadores registrados tipeando su alias o email.
  * **Restablecimiento Forzado de Contraseña:** Escribe una contraseña nueva (o déjala vacía para asignar `123456` por defecto) y presiona "Restablecer". El Server Action utiliza las credenciales administrativas de Supabase Auth para sobreescribir la clave del usuario en caliente en menos de 100ms, permitiéndole el ingreso inmediato.

---

### 8. Censo Global de Ventas (Mercado Pago) 💸
* **Propósito:** Visualizar de forma transparente los ingresos reales del proyecto.

#### 🚨 Diagnóstico de Ventas Fantasmas (El Error Resuelto)
* **El Problema Original:** 
  Al consultar directamente la API de Mercado Pago con tu token de producción (`/v1/payments/search`), esta devolvía los últimos 30 cobros registrados de toda tu cuenta. Si utilizabas esa misma cuenta comercial para recibir cobros de otros emprendimientos o realizabas pruebas antiguas, estas aparecían de forma errónea en la pantalla del HQ bajo estados "aprobados" y asociadas a ligas inexistentes ("Desconocidas").
* **La Causa Técnica:**
  El filtro previo de filtrado (`p.league_name !== null || p.description.includes("MundiApp26")`) era demasiado débil. Permitía el ingreso de transacciones viejas cuyos correos electrónicos de procedencia ni siquiera estaban registrados como usuarios reales en la base de datos de producción de MundiApp26.
* **La Solución Implementada (Censo Atómico Cruzado):**
  Desarrollamos una lógica de **cruzamiento bidireccional en caliente** en el backend:
  1. El Server Action realiza una consulta administrativa ultra veloz a la tabla `profiles` de Supabase para obtener en memoria los emails e IDs de todos los usuarios registrados.
  2. Se descarga el historial ampliado de Mercado Pago (últimas 50 transacciones) y se filtra bajo tres reglas obligatorias:
     * **Regla de Existencia:** El email del pagador o su `user_id` de metadata **debe existir** de forma estricta en el listado de usuarios legítimos registrados en Supabase.
     * **Regla de Identificación:** Debe tener metadata de liga de MundiApp26 o contener `"MundiApp26"` en la descripción de Mercado Pago.
     * **Regla de Fecha Límite:** Se descarta todo pago anterior al **1 de mayo de 2026** (descartando así pruebas viejas del año pasado y cobros huérfanos).
* **El Resultado:**
  El censo de ventas en vivo ahora es **100% puro y auditable**, mostrando exclusivamente los cobros reales correspondientes a usuarios reales de tu aplicación.

---

## 🔒 Protocolos de Seguridad y Mantenimiento Obligatorio

1. **Uso del Modo Test:** Mantén el modo de precios simulados (`Modo Test`) desactivado en producción. Actívalo únicamente de forma controlada cuando audites la pasarela de cobros o des una demo interactiva.
2. **Tablas de Configuración:** En caso de realizar un reseteo total de la base de datos en Supabase, recuerda ejecutar los scripts SQL en el orden correcto en `/docs/sql-migrations/` para recrear las tablas de marcas corporativas y configuraciones del sistema.

---
*Manual propiedad de MundiApp26. Compilado con orgullo por Antigravity (2026).*
