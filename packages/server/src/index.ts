import Container from './di/Container';
import ServerApp from './server/ServerApp';

/**
 * Punto de entrada minimalista.
 * - Inicializa el contenedor de dependencias
 * - Crea ServerApp y lo arranca
 */
async function main() {
  try {
    const container = new Container();
    await container.initialize();

    const app = new ServerApp(container);
    await app.start();
  } catch (error) {
    console.error('[Server] ❌ Error al inicializar:', error);
    process.exit(1);
  }
}

main();
