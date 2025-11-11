import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import { GameState, GameTick } from '@spaceducks/core';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

const server = http.createServer(app);
const io = new IOServer(server, {
  cors: {
    origin: '*'
  }
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected ${socket.id} (${reason})`);
  });
});


// --- Redis persistence example ---
import { RedisGameStateRepository } from './persistence/RedisGameStateRepository';
const gameStateRepo = new RedisGameStateRepository();

let tick = 0;
const TICK_RATE = 20; // ticks per second
const DT_MS = 1000 / TICK_RATE;

let gameState: GameState = {
  tick,
  players: {},
  npcs: {}
};

setInterval(async () => {
  tick += 1;
  const gameTick: GameTick = {
    tick,
    dt: DT_MS,
    time: Date.now()
  };
  io.emit('tick', gameTick);
  gameState.tick = tick;
  await gameStateRepo.save(gameState);
}, DT_MS);

server.listen(port, () => {
  console.log(`SpaceDucks server listening on http://localhost:${port}`);
});
