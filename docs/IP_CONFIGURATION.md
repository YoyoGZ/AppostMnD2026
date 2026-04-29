# 🌐 Guía de Configuración de IP Local

Esta guía explica cómo actualizar la dirección IP del proyecto cuando cambias de ubicación física o de red WiFi. Esto es necesario para que el acceso móvil (QR) y el sistema de actualizaciones en tiempo real (HMR) funcionen correctamente.

---

## 1. Obtener tu IP Actual
Abre una terminal en Windows y ejecuta:
```powershell
ipconfig
```
Busca la sección **"Adaptador de LAN inalámbrca Wi-Fi"** y anota tu **Dirección IPv4** (ejemplo: `192.168.1.40`).

---

## 2. Actualizar el Código QR (Móvil)
Abre el archivo `.env.local` en la raíz del proyecto y actualiza la variable:
```env
NEXT_PUBLIC_LOCAL_IP=TU_NUEVA_IP_AQUI
```
*Esto asegura que el QR generado en la pantalla de inicio apunte a la dirección correcta.*

---

## 3. Actualizar Permisos de Seguridad (Next.js)
Abre el archivo `next.config.ts` en la raíz del proyecto y actualiza el arreglo `allowedDevOrigins`:
```typescript
const nextConfig: NextConfig = {
  /* ... */
  allowedDevOrigins: ["TU_NUEVA_IP_AQUI"],
};
```
*Esto permite que tu celular se conecte al servidor de desarrollo sin ser bloqueado.*

---

## 4. Reiniciar el Servidor
Para que los cambios surtan efecto, debes reiniciar el proceso en la terminal:
1. Presiona `Ctrl + C` para detener el servidor.
2. Ejecuta:
```bash
npm run dev
```

---

> [!IMPORTANT]
> Ambos pasos son obligatorios. Si solo actualizas uno, el proyecto cargará en el celular pero no se conectará a la base de datos o no se actualizará solo.
