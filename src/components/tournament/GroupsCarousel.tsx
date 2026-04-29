"use client";

import React, { useState } from "react";
import { TournamentCard } from "./TournamentCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Team } from "@/types/tournament";

type GroupData = {
  letter: string;
  teams: Team[];
};

type GroupsCarouselProps = {
  groups: GroupData[];
  onActiveGroupChange?: (letter: string) => void;
};

export const GroupsCarousel = ({ groups, onActiveGroupChange }: GroupsCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = React.useRef<number | null>(null);
  const touchEndX = React.useRef<number | null>(null);

  // Notificar al padre cuando cambie el grupo activo
  React.useEffect(() => {
    if (onActiveGroupChange && groups[activeIndex]) {
      onActiveGroupChange(groups[activeIndex].letter);
    }
  }, [activeIndex, groups, onActiveGroupChange]);

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % groups.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + groups.length) % groups.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null; // resetear final
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    
    const distance = touchStartX.current - touchEndX.current;
    
    // Si el deslizamiento es significativo (más de 50px)
    if (distance > 50) {
      nextSlide();
    } else if (distance < -50) {
      prevSlide();
    }
    
    // Limpiar refs para el prox swipe
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center py-6">
      {/* Botones de navegación laterales */}
      <div className="absolute w-full flex justify-between px-2 sm:px-8 z-20 pointer-events-none top-1/2 -translate-y-1/2">
        <button
          onClick={prevSlide}
          className="pointer-events-auto p-3 bg-background/80 hover:bg-background rounded-full shadow-lg backdrop-blur-md hover:scale-110 active:scale-95 transition-all text-primary border border-border/50"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="pointer-events-auto p-3 bg-background/80 hover:bg-background rounded-full shadow-lg backdrop-blur-md hover:scale-110 active:scale-95 transition-all text-primary border border-border/50"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Contenedor principal del carrusel con vistas condicionales */}
      <div 
        className="relative flex items-center justify-center w-full max-w-4xl h-[380px] overflow-hidden touch-pan-y select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {groups.map((group, idx) => {
          const isActive = idx === activeIndex;
          const isPrev = idx === (activeIndex - 1 + groups.length) % groups.length;
          const isNext = idx === (activeIndex + 1) % groups.length;

          // Animación paramétrica
          let transformStyle = "translateX(500%) scale(0.8)";
          let opacityStyle = "opacity-0";
          let blurStyle = "blur-md";
          let zIndex = "z-0";

          if (isActive) {
            transformStyle = "translateX(0) scale(1)";
            opacityStyle = "opacity-100";
            blurStyle = "blur-none";
            zIndex = "z-10";
          } else if (isPrev) {
            transformStyle = "translateX(-110%) scale(0.85)";
            opacityStyle = "opacity-60";
            blurStyle = "blur-[3px]";
            zIndex = "z-0";
          } else if (isNext) {
            transformStyle = "translateX(110%) scale(0.85)";
            opacityStyle = "opacity-60";
            blurStyle = "blur-[3px]";
            zIndex = "z-0";
          }

          // Solo renderizamos los que estén en pantalla (activo o adyacentes)
          const isVisible = isActive || isPrev || isNext;
          if (!isVisible) return null;

          return (
            <div
              key={group.letter}
              className={`absolute transition-all duration-500 ease-out will-change-transform ${opacityStyle} ${blurStyle} ${zIndex}`}
              style={{ transform: transformStyle }}
            >
              <TournamentCard view="group" groupLetter={group.letter} teams={group.teams} />
            </div>
          );
        })}
      </div>
      
      {/* Indicadores de progreso inferiores */}
      <div className="flex gap-2 mt-4">
        {groups.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
