import { useEffect, useState } from "react";
import { socket } from "../lib/socket";

type Lead = {
  id: string;
  name: string;
  stageId: string;
  lastMessagePreview: string;
  aiSummary?: { shortSummary: string; temperature: string };
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
    aiSummary: { shortSummary: "Interesse inicial em preços.", temperature: "warm" }
  },
  {
    id: "lead-2",
    name: "Maria Oliveira",
    stageId: "3",
    lastMessagePreview: "Podemos agendar uma demonstração amanhã?",
    aiSummary: { shortSummary: "Cliente com alto potencial. Pronta para demonstração.", temperature: "hot" }
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
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-inner">
                         {getInitials(lead.name || 'NN')}
                       </div>
                       <h4 className="font-bold text-sm text-slate-800">{lead.name || 'Cliente Sem Nome'}</h4>
                    </div>
                    {lead.aiSummary?.temperature === "hot" && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse shadow-sm border border-red-200">Quente 🔥</span>
                    )}
                    {lead.aiSummary?.temperature === "warm" && (
                      <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider border border-yellow-200">Morno ⚡</span>
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
