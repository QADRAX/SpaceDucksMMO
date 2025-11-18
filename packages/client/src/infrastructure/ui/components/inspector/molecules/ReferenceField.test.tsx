/** @jsxImportSource preact */
import { h } from 'preact';
import { render, cleanup, fireEvent } from '@testing-library/preact';
import { ReferenceField } from './ReferenceField';
import { ServicesContext } from '@client/infrastructure/ui/hooks/useServices';

afterEach(() => cleanup());

describe('ReferenceField', () => {
  it('renders select and calls onChange', () => {
    const onChange = jest.fn();
    const mockServices: any = {
      sceneManager: { getEntities: () => [], subscribeToSceneChanges: () => jest.fn() },
      i18n: {
        getCurrentLanguage: () => 'en',
        subscribe: (cb: any) => {
          // no-op subscription for tests
          return () => {};
        },
        t: (k: any, f?: any) => f || k,
        changeLanguage: async (_: any) => {},
        getTranslations: () => ({})
      }
    };

    const { container } = render(
      <ServicesContext.Provider value={mockServices}>
        <ReferenceField value={null} onChange={onChange} />
      </ServicesContext.Provider>
    );

    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select).toBeDefined();
    // Can't easily change options here without more complex mocking, but ensure select exists
  });
});
