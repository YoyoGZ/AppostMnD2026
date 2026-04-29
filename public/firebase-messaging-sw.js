// Firebase Service Worker (Minimal Placeholder)
// Este archivo silencia el error 404 en la consola y permite la inicialización de Firebase Messaging si es necesario.

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// El SDK lee la configuración de los parámetros de la URL automáticamente
// si se está usando la técnica de inicialización dinámica detectada en los logs.
