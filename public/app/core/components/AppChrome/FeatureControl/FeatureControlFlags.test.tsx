import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getLocalStorageProvider } from '@grafana/runtime/internal';

import { FeatureControlFlags } from './FeatureControlFlags';
import { FeatureControlContext } from './FeatureControlProvider';

const setIsAccessible = jest.fn();
const setIsOpen = jest.fn();
const setCorner = jest.fn();

const renderComponent = () => {
  return render(
    <FeatureControlContext.Provider
      value={{
        isAccessible: true,
        setIsAccessible,
        isOpen: true,
        setIsOpen,
        corner: 'bottom-right',
        setCorner,
      }}
    >
      <FeatureControlFlags />
    </FeatureControlContext.Provider>
  );
};

const getStorageKey = (flagName: string) => `grafana.openfeature.${flagName}`;

describe('FeatureControlFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    getLocalStorageProvider().clearFlags();
  });

  it('renders flags from local storage', async () => {
    getLocalStorageProvider().setFlags({ alpha: true, beta: 'custom-value' });

    renderComponent();

    expect(await screen.findByText('alpha')).toBeInTheDocument();
    expect(screen.getByText('beta')).toBeInTheDocument();
    expect(screen.getByText('custom-value')).toBeInTheDocument();
  });

  it('dismisses feature control', async () => {
    getLocalStorageProvider().setFlags({ alpha: true });

    renderComponent();

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await userEvent.click(screen.getByRole('menuitem', { name: /Remove UI and toolbar button/ }));

    expect(setIsOpen).toHaveBeenCalledWith(false);
    expect(setIsAccessible).toHaveBeenCalledWith(false);
    expect(window.localStorage.getItem(getStorageKey('alpha'))).toBe('true');
  });

  it('updates position when menu item is clicked', async () => {
    getLocalStorageProvider().setFlags({ alpha: true });

    renderComponent();

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Top left' }));

    expect(setCorner).toHaveBeenCalledWith('top-left');
  });

  it('changes position between different corners', async () => {
    getLocalStorageProvider().setFlags({ alpha: true });

    renderComponent();

    const corners = [
      { name: 'Top right', value: 'top-right' },
      { name: 'Bottom left', value: 'bottom-left' },
      { name: 'Bottom right', value: 'bottom-right' },
    ];

    for (const corner of corners) {
      jest.clearAllMocks();
      await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
      await userEvent.click(screen.getByRole('menuitem', { name: corner.name }));
      expect(setCorner).toHaveBeenCalledWith(corner.value);
    }
  });
});
