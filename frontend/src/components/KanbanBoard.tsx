import { useEffect, useState } from "react";
import { socket } from "../lib/socket";

type Lead = {
  id: string;
  name: string;
  stageId: string;
  lastMessagePreview: string;
  aiSummary?: { shortSummary: string; temperature: string };
  avatarUrl?: string;
  tags?: string[];
  phone?: string;
};

type Stage = {
  id: string;
  name: string;
  color: string;
};

// Dados Fictícios (Mock) para demonstração. O Webhook irá alimentar isso na vida real.
const INITIAL_STAGES: Stage[] = [
  { id: "1", name: "Caixa de Entrada 📥", color: "bg-blue-50 border-blue-200 text-blue-700" },
  { id: "2", name: "Em Atendimento 💬", color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
  { id: "3", name: "Qualificação 🔥", color: "bg-orange-50 border-orange-200 text-orange-700" },
  { id: "4", name: "Fechamento 🎯", color: "bg-green-50 border-green-200 text-green-700" },
];

const INITIAL_LEADS: Lead[] = [
  {
    id: "lead-1",
    name: "João Silva",
    stageId: "1",
    lastMessagePreview: "Olá, gostaria de saber os valores do sistema.",
    aiSummary: { shortSummary: "Interesse inicial em preços.", temperature: "warm" },
    avatarUrl: "https://i.pravatar.cc/150?u=joao",
    tags: ["Novo Cliente", "Dúvida"],
    phone: "5511999999999"
  },
  {
    id: "lead-2",
    name: "Maria Oliveira",
    stageId: "3",
    lastMessagePreview: "Podemos agendar uma demonstração amanhã?",
    aiSummary: { shortSummary: "Cliente com alto potencial. Pronta para demonstração.", temperature: "hot" },
    tags: ["VIP", "Urgente", "Agendamento"],
    phone: "5511988888888"
  },
];

export default function KanbanBoard() {
  const [stages, setStages] = useState<Stage[]>(INITIAL_STAGES);
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);

  useEffect(() => {
    socket.on("lead_updated", (updatedLead: Lead) => {
      setLeads((prev) => {
        const exists = prev.find(l => l.id === updatedLead.id);
        if (exists) return prev.map(l => l.id === updatedLead.id ? { ...l, ...updatedLead } : l);
        return [...prev, updatedLead];
      });
    });

    return () => {
      socket.off("lead_updated");
    };
  }, []);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    
    setLeads((prev) => 
      prev.map((l) => (l.id === leadId ? { ...l, stageId } : l))
    );
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen bg-slate-50 p-6 overflow-x-auto gap-6 font-sans">
      {stages.map((stage) => (
        <div
          key={stage.id}
          className={`flex flex-col min-w-[320px] w-[320px] rounded-xl shadow-sm border bg-white/50 backdrop-blur-md transition-all duration-200`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, stage.id)}
        >
          <div className={`p-4 font-bold text-sm rounded-t-xl flex justify-between items-center border-b ${stage.color}`}>
            <span className="tracking-wide uppercase">{stage.name}</span>
            <span className="bg-white/60 px-2.5 py-1 rounded-full text-xs font-black shadow-sm">
              {leads.filter((l) => l.stageId === stage.id).length}
            </span>
          </div>

          <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
            {leads
              .filter((l) => l.stageId === stage.id)
              .map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 transition-all group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-2 max-w-[70%]">
                       {lead.avatarUrl ? (
                         <img src={lead.avatarUrl} alt={lead.name} className="w-9 h-9 rounded-full object-cover shadow-sm border border-slate-200 flex-shrink-0" />
                       ) : (
                         <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-inner flex-shrink-0">
                           {getInitials(lead.name || 'NN')}
                         </div>
                       )}
                       <div>
                         <h4 className="font-bold text-sm text-slate-800 leading-tight mb-1">{lead.name || 'Cliente Sem Nome'}</h4>
                         <div className="flex gap-1 flex-wrap">
                           {lead.tags?.map(tag => (
                             <span key={tag} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold border border-slate-200 uppercase tracking-wider">{tag}</span>
                           ))}
                         </div>
                       </div>
                    </div>
                    {lead.aiSummary?.temperature === "hot" && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse shadow-sm border border-red-200 flex-shrink-0">Quente 🔥</span>
                    )}
                    {lead.aiSummary?.temperature === "warm" && (
                      <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider border border-yellow-200 flex-shrink-0">Morno ⚡</span>
                    )}
                  </div>
                  
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 mb-3">
                    <p className="text-xs text-slate-500 truncate" title={lead.lastMessagePreview}>
                      <span className="font-semibold text-slate-400">Última msg: </span>{lead.lastMessagePreview}
                    </p>
                  </div>
                  
                  {lead.aiSummary && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-2.5 rounded-lg text-xs text-blue-800 shadow-inner">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-indigo-600">🤖</span>
                        <strong className="text-indigo-900 font-semibold">Resumo da IA:</strong> 
                      </div>
                      <span className="leading-relaxed">{lead.aiSummary.shortSummary}</span>
                    </div>
                  )}
                  
                  {lead.phone && (
                    <a 
                      href={`https://wa.me/${lead.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-1.5 w-full bg-[#25D366] text-white py-2 rounded-lg text-xs font-bold hover:bg-[#1ebd5a] transition-colors shadow-sm"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                      Conversar no WhatsApp
                    </a>
                  )}
                </div>
              ))}
              
              {leads.filter((l) => l.stageId === stage.id).length === 0 && (
                <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-medium">
                  Arraste cards para cá
                </div>
              )}
          </div>
        </div>
      ))}
    </div>
  );
}
