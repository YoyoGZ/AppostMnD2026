"use client";

import React, { useState } from "react";
import { RegistrationModal } from "./RegistrationModal";

export function LandingWrapper({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Si el elemento o sus padres tienen el atributo data-modal-trigger="register"
    if (target.closest('[data-modal-trigger="register"]')) {
      e.preventDefault();
      setIsModalOpen(true);
    }
  };

  return (
    <div onClick={handleClick} className="w-full min-h-screen">
      {children}
      <RegistrationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
