"use client";

import React, { useEffect, useState } from "react";

export const DynamicQR = () => {
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const port = window.location.port ? `:${window.location.port}` : "";
      
      // Si estamos en localhost, intentamos usar la IP local inyectada por el sistema
      const localIp = process.env.NEXT_PUBLIC_LOCAL_IP;
      
      if ((hostname === "localhost" || hostname === "127.0.0.1") && localIp) {
        setQrUrl(`${protocol}//${localIp}${port}`);
      } else {
        setQrUrl(`${protocol}//${hostname}${port}`);
      }
    }
  }, []);

  if (!qrUrl) return null;

  return (
    <div className="mt-8 flex flex-col items-center opacity-40 hover:opacity-100 transition-opacity duration-300">
      <p className="text-[9px] text-primary/80 uppercase tracking-[0.2em] font-black pb-3 text-center">
        Mobile Live Preview
      </p>
      <div className="bg-white/90 p-2 rounded-2xl shadow-[0_0_25px_rgba(251,191,36,0.15)] ring-1 ring-white/20">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrUrl}`}
          alt="QR Code"
          className="w-20 h-20 md:w-24 md:h-24 opacity-90 hover:opacity-100 transition-opacity mix-blend-multiply"
        />
      </div>
      <p className="text-[8px] text-white/20 mt-2 font-mono">{qrUrl}</p>
    </div>
  );
};
