const { createCanvas } = require('canvas');

// Keep parity with client tests that expect a canvas-capable jsdom.
window.HTMLCanvasElement.prototype.getContext = function (contextType) {
  if (contextType === '2d') {
    return createCanvas(1, 1).getContext('2d');
  }
  return null;
};
