"use client";

import React from "react";

type Lead = {
  id: string;
  name: string;
  stageId: string;
  phoneNumber?: string;
  channel?: string;
  lastMessagePreview: string;
  aiSummary?: { shortSummary: string; temperature: string };
  avatarUrl?: string;
  tags?: string[];
  chatwootConversationId?: number;
  movedAt?: string;
};

interface LeadCardProps {
  lead: Lead;
  onDragStart: (e: React.DragEvent, leadId: string) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getTimeInStage(movedAt?: string): string {
  if (!movedAt) return "";
  const diff = Date.now() - new Date(movedAt).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (days > 0) return `há ${days}d na fila`;
  if (hours > 0) return `há ${hours}h na fila`;
  return "agora";
}

const AVATAR_COLORS = [
  "from-emerald-400 to-teal-500",
  "from-blue-400 to-indigo-500",
  "from-purple-400 to-pink-500",
  "from-orange-400 to-red-400",
  "from-cyan-400 to-blue-500",
  "from-rose-400 to-pink-500",
];

export default function LeadCard({ lead, onDragStart }: LeadCardProps) {
  const colorIndex = (lead.name || "A").charCodeAt(0) % AVATAR_COLORS.length;
  const timeLabel = getTimeInStage(lead.movedAt);

  // Lógica para definir o responsável
  const responsible = lead.chatwootConversationId ? (lead.tags?.includes('atendimento_humano') ? "Equipe Humana" : "Agente Virtual") : "Não atribuído";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      className="bg-white px-3 py-2.5 rounded-lg shadow-card border border-gray-100/80 cursor-grab active:cursor-grabbing hover:shadow-card-hover hover:border-brand/20 transition-all duration-150 group"
    >
      {/* Row: Avatar + Info */}
      <div className="flex items-center gap-2.5">
        {lead.avatarUrl ? (
          <img
            src={lead.avatarUrl}
            alt={lead.name}
            className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
          />
        ) : (
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${AVATAR_COLORS[colorIndex]} text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>
            {getInitials(lead.name || "NN")}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h4 className="font-semibold text-[13px] text-gray-800 truncate leading-tight">
              {lead.name || "Sem Nome"}
            </h4>
            <span className="text-[9px] uppercase font-bold text-gray-400">{lead.channel || 'web'}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${responsible === "Agente Virtual" ? "bg-purple-400" : "bg-blue-400"}`} />
            <p className="text-[10px] text-gray-500 font-medium">{responsible}</p>
          </div>
        </div>
      </div>

      {/* Time + Tags Row */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-wrap min-w-0">
          {lead.tags && lead.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-px rounded font-medium border border-gray-200 truncate max-w-[80px]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {timeLabel && (
            <span className="text-[10px] text-gray-400">{timeLabel}</span>
          )}

          {lead.chatwootConversationId && (
            <a
              href={`https://chatwoot.centraltizze.com/app/accounts/1/conversations/${lead.chatwootConversationId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-6 h-6 rounded-md bg-brand/10 text-brand flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand/20"
              title="Abrir no Chatwoot"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
