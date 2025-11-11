import { ThreeRenderer } from '@client/infrastructure/rendering/ThreeRenderer';
import { SceneService } from '@client/application/SceneService';

function init() {
  // Prepare container
  document.body.style.margin = '0';
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.inset = '0';
  document.body.appendChild(container);

  // Composition root for renderer
  const engine = new ThreeRenderer();
  const sceneService = new SceneService(engine);
  sceneService.init(container);
  sceneService.start();
}

window.addEventListener('DOMContentLoaded', init);
