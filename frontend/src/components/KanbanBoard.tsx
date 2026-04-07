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
};

// Mock data to demonstrate visual layout since NO db connection exists during scaffolding
const INITIAL_STAGES: Stage[] = [
  { id: "1", name: "New Lead" },
  { id: "2", name: "Contacted" },
  { id: "3", name: "Qualified" },
  { id: "4", name: "Closed Won" },
];

const INITIAL_LEADS: Lead[] = [
  {
    id: "lead-1",
    name: "John Doe",
    stageId: "1",
    lastMessagePreview: "I am interested in your SaaS product.",
    aiSummary: { shortSummary: "Wants a demo.", temperature: "warm" }
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
    
    // Update locally
    setLeads((prev) => 
      prev.map((l) => (l.id === leadId ? { ...l, stageId } : l))
    );

    // Normally send API PATCH /leads/:id/move here
    // fetch(`/api/leads/${leadId}/move`, { method: 'PATCH', body: JSON.stringify({ newStageId: stageId }) })
  };

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => (
        <div
          key={stage.id}
          className="flex flex-col bg-gray-100 min-w-[300px] w-[300px] rounded-lg shadow-sm border border-gray-200"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, stage.id)}
        >
          <div className="p-3 bg-gray-200 text-sm font-semibold text-gray-700 rounded-t-lg flex justify-between">
            <span>{stage.name}</span>
            <span className="bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full text-xs">
              {leads.filter((l) => l.stageId === stage.id).length}
            </span>
          </div>

          <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
            {leads
              .filter((l) => l.stageId === stage.id)
              .map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  className="bg-white p-4 rounded shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm text-gray-900">{lead.name || 'Unnamed Lead'}</h4>
                    {lead.aiSummary?.temperature === "hot" && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Hot 🔥</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-3 truncate" title={lead.lastMessagePreview}>
                    {lead.lastMessagePreview}
                  </p>
                  
                  {lead.aiSummary && (
                    <div className="bg-blue-50 border border-blue-100 p-2 rounded text-xs text-blue-800">
                      <strong>AI Info:</strong> {lead.aiSummary.shortSummary}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
