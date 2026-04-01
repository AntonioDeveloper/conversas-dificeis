import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { generateAiResult, type Persona } from './services/aiService';

dotenv.config();

const app = express();
app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  }),
);

const port = Number(process.env.PORT ?? 3001);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'server', port });
});

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  socket.emit('server:ready', { ok: true, service: 'Socket IO' });

  socket.on('chat:test', (message: unknown, ack?: (data: unknown) => void) => {
    const text =
      typeof message === 'string' ? message : JSON.stringify(message);
    console.log('chat:test', text);
    ack?.({ ok: true, received: text });
  });

  socket.on(
    'chat:send',
    async (
      payload: { text: string; persona?: Persona; situation?: string },
      ack?: (data: unknown) => void,
    ) => {
      ack?.({ ok: true });

      try {
        const result = await generateAiResult({
          text: payload.text,
          persona: payload.persona ?? 'busy_boss',
          situation: payload.situation,
        });
        socket.emit('chat:ai_message', result);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Erro desconhecido.';
        socket.emit('chat:error', { ok: false, error: message });
      }
    },
  );
});

app.post('/enviar-mensagem', (req, res) => {
  const body = req.body as unknown;

  if (typeof body !== 'object' || body === null) {
    return res.status(400).json({ ok: false, error: 'Body inválido.' });
  }

  const text = (body as { text?: unknown }).text;
  const situation = (body as { situation?: unknown }).situation;
  const persona = (body as { persona?: unknown }).persona;

  if (typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ ok: false, error: 'Texto é obrigatório.' });
  }

  const normalizedSituation =
    typeof situation === 'string' && situation.trim().length > 0
      ? situation.trim()
      : undefined;

  const normalizedPersona: Persona =
    persona === 'busy_boss' ||
    persona === 'emotional_partner' ||
    persona === 'defensive_colleague' ||
    persona === 'collaborative_coworker' ||
    persona === 'demanding_client'
      ? persona
      : 'busy_boss';

  generateAiResult({
    text: text.trim(),
    persona: normalizedPersona,
    situation: normalizedSituation,
  })
    .then((result) => {
      res.status(200).json({ ok: true, result });
    })
    .catch((e) => {
      const message = e instanceof Error ? e.message : 'Erro desconhecido.';
      res.status(500).json({ ok: false, error: message });
    });
});

httpServer.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
