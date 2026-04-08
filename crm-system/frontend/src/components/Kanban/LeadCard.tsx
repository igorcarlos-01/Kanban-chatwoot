"use client";

import React from "react";

type Lead = {
  id: string;
  name: string;
  stageId: string;
  phoneNumber?: string;
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
            className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
          />
        ) : (
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_COLORS[colorIndex]} text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0`}>
            {getInitials(lead.name || "NN")}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h4 className="font-semibold text-[13px] text-gray-800 truncate leading-tight">
              {lead.name || "Sem Nome"}
            </h4>
            {/* Temperature dot */}
            {lead.aiSummary?.temperature === "hot" && (
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" title="Quente 🔥" />
            )}
            {lead.aiSummary?.temperature === "warm" && (
              <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" title="Morno ⚡" />
            )}
          </div>
          {lead.phoneNumber && (
            <p className="text-[11px] text-gray-400 truncate leading-tight">{lead.phoneNumber}</p>
          )}
        </div>
      </div>

      {/* Time + Tags Row */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-wrap min-w-0">
          {lead.tags && lead.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[9px] bg-brand-50 text-brand-700 px-1.5 py-px rounded font-medium border border-brand-100 truncate max-w-[80px]"
            >
              {tag}
            </span>
          ))}
          {lead.tags && lead.tags.length > 2 && (
            <span className="text-[9px] text-gray-400">+{lead.tags.length - 2}</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {timeLabel && (
            <span className="text-[10px] text-gray-400">{timeLabel}</span>
          )}

          {/* Chatwoot link — visible on hover */}
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

      {/* AI Summary — collapsed, expands on hover */}
      {lead.aiSummary?.shortSummary && (
        <div className="mt-2 max-h-0 group-hover:max-h-16 overflow-hidden transition-all duration-300 ease-in-out">
          <p className="text-[10px] text-gray-400 bg-gray-50 rounded px-2 py-1 leading-relaxed">
            🤖 {lead.aiSummary.shortSummary}
          </p>
        </div>
      )}
    </div>
  );
}
