Estrategia de Integración: API-Football v3 🏟️
Este documento resume los aspectos clave de la API-Football (v3) enfocados exclusivamente en las necesidades del motor del Mundial 2026.

1. El Endpoint Principal: /fixtures
Esta es la ruta que llamaremos para obtener la información central del partido.

¿Qué nos devuelve que nos interesa?

Estado (fixture.status.short): Nos dirá si el partido es NS (Not Started), 1H (Primer tiempo), HT (Medio tiempo), 2H, FT (Finalizado), o PEN (Penales).
Minuto Exacto (fixture.status.elapsed): Nos da el minuto actual del partido (ej. 45, 90+3).
Goles (goals.home y goals.away): El marcador regular.
Penales (score.penalty): Vital para las fases eliminatorias si hay empate.
2. Timer: ¿Propio o de la API?
Respuesta: 100% el de la API (elapsed).

¿Por qué? Si intentas hacer un setInterval propio en el frontend para contar los minutos, se va a desincronizar inmediatamente por pausas de hidratación, revisiones del VAR, lesiones o tiempo de descuento. La API ya hace el trabajo pesado de calcular el tiempo real de juego. Nosotros solo "dibujamos" el número que ellos nos mandan.

3. Escalabilidad: Funciones Avanzadas (El Futuro)
Si decides agregar más inmersión visual a los usuarios, la API-Football separa esta información en sub-rutas para que no cargues datos innecesarios si no los pides.

Alineaciones (/fixtures/lineups)
Nos entrega los 11 titulares, suplentes, el técnico y la formación táctica (ej. "4-3-3").
Estrategia: Esto solo debe llamarse una vez unos 30 minutos antes de que empiece el partido (cuando se anuncian oficialmente). No hay que llamarlo cada minuto.
Eventos Rápidos (/fixtures/events)
Nos entrega una línea de tiempo con goles, tarjetas (amarillas/rojas), cambios y revisiones VAR.
Es perfecto para tu idea de notificaciones.
4. La Idea de las Notificaciones Push (Service Worker)
Es una excelente idea de producto para subir el engagement. Así es como funcionaría a nivel de arquitectura:

El Cron Job (Backend): Nuestro servidor (SyncService) le pregunta a la API cada 1 o 2 minutos: "¿Hubo algún evento nuevo en el partido de Argentina?"
Detección: El servidor ve que la API reporta un nuevo evento: { type: "Card", detail: "Red Card", player: "Messi" }.
El Disparo: Nuestro servidor guarda el evento en Supabase y dispara un mensaje usando la "Web Push API" hacia los navegadores de los usuarios inscritos.
El Service Worker (Frontend): El celular del usuario recibe el mensaje (incluso si la app está cerrada o en segundo plano) y muestra la notificación nativa: 🟥 "Tarjeta Roja para Messi en el min 89'".
⚠️ Precaución con esta idea (Costos)
Si pedimos datos de eventos cada minuto durante todos los partidos del Mundial para enviar notificaciones rápidas, el consumo de llamadas a la API (y por ende el costo del plan) subirá considerablemente. La caché aquí será nuestro mejor amigo.