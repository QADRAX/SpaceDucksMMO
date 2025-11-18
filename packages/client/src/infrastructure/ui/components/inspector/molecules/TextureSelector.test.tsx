/** @jsxImportSource preact */
import { h } from 'preact';
import { render, cleanup } from '@testing-library/preact';
import TextureSelector from './TextureSelector';

afterEach(() => cleanup());

describe('TextureSelector', () => {
  it('renders and shows no textures message', () => {
    const { container } = render(<TextureSelector value={null} onChange={() => {}} />);
    expect(container.querySelector('.small-label')?.textContent).toContain('No textures');
  });
});
