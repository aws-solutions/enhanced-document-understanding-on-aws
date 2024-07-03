import { RenderOptions, render } from '@testing-library/react';
import { RootState } from '../../store/reducers/rootReducer';
import { AppStore, setupStore } from '../../store/store';
import { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';
import { setupListeners } from '@reduxjs/toolkit/query';
import { BrowserRouter } from 'react-router-dom';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
    preloadedState?: Partial<RootState>;
    store?: AppStore;
    mode?: 'deep' | 'shallow';
    routerProvided?: boolean;
}

export function renderWithProviders(
    ui: React.ReactElement,
    {
        preloadedState = {},
        store = setupStore(preloadedState),
        mode = 'deep',
        routerProvided = true,
        ...renderOptions
    }: ExtendedRenderOptions = {}
) {
    setupListeners(store.dispatch);
    function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
        if (routerProvided) {
            return <Provider store={store}>{children}</Provider>;
        } else {
            return (
                <Provider store={store}>
                    <BrowserRouter>{children}</BrowserRouter>
                </Provider>
            );
        }
    }

    return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

export function renderWithProvidersAndUserSetup(
    ui: React.ReactElement,
    extendedRenderOptions: ExtendedRenderOptions = {}
) {
    return {
        user: userEvent.setup(),
        ...renderWithProviders(ui, extendedRenderOptions)
    };
}
