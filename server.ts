import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { generateAiResult, type Persona } from './aiService';

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
    origin: 'http://localhost:3000',
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

httpServer.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
