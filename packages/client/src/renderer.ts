import RendererBootstrap from '@client/infrastructure/ui/RendererBootstrap';

function init() {
  const bootstrap = new RendererBootstrap();
  bootstrap.start(document.body);
}

window.addEventListener('DOMContentLoaded', init);
