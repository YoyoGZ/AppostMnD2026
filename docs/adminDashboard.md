# Especificaciones de Fase 5: Monetización y God Mode

Este documento centraliza el modelo arquitectónico para la monetización de la plataforma y el panel de administración central ("God Mode"), diseñados para asegurar ingresos y proteger la integridad del proyecto.

## 1. Modelo de Monetización: "Burnable Tokens" (Pases Desechables)

El problema principal a resolver es evitar la reventa, viralización o uso compartido de links de acceso pagados. Se utilizará un sistema de "Single-use Invite Link".

### Flujo de Acceso Seguro
1. **Generación**: El Super Admin genera un "Pase VIP" (Token UUIDv4). En la base de datos de Supabase, este token nace con la propiedad `is_used: false` y está atado a una Liga Premium específica.
2. **Distribución**: El comprador recibe el pase tras realizar el pago.
3. **Validación Perimetral**: Si un usuario entra al link, el servidor consulta el estado del token. Si `is_used: true`, se bloquea el acceso instantáneamente con una pantalla roja de alerta: *"Este pase ya ha sido canjeado"*.
4. **Combustión del Token (El momento crítico)**: El link NO se quema cuando el usuario simplemente carga la página. Se quema en el instante exacto en que hace clic en "Crear Cuenta / Unirme". Esto se ejecuta como una **Transacción Atómica (ACID)** en la base de datos:
   - Supabase asocia el usuario a la liga.
   - En la misma petición, se actualiza el token a `is_used: true` y `used_by: [user_id]`.
   - Si dos personas clickean el link al mismo milisegundo exacto, la base de datos procesa una, la bloquea, y rechaza a la otra previniendo ataques de "Race Condition".

## 2. El "God Mode" (Dashboard Super Admin)

Un entorno aislado dentro de la App (ej. la ruta `/hq` o `/godmode`), reservado exclusivamente para la cuenta del fundador. Estará protegido por un campo de base de datos `role: 'super_admin'`.

### Features Core del Panel:
- **Fábrica de Tokens**: Capacidad para generar un token único, o generar lotes de 10, 50 o 100 links de acceso masivo.
- **Censo Global (Monitor de Compradores)**: Data grid en vivo mostrando quiénes entraron, a qué liga se unieron, y con qué token lo hicieron. Permite vigilar el tráfico y detectar cuellos de botella en la conversión.
- **Control del Oráculo (API de Partidos)**: Tablero de diagnóstico para ver si el servidor está conectado a la API de resultados en tiempo real y cuándo fue la última sincronización.

### Features Anti-Fraude e Intervención Manual:
- **El "Botón Rojo" (Oráculo Manual)**: Posibilidad de forzar el resultado de un partido a mano y recalcular los puntajes de todos los gladiadores del sistema. Esencial para emergencias (caídas de API, revisiones de VAR posteriores al pitazo final).
- **Revocación de Accesos**: Botón de un solo clic para desactivar un pase o expulsar a un usuario del sistema (ej. en caso de un "Contracargo" de tarjeta de crédito).
- **Sistema de Anuncios Globales**: Input para publicar "Banners" en todos los Dashboards de la aplicación de forma inmediata (ej. "Octavos de final activados").
- **Modo Mantenimiento**: Switch maestro que expulsa a todos los usuarios a una pantalla de "Mantenimiento Programado", protegiendo la base de datos durante migraciones críticas.

---

## 3. Discusión de UX/UI: ¿Links vs. Códigos QR?

*Implementar la entrega del token de acceso a través de un Código QR encapsulado en una "Entrada Digital" es una de las estrategias visuales más fuertes.*

### El Problema del QR Móvil
Si el usuario compra el acceso desde su propio celular y recibe un QR por WhatsApp, no puede escanear su propia pantalla fácilmente sin una segunda app. 

### La Solución "The House Way" (Graphic Ticket)
El usuario que paga NO recibe simplemente un texto pelado. Recibe un **"Pase VIP Digital"** (una imagen estilizada) que contiene:
1. **El Arte**: Branding premium del Fixture Mundial 2026.
2. **El Código QR**: Que funciona de maravilla si alguien compra las entradas en la PC y las escanea con el celular, o si se las quiere regalar físicamente a un empleado o amigo.
3. **El Botón/Link Clickeable (URL corta debajo del QR)**: Para los que reciben el ticket en el mismo celular donde lo van a usar, basta con tocar el link o botón incrustado en el documento (PDF/HTML interactivo) para ser inyectados directamente al flujo de registro de la App.

De este modo se logra la exclusividad visual del "Ticket de Entrada" sin generar fricciones en la adopción móvil.
