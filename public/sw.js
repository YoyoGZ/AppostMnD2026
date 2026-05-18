self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});


// Interceptar Push Notifications desde nuestro servidor
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'MundiApp26';
    const options = {
      body: data.body || 'Tienes una nueva alerta de la Liga.',
      icon: '/icon.svg',
      badge: '/icon.svg',
      vibrate: [200, 100, 200],
      data: data.data || { url: '/' }, // Permite enviar una URL destino
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error('Error parseando push data', error);
  }
});

// Acción al hacer clic en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si la app ya está abierta, enfocamos esa pestaña y navegamos
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Si está cerrada, la abrimos en la ruta que indica la notificación
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
