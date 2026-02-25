const { createCanvas } = require('canvas');

window.HTMLCanvasElement.prototype.getContext = function (contextType) {
  if (contextType === '2d') {
    return createCanvas(1, 1).getContext('2d');
  }
  return null;
};

// Mock localStorage for wasmoon/jsdom compatibility
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
