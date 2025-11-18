/** @jsxImportSource preact */
import { h } from 'preact';
import { render, cleanup } from '@testing-library/preact';
import { FpsWidget } from './FpsWidget';

afterEach(() => cleanup());

it('renders fps widget when visible', () => {
  const mockCtrl: any = { getFps: () => 60, isRunning: () => true, onChange: () => () => {} };
  const { container } = render(<FpsWidget controller={mockCtrl} />);
  expect(container.textContent).toContain('FPS: 60');
});
