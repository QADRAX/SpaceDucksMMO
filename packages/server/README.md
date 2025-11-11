
## Persistencia con Redis

Para usar Redis como almacenamiento del estado del juego, configura la variable de entorno `REDIS_URL` (por defecto usa `redis://localhost:6379`).

Implementación: `src/persistence/RedisGameStateRepository.ts`.

Ejemplo de uso:

```typescript
import { RedisGameStateRepository } from './persistence/RedisGameStateRepository';
const repo = new RedisGameStateRepository();
await repo.save(gameState);
const loaded = await repo.load();
```
# @spaceducks/server

Simple server for SpaceDucks MMO.

This package contains an Express server with Socket.IO that emits `tick` events (type `GameTick` from `@spaceducks/core`). It's intended as a minimal scaffold to start building the authoritative server.

Scripts

- `npm run dev` - start the server using `ts-node-dev` for hot reload during development
- `npm run build` - compile TypeScript to `dist`
- `npm run start` - run the compiled JS from `dist`

How to run

From repository root:

```powershell
cd F:\Repos\SpaceDucksMMO
npm install
npm --workspace @spaceducks/server run dev
```

Or build and start:

```powershell
npm --workspace @spaceducks/server run build
npm --workspace @spaceducks/server run start
```
