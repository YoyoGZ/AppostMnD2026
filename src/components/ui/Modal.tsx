"use client";

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  // Cerrar con Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a0a1a] border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300">
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-[#0a0a1a]/80 backdrop-blur-md border-b border-white/5">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic italic">
            <span className="text-primary mr-2">//</span> {title}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-2 md:p-6">
          {children}
        </div>

        <div className="p-6 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold uppercase tracking-widest text-xs transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
