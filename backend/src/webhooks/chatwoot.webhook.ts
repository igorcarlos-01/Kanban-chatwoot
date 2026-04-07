import { Router } from 'express';
import { prisma, io } from '../index';
import { AiService } from '../services/ai.service';
import { Queue } from 'bullmq';

const router = Router();
// Setting up a basic queue for background tasks
// In production, this would connect to Redis properly
const eventQueue = new Queue('chatwoot-events', { connection: { host: process.env.REDIS_HOST || '127.0.0.1', port: Number(process.env.REDIS_PORT) || 6379 } });

router.post('/', async (req, res) => {
  const payload = req.body;
  const event = payload.event;

  try {
    if (event === 'message_created') {
      const convId = payload.conversation.id;
      const contact = payload.sender;

      // Upsert lead based on chatwoot details
      const lead = await prisma.lead.upsert({
        where: { chatwootConversationId: convId },
        update: {
          lastMessagePreview: payload.content,
          lastInteractionAt: new Date()
        },
        create: {
          chatwootConversationId: convId,
          chatwootContactId: contact.id,
          chatwootAccountId: payload.account?.id,
          name: contact.name,
          phoneNumber: contact.phone_number,
          channel: payload.conversation.channel,
          lastMessagePreview: payload.content,
          lastInteractionAt: new Date()
        }
      });

      // Optionally process the AI summary in background
      if (payload.message_type === 'incoming') {
         await eventQueue.add('summarize-lead', {
           leadId: lead.id,
           messageContent: payload.content
         });
      }

      // Notify frontend
      io.emit('lead_updated', lead);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Server Error');
  }
});

export default router;
