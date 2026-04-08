import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import chatwootWebhookRouter from './webhooks/chatwoot.webhook';
import { AutomationService } from './services/automation.service';
import "dotenv/config";

const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: { origin: '*' }
});

export const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// ============================================================
// WEBHOOKS
// ============================================================
app.use('/api/webhooks/chatwoot', chatwootWebhookRouter);

// ============================================================
// PIPELINES
// ============================================================
app.get('/api/pipelines', async (_req, res) => {
  try {
    const pipelines = await prisma.pipeline.findMany({
      include: { stages: { orderBy: { sortOrder: 'asc' } } }
    });
    res.json(pipelines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar pipelines' });
  }
});

app.get('/api/pipelines/:id/board', async (req, res) => {
  try {
    const pipelineId = req.params.id;
    const board = await prisma.pipelineLead.findMany({
      where: { pipelineId },
      include: {
        lead: {
          include: { aiSummary: true }
        }
      }
    });
    res.json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar board' });
  }
});

// ============================================================
// STAGES CRUD
// ============================================================
app.post('/api/pipelines/:id/stages', async (req, res) => {
  try {
    const pipelineId = req.params.id;
    const { name } = req.body;

    // Buscar o maior sortOrder existente
    const lastStage = await prisma.stage.findFirst({
      where: { pipelineId },
      orderBy: { sortOrder: 'desc' }
    });

    const stage = await prisma.stage.create({
      data: {
        pipelineId,
        name: name || 'Nova Etapa',
        sortOrder: (lastStage?.sortOrder || 0) + 1,
      }
    });

    io.emit('stages_updated');
    res.status(201).json(stage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar etapa' });
  }
});

app.patch('/api/stages/:id', async (req, res) => {
  try {
    const { name, sortOrder } = req.body;
    const stage = await prisma.stage.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(sortOrder !== undefined && { sortOrder }),
      }
    });
    io.emit('stages_updated');
    res.json(stage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar etapa' });
  }
});

app.delete('/api/stages/:id', async (req, res) => {
  try {
    const stageId = req.params.id;
    const stage = await prisma.stage.findUnique({ where: { id: stageId } });
    if (!stage) return res.status(404).json({ error: 'Etapa não encontrada' });

    // Mover leads órfãos para o primeiro estágio do pipeline
    const firstStage = await prisma.stage.findFirst({
      where: { pipelineId: stage.pipelineId, id: { not: stageId } },
      orderBy: { sortOrder: 'asc' }
    });

    if (firstStage) {
      await prisma.pipelineLead.updateMany({
        where: { stageId },
        data: { stageId: firstStage.id }
      });
    }

    await prisma.stage.delete({ where: { id: stageId } });

    io.emit('stages_updated');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar etapa' });
  }
});

// ============================================================
// LEAD MOVEMENT
// ============================================================
app.patch('/api/leads/:leadId/move', async (req, res) => {
  try {
    const { leadId } = req.params;
    const { pipelineId, newStageId } = req.body;

    const updated = await prisma.pipelineLead.update({
      where: { leadId_pipelineId: { leadId, pipelineId } },
      data: { stageId: newStageId, movedAt: new Date() }
    });

    io.emit(`pipeline_updated_${pipelineId}`, {
      event: 'lead_moved',
      data: updated
    });

    // Disparar automações
    AutomationService.triggerEvent('stage_entry', { pipelineId, stageId: newStageId, leadId });

    // ===== AUTO-SYNC: Atualizar label da conversa no Chatwoot =====
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    const stage = await prisma.stage.findUnique({ where: { id: newStageId } });

    if (lead?.chatwootConversationId && stage) {
      const CHATWOOT_URL = process.env.CHATWOOT_BASE_URL || 'https://chatwoot.centraltizze.com';
      const CHATWOOT_TOKEN = process.env.CHATWOOT_API_TOKEN || '';
      const accountId = lead.chatwootAccountId || 1;

      // Formatar nome da etapa como label (sem espaços, lowercase)
      const stageLabel = stage.name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
        .toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

      try {
        await fetch(`${CHATWOOT_URL}/api/v1/accounts/${accountId}/conversations/${lead.chatwootConversationId}/labels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api_access_token': CHATWOOT_TOKEN,
          },
          body: JSON.stringify({ labels: [stageLabel] })
        });
        console.log(`[Sync] Label "${stageLabel}" aplicada na conversa ${lead.chatwootConversationId}`);
      } catch (syncErr) {
        console.error('[Sync] Falha ao sincronizar label com Chatwoot:', syncErr);
      }
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao mover lead' });
  }
});

// ============================================================
// AUTOMATIONS CRUD
// ============================================================
app.get('/api/pipelines/:id/automations', async (req, res) => {
  try {
    const automations = await prisma.automation.findMany({
      where: { pipelineId: req.params.id },
      include: { stage: true }
    });
    res.json(automations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar automações' });
  }
});

app.post('/api/automations', async (req, res) => {
  try {
    const { pipelineId, stageId, triggerType, actions } = req.body;
    const automation = await prisma.automation.create({
      data: { pipelineId, stageId, triggerType, actions }
    });
    res.status(201).json(automation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar automação' });
  }
});

app.delete('/api/automations/:id', async (req, res) => {
  try {
    await prisma.automation.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar automação' });
  }
});

// ============================================================
// DASHBOARD
// ============================================================
app.get('/api/dashboard', async (_req, res) => {
  try {
    const totalContacts = await prisma.lead.count();

    const pipeline = await prisma.pipeline.findFirst({
      include: { stages: { orderBy: { sortOrder: 'asc' } } }
    });

    let leadsByStage: { stageName: string; stageId: string; count: number }[] = [];
    if (pipeline) {
      const counts = await prisma.pipelineLead.groupBy({
        by: ['stageId'],
        where: { pipelineId: pipeline.id },
        _count: { stageId: true }
      });

      leadsByStage = pipeline.stages.map(stage => ({
        stageName: stage.name,
        stageId: stage.id,
        count: counts.find(c => c.stageId === stage.id)?._count?.stageId || 0,
      }));
    }

    // Leads criados nos últimos 30 dias agrupados por dia
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLeads = await prisma.lead.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true }
    });

    const leadsByDay: Record<string, number> = {};
    recentLeads.forEach(l => {
      const day = l.createdAt.toISOString().split('T')[0];
      leadsByDay[day] = (leadsByDay[day] || 0) + 1;
    });

    // Últimos 10 leads
    const latestLeads = await prisma.lead.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        pipelineLeads: {
          include: { stage: true },
          take: 1
        }
      }
    });

    const activeAutomations = await prisma.automation.count({ where: { isActive: true } });

    res.json({
      totalContacts,
      leadsByStage,
      leadsByDay,
      activeAutomations,
      latestLeads: latestLeads.map(l => ({
        id: l.id,
        name: l.name || 'Sem Nome',
        phone: l.phoneNumber,
        channel: l.channel,
        stage: l.pipelineLeads[0]?.stage?.name || 'Sem Etapa',
        createdAt: l.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar dashboard' });
  }
});

// ============================================================
// SOCKET.IO
// ============================================================
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ============================================================
// STARTUP
// ============================================================
async function ensureDefaultPipeline() {
  try {
    const existing = await prisma.pipeline.findFirst();
    if (!existing) {
      await prisma.pipeline.create({
        data: {
          name: 'Funil de Vendas Principal',
          stages: {
            create: [
              { name: 'Qualificação', sortOrder: 1 },
              { name: 'Apresentação', sortOrder: 2 },
              { name: 'Consideração', sortOrder: 3 },
              { name: 'Negociação', sortOrder: 4 },
              { name: 'Perdido', sortOrder: 5 },
              { name: 'Pós-venda', sortOrder: 6 },
            ]
          }
        }
      });
      console.log('✅ Pipeline padrão criado automaticamente!');
    }
  } catch (err) {
    console.error('Failed to create default pipeline', err);
  }
}

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, async () => {
  await ensureDefaultPipeline();
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
