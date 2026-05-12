"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { sendLeagueMessageAction } from '@/app/actions/leagues';

interface Message {
  id: string;
  sender_alias: string;
  content: string;
  created_at: string;
  user_id: string;
}

interface LeagueChatProps {
  leagueId: string;
  currentUserId: string | null;
}

export function LeagueChat({ leagueId, currentUserId }: LeagueChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    // 1. Cargar mensajes iniciales
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('league_messages')
        .select('*')
        .eq('league_id', leagueId)
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (data) setMessages(data);
    };

    fetchMessages();

    // 2. Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel(`league_chat_${leagueId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'league_messages',
          filter: `league_id=eq.${leagueId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leagueId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const res = await sendLeagueMessageAction(leagueId, newMessage);
    if (res.success) {
      setNewMessage("");
    } else {
      console.error("Error enviando mensaje:", res.error);
    }
    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-[500px] bg-white/[0.03] border border-white/10 rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Header del Chat */}
      <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Chat de Liga</h3>
            <p className="text-[10px] text-white/40 font-medium">Gladiadores en línea</p>
          </div>
        </div>
      </div>

      {/* Cuerpo del Chat */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
            <MessageSquare className="w-12 h-12 mb-4" />
            <p className="text-sm italic">No hay mensajes aún. ¡Sé el primero en calentar el ambiente!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === currentUserId;
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  {!isMe && <span className="text-[9px] font-black uppercase tracking-widest text-primary">{msg.sender_alias}</span>}
                  <span className="text-[8px] text-white/20">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe 
                    ? 'bg-primary text-black font-medium rounded-tr-none shadow-[0_4px_15px_rgba(251,191,36,0.2)]' 
                    : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input de Mensaje */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/10">
        <div className="relative flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 pr-16 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="absolute right-2 p-3 bg-primary text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
