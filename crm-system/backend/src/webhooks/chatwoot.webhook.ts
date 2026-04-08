import { Router } from 'express';
import { prisma, io } from '../index';
import { AiService } from '../services/ai.service';
import { Queue } from 'bullmq';

const router = Router();

const eventQueue = new Queue('chatwoot-events', {
  connection: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379
  }
});

router.post('/', async (req, res) => {
  const payload = req.body;
  const event = payload.event;

  console.log(`[Webhook] Received event: ${event}`);

  try {
    // ============================================================
    // NOVA MENSAGEM → Criar/atualizar lead + auto-assign ao pipeline
    // ============================================================
    if (event === 'message_created') {
      const convId = payload.conversation?.id;
      const contact = payload.sender;
      if (!convId || !contact) return res.status(200).send('OK');

      // Pegar avatar direto do contato do Chatwoot
      const avatarUrl = contact.thumbnail || contact.avatar_url || null;

      const lead = await prisma.lead.upsert({
        where: { chatwootConversationId: convId },
        update: {
          lastMessagePreview: payload.content,
          lastInteractionAt: new Date(),
          // Atualizar nome e avatar caso tenham mudado
          ...(contact.name && { name: contact.name }),
          ...(avatarUrl && { customAttributes: { avatarUrl } }),
        },
        create: {
          chatwootConversationId: convId,
          chatwootContactId: contact.id,
          chatwootAccountId: payload.account?.id,
          name: contact.name,
          phoneNumber: contact.phone_number,
          channel: payload.conversation?.channel,
          lastMessagePreview: payload.content,
          lastInteractionAt: new Date(),
          customAttributes: { avatarUrl },
        }
      });

      // Auto-assign ao pipeline principal (primeira etapa)
      const pipeline = await prisma.pipeline.findFirst({
        include: { stages: { orderBy: { sortOrder: 'asc' } } }
      });

      if (pipeline && pipeline.stages.length > 0) {
        await prisma.pipelineLead.upsert({
          where: { leadId_pipelineId: { leadId: lead.id, pipelineId: pipeline.id } },
          update: {},
          create: {
            leadId: lead.id,
            pipelineId: pipeline.id,
            stageId: pipeline.stages[0].id
          }
        });
      }

      // IA em background
      if (payload.message_type === 'incoming') {
        await eventQueue.add('summarize-lead', {
          leadId: lead.id,
          messageContent: payload.content
        });
      }

      // Notificar frontend com dados completos
      const fullLead = await prisma.lead.findUnique({
        where: { id: lead.id },
        include: {
          aiSummary: true,
          pipelineLeads: { include: { stage: true }, take: 1 }
        }
      });

      io.emit('lead_updated', {
        id: fullLead?.id,
        name: fullLead?.name,
        phoneNumber: fullLead?.phoneNumber,
        stageId: fullLead?.pipelineLeads[0]?.stageId,
        lastMessagePreview: fullLead?.lastMessagePreview,
        aiSummary: fullLead?.aiSummary,
        avatarUrl: (fullLead?.customAttributes as any)?.avatarUrl || null,
        tags: fullLead?.tags || [],
        chatwootConversationId: fullLead?.chatwootConversationId,
        movedAt: fullLead?.pipelineLeads[0]?.movedAt?.toISOString(),
      });
    }

    // ============================================================
    // CONVERSA RESOLVIDA → Mover lead para última etapa (Pós-venda)
    // ============================================================
    if (event === 'conversation_status_changed') {
      const convId = payload.id || payload.conversation?.id;
      const newStatus = payload.status || payload.current_status;

      if (convId && newStatus === 'resolved') {
        const lead = await prisma.lead.findUnique({
          where: { chatwootConversationId: convId }
        });

        if (lead) {
          // Encontrar pipeline e última etapa
          const pipeline = await prisma.pipeline.findFirst({
            include: { stages: { orderBy: { sortOrder: 'desc' } } }
          });

          if (pipeline && pipeline.stages.length > 0) {
            const lastStage = pipeline.stages[0]; // Último estágio (maior sortOrder)

            await prisma.pipelineLead.upsert({
              where: { leadId_pipelineId: { leadId: lead.id, pipelineId: pipeline.id } },
              update: { stageId: lastStage.id, movedAt: new Date() },
              create: {
                leadId: lead.id,
                pipelineId: pipeline.id,
                stageId: lastStage.id,
              }
            });

            await prisma.lead.update({
              where: { id: lead.id },
              data: { status: 'resolved' }
            });

            console.log(`[Webhook] Lead ${lead.name} movido para "${lastStage.name}" (conversa resolvida)`);
            io.emit('stages_updated');
          }
        }
      }

      // Conversa reaberta → mover para primeira etapa
      if (convId && newStatus === 'open') {
        const lead = await prisma.lead.findUnique({
          where: { chatwootConversationId: convId }
        });

        if (lead) {
          const pipeline = await prisma.pipeline.findFirst({
            include: { stages: { orderBy: { sortOrder: 'asc' } } }
          });

          if (pipeline && pipeline.stages.length > 0) {
            await prisma.pipelineLead.upsert({
              where: { leadId_pipelineId: { leadId: lead.id, pipelineId: pipeline.id } },
              update: { stageId: pipeline.stages[0].id, movedAt: new Date() },
              create: {
                leadId: lead.id,
                pipelineId: pipeline.id,
                stageId: pipeline.stages[0].id,
              }
            });

            await prisma.lead.update({
              where: { id: lead.id },
              data: { status: 'open' }
            });

            console.log(`[Webhook] Lead ${lead.name} movido para "${pipeline.stages[0].name}" (conversa reaberta)`);
            io.emit('stages_updated');
          }
        }
      }
    }

    // ============================================================
    // CONTATO ATUALIZADO → Sincronizar nome, telefone, avatar
    // ============================================================
    if (event === 'contact_updated' || event === 'contact_created') {
      const contact = payload.contact || payload;
      const contactId = contact.id;

      if (contactId) {
        const lead = await prisma.lead.findFirst({
          where: { chatwootContactId: contactId }
        });

        if (lead) {
          const avatarUrl = contact.thumbnail || contact.avatar_url || null;
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              name: contact.name || lead.name,
              phoneNumber: contact.phone_number || lead.phoneNumber,
              ...(avatarUrl && { customAttributes: { avatarUrl } }),
            }
          });
          console.log(`[Webhook] Contato ${contact.name} sincronizado`);
          io.emit('stages_updated');
        }
      }
    }

    // ============================================================
    // LABELS/TAGS ATUALIZADAS → Sincronizar pro CRM
    // ============================================================
    if (event === 'conversation_updated') {
      const convId = payload.id || payload.conversation?.id;
      const labels = payload.labels || payload.conversation?.labels;

      if (convId && labels) {
        const lead = await prisma.lead.findUnique({
          where: { chatwootConversationId: convId }
        });

        if (lead) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { tags: labels }
          });
          console.log(`[Webhook] Tags sincronizadas para lead ${lead.name}: ${labels.join(', ')}`);
          io.emit('stages_updated');
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Server Error');
  }
});

export default router;
