const { createCanvas } = require('canvas');

window.HTMLCanvasElement.prototype.getContext = function (contextType) {
  if (contextType === '2d') {
    return createCanvas(1, 1).getContext('2d');
  }
  return null;
};
