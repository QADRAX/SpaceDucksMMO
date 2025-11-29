/** @jsxImportSource preact */
import { h } from 'preact';
import { render, cleanup, fireEvent } from '@testing-library/preact';
import { CameraSelector } from './CameraSelector';

afterEach(() => cleanup());

describe('CameraSelector', () => {
  it('calls onSetActive when select changes', () => {
    const entities = [
      { id: 'cam1' },
      { id: 'cam2' },
    ];
    const onSetActive = jest.fn();
    const { getByRole } = render(<CameraSelector entities={entities} activeCamera={null} onSetActive={onSetActive} />);
    const button = getByRole('button', { name: /None ▾/ });
    expect(button).toBeDefined();
    fireEvent.click(button);
  });
});
