import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import chatwootWebhookRouter from './webhooks/chatwoot.webhook';
import "dotenv/config";

const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: { origin: '*' }
});

export const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/webhooks/chatwoot', chatwootWebhookRouter);

app.get('/api/pipelines', async (req, res) => {
  const pipelines = await prisma.pipeline.findMany({
    include: { stages: { orderBy: { sortOrder: 'asc' } } }
  });
  res.json(pipelines);
});

app.get('/api/pipelines/:id/board', async (req, res) => {
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
});

app.patch('/api/leads/:leadId/move', async (req, res) => {
  const { leadId } = req.params;
  const { pipelineId, newStageId } = req.body;

  const lead = await prisma.pipelineLead.update({
    where: { leadId_pipelineId: { leadId, pipelineId } },
    data: { stageId: newStageId, movedAt: new Date() }
  });

  // Broadcast to all clients
  io.emit(`pipeline_updated_${pipelineId}`, {
    event: 'lead_moved',
    data: lead
  });

  // Trigger automation (stage entry)
  // automationService.triggerEvent('stage_entry', { pipelineId, stageId: newStageId, leadId });

  res.json(lead);
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
