"use client";

import { useState, useEffect } from 'react';
import { savePushSubscriptionAction } from '@/app/actions/push';

// Helper para convertir el VAPID public key de base64 a Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
 
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
 
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // 1. Verificar soporte
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // 2. Revisar si ya estamos suscritos en este navegador
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) setSubscription(sub);
        });
      });
    }
  }, []);

  const subscribeToPush = async () => {
    if (!isSupported) return { success: false, error: "Notificaciones no soportadas" };
    setIsSubscribing(true);

    try {
      // 1. Solicitar Permiso explícito al usuario
      const perm = await Notification.requestPermission();
      setPermission(perm);
      
      if (perm !== 'granted') {
        throw new Error("Permiso denegado por el usuario.");
      }

      // 2. Obtener el Service Worker registrado
      const registration = await navigator.serviceWorker.ready;

      // 3. Obtener la llave pública VAPID desde el entorno
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID_PUBLIC_KEY no configurada en el cliente.");
      }

      // 4. Suscribirse usando PushManager
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, // Obligatorio por seguridad (Chrome lo exige)
        applicationServerKey: convertedVapidKey
      });

      // Parsear a un objeto simple de JavaScript (Next.js Server Actions no aceptan objetos nativos del navegador)
      const subJSON = pushSubscription.toJSON();
      const payload = {
        endpoint: pushSubscription.endpoint,
        p256dh: subJSON.keys ? subJSON.keys.p256dh : null,
        auth: subJSON.keys ? subJSON.keys.auth : null,
      };

      // 5. Guardar la suscripción en nuestra DB (Supabase)
      const res = await savePushSubscriptionAction(payload);
      
      if (!res.success) {
        throw new Error(res.error || "Error guardando la suscripción en el servidor.");
      }

      setSubscription(pushSubscription);
      return { success: true };
    } catch (error: any) {
      console.error("Error suscribiendo a push:", error);
      return { success: false, error: error.message };
    } finally {
      setIsSubscribing(false);
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    isSubscribing,
    subscribeToPush
  };
}
